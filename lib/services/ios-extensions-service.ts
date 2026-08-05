import * as path from "path";
import {
	IOSNativeTargetProductTypes,
	IOSNativeTargetTypes,
} from "../constants";
import {
	IIOSNativeTargetService,
	IIOSExtensionsService,
	IAddExtensionsFromPathOptions,
	IRemoveExtensionsOptions,
	IProjectData,
	IXcodeTargetBuildConfigurationProperty,
	IWatchAppJSONConfig,
	IWatchAppJSONConfigModule,
} from "../definitions/project";
import { IPlatformData } from "../definitions/platform";
import { IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";
import { Minimatch } from "minimatch";

const sourceExtensions = [
	".swift",
	".m",
	".mm",
	".c",
	".cpp",
	".cc",
	".cxx",
	".h",
	".hpp",
];
const resourceExtensions = [
	".png",
	".jpg",
	".jpeg",
	".gif",
	".svg",
	".pdf", // Images
	".ttf",
	".otf",
	".woff",
	".woff2", // Fonts
	".xcassets", // Asset catalogs
	".storyboard",
	".xib", // Interface files
	".strings",
	".stringsdict", // Localization
	".json",
	".xml",
	".plist", // Data files
	".m4a",
	".mp3",
	".wav",
	".caf", // Audio
	".mp4",
	".mov", // Video
	".bundle", // Resource bundles
];
const CONFIG_FILE_EXTENSION = "extension.json";
const RESOURCES_TO_IGNORE = [
    CONFIG_FILE_EXTENSION, 
    'node_modules'
];

export class IOSExtensionsService implements IIOSExtensionsService {
    constructor(
        protected $fs: IFileSystem,
        protected $pbxprojDomXcode: IPbxprojDomXcode,
        protected $xcode: IXcode,
        private $iOSNativeTargetService: IIOSNativeTargetService,
        private $logger: ILogger,
		private $spmPbxprojService: ISPMPbxprojService,
    ) {}

    private addResourceFile(
		project: IXcode.project,
		path: string,
		opt: Record<string, string>,
		group = "WatchResources",
	) {
		const file = (project as any).addResourceFile(path, opt, group);
		(project as any).addToResourcesPbxGroup(file, group);
	}
	private addSourceFile(
		project: IXcode.project,
		path: string,
		opt: Record<string, string>,
		group = "WatchSrc",
	) {
		const file = (project as any).addSourceFile(path, opt, group);
		(project as any).addToResourcesPbxGroup(file, group);
	}

    public async addExtensionsFromPath({
        extensionsFolderPath,
        projectData,
        platformData,
        pbxProjPath,
    }: IAddExtensionsFromPathOptions): Promise<boolean> {
        const targetUuids: string[] = [];
        const targetNames: string[] = [];
        let addedExtensions = false;

        if (!this.$fs.exists(extensionsFolderPath)) {
            return false;
        }

        const project = new this.$xcode.project(pbxProjPath);
        project.parseSync();

        this.$iOSNativeTargetService
            .getTargetDirectories(extensionsFolderPath)
            .forEach((extensionFolder) => {
                const target = this.$iOSNativeTargetService.addTargetToProject(
                    extensionsFolderPath,
                    extensionFolder,
                    IOSNativeTargetTypes.appExtension,
                    project,
                    platformData
                );

                const extensionPath = path.join(extensionsFolderPath, extensionFolder);
                const configPath = path.join(extensionPath, CONFIG_FILE_EXTENSION);
                const config = this.$fs.exists(configPath) ? this.$fs.readJson(configPath) : null;

                this.configureTarget(
                    extensionFolder,
                    extensionPath,
                    configPath,
                    config,
                    target,
                    project,
                    projectData,
                    platformData,
                    pbxProjPath
                );

                targetUuids.push(target.uuid);
                targetNames.push(extensionFolder);
                addedExtensions = true;
            });

        this.$fs.writeFile(
            pbxProjPath,
            project.writeSync({ omitEmptyValues: true })
        );

        // Add SPM packages (file needs to be saved first)
        const extensionSPMPackages = this.getExtensionSPMPackages(platformData);
        await this.applySPMPackagesToTargets(
            targetNames,
            platformData,
            projectData.projectDir,
            extensionSPMPackages
        );

        this.$iOSNativeTargetService.prepareSigning(
            targetUuids,
            projectData,
            pbxProjPath
        );

        return addedExtensions;
    }

    private async configureTarget(
        extensionName: string,
        extensionPath: string,
        configPath: string,
        config: IWatchAppJSONConfig,
        target: IXcode.target,
        project: IXcode.project,
        projectData: IProjectData,
        platformData: IPlatformData,
        pbxProjPath: string
    ) {
        // Create resource and source groups
        const resourcesGroup = extensionName + "Resources";
        project.addPbxGroup([], resourcesGroup, project.filepath, null, {
            isMain: true,
            target: target.uuid,
            filesRelativeToProject: true,
        });

        const srcGroup = extensionName + "Src";
        project.addPbxGroup([], srcGroup, project.filepath, null, {
            isMain: true,
            target: target.uuid,
            filesRelativeToProject: true,
        });

        // Determine basedir
        let basedir: string | undefined;
        if (config?.basedir) {
            basedir = path.resolve(path.dirname(configPath), config.basedir);
            if (!this.$fs.exists(basedir)) {
                this.$logger.warn(`Basedir not found, using config directory: ${basedir}`);
                basedir = path.dirname(configPath);
            }
        } else {
            basedir = path.dirname(configPath);
        }

        const resourcesExclude = config?.resourcesExclude || [];
        const srcExclude = config?.srcExclude || [];

        // Build configuration properties
        const buildConfigProperties: IXcodeTargetBuildConfigurationProperty[] = [
            {
                name: "PRODUCT_BUNDLE_IDENTIFIER",
                value: `${projectData.projectIdentifiers.ios}.${extensionName}`,
            },
        ];

        // Handle custom Info.plist path
        if (config?.infoPlistPath) {
            const infoPlistPath = path.resolve(basedir, config.infoPlistPath);
            if (this.$fs.exists(infoPlistPath)) {
                const relativeInfoPlistPath = path.relative(platformData.projectRoot, infoPlistPath);
                buildConfigProperties.push({
                    name: "INFOPLIST_FILE",
                    value: `"${relativeInfoPlistPath}"`
                });
                resourcesExclude.push(relativeInfoPlistPath);
            } else {
                this.$logger.warn(`Custom Info.plist not found at: ${infoPlistPath}`);
            }
        }

        // Handle custom xcprivacy file path
        if (config?.xcprivacyPath) {
            const xcprivacyPath = path.resolve(basedir, config.xcprivacyPath);
            if (this.$fs.exists(xcprivacyPath)) {
                const relativeXcprivacyPath = path.relative(platformData.projectRoot, xcprivacyPath);
                this.addResourceFile(project, relativeXcprivacyPath, { target: target.uuid }, resourcesGroup);
                resourcesExclude.push(relativeXcprivacyPath);
            } else {
                this.$logger.warn(`Custom xcprivacy file not found at: ${xcprivacyPath}`);
            }
        }
		if (config?.entitlements) {
            const entitlementsPath = path.resolve(basedir, config.entitlements);
			console.log('entitlementsPath', entitlementsPath)
            if (this.$fs.exists(entitlementsPath)) {
                const relativeEntitlementsPath = path.relative(platformData.projectRoot, entitlementsPath);
                buildConfigProperties.push({
                    name: "CODE_SIGN_ENTITLEMENTS",
                    value: `"${relativeEntitlementsPath}"`
                });
            } else {
                this.$logger.warn(`Custom xcprivacy file not found at: ${entitlementsPath}`);
            }
        }

        this.$iOSNativeTargetService.setXcodeTargetBuildConfigurationProperties(
            buildConfigProperties,
            extensionName,
            project
        );

        this.$iOSNativeTargetService.setConfigurationsFromJsonFile(
            configPath,
            target.uuid,
            extensionName,
            project
        );

        project.addToHeaderSearchPaths(
            extensionPath,
            target.pbxNativeTarget.productName
        );

        // Import sources from main folder
        if (config?.importSourcesFromMainFolder === true) {
            this.addSourceFilesFromDirectory(
                basedir,
                target.uuid,
                project,
                platformData,
                srcGroup,
                srcExclude
            );
        }

        // Import resources from main folder
        if (config?.importResourcesFromMainFolder === true) {
            this.addTargetResources(
                basedir,
                [target.uuid],
                project,
                platformData,
                resourcesGroup,
                resourcesExclude
            );
        }

        if (config) {
            // Process additional configurations
            await this.processExtensionConfiguration(
                config,
                basedir,
                extensionName,
                target,
                project,
                projectData,
                platformData,
                pbxProjPath,
                srcExclude,
                resourcesExclude
            );
        }
    }

    private async processExtensionConfiguration(
        config: IWatchAppJSONConfig,
        basedir: string,
        extensionName: string,
        target: IXcode.target,
        project: IXcode.project,
        projectData: IProjectData,
        platformData: IPlatformData,
        pbxProjPath: string,
        srcExclude: string[],
        resourcesExclude: string[]
    ): Promise<void> {
        this.$logger.debug(`processExtensionConfiguration ${JSON.stringify(config)}`);

        // Handle custom resources
        if (config.resources && Array.isArray(config.resources)) {
            this.$logger.debug(
                `Processing ${config.resources.length} custom resource(s) for extension target: ${extensionName}`
            );
            for (const resourcePath of config.resources) {
                this.addCustomResource(
                    resourcePath,
                    target.uuid,
                    project,
                    projectData,
                    platformData,
                    extensionName + "Resources",
                    resourcesExclude,
                    basedir
                );
            }
        }

        // Handle custom source files
        if (config.src && Array.isArray(config.src)) {
            this.$logger.debug(
                `Processing ${config.src.length} custom source file(s) for extension target: ${extensionName}`
            );
            for (const srcPath of config.src) {
                this.addCustomSourceFile(
                    srcPath,
                    target.uuid,
                    project,
                    projectData,
                    platformData,
                    srcExclude,
                    extensionName + 'Src',
                    basedir
                );
            }
        }

        // Handle SPM packages
        if (config.SPMPackages && Array.isArray(config.SPMPackages)) {
            this.$fs.writeFile(
                pbxProjPath,
                project.writeSync({ omitEmptyValues: true })
            );
            await this.applySPMPackagesToTargets(
                [extensionName],
                platformData,
                basedir,
                config.SPMPackages
            );
            project.parseSync();
        }

        // Handle modules
        if (config.modules && Array.isArray(config.modules)) {
            this.$logger.debug(
                `Processing ${config.modules.length} module(s) for extension target: ${extensionName}`
            );
            for (const moduleDef of config.modules) {
                await this.addModuleDependency(
                    moduleDef,
                    config,
                    extensionName,
                    target,
                    project,
                    projectData,
                    platformData,
                    srcExclude,
                    resourcesExclude,
                    basedir
                );
            }
        }
    }

    private addSourceFilesFromDirectory(
        dirPath: string,
        targetUuid: string,
        project: IXcode.project,
        platformData: IPlatformData,
        groupName: string,
        excludePatterns?: string[]
    ): void {
        const items = this.getFolderFiles(dirPath, platformData.projectRoot, excludePatterns);

        for (const item of items) {
            const relativePath = path.relative(platformData.projectRoot, item);
            const ext = path.extname(item).toLowerCase();
            if (sourceExtensions.includes(ext)) {
                this.$logger.debug(`Adding source file: ${relativePath}`);
                this.addSourceFile(project, relativePath, { target: targetUuid }, groupName);
            }
        }
    }

    private addTargetResources(
        folderPath: string,
        targetUuids: string[],
        project: IXcode.project,
        platformData: IPlatformData,
        groupName: string,
        excludePatterns?: string[],
    ): void {
        try {
            if (!this.$fs.exists(folderPath)) {
                return;
            }
            for (const targetUuid of targetUuids) {
                this.addResourcesFromDirectory(
                    folderPath,
                    targetUuid,
                    project,
                    platformData,
                    groupName,
                    excludePatterns
                );
            }

            this.$logger.debug("Extension resources added successfully");
        } catch (err) {
            this.$logger.warn(`Error adding extension resources: ${err.message}`);
        }
    }

    private addResourcesFromDirectory(
        dirPath: string,
        targetUuid: string,
        project: IXcode.project,
        platformData: IPlatformData,
        groupName: string,
        excludePatterns?: string[],
    ): void {
        const items = this.$fs.readDirectory(dirPath);

        for (const item of items) {
            if (item.startsWith('.') || RESOURCES_TO_IGNORE.indexOf(item) !== -1) {
                continue;
            }

            const itemPath = path.join(dirPath, item);
            const stats = this.$fs.getFsStats(itemPath);
            const relativePath = path.relative(platformData.projectRoot, itemPath);

            if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
                this.$logger.debug(`Excluding from resources: ${relativePath}`);
                continue;
            }

            if (stats.isDirectory()) {
                if (item.endsWith('.xcassets') || item.endsWith('.bundle')) {
                    this.$logger.debug(`Adding resource bundle: ${relativePath}`);
                    this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
                } else {
                    this.addResourcesFromDirectory(
                        itemPath,
                        targetUuid,
                        project,
                        platformData,
                        groupName,
                        excludePatterns
                    );
                }
            } else {
                const ext = path.extname(item).toLowerCase();
                if (resourceExtensions.includes(ext)) {
                    this.$logger.debug(`Adding resource file: ${relativePath}`);
                    this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
                }
            }
        }
    }

    private addCustomResource(
        resourcePath: string,
        targetUuid: string,
        project: IXcode.project,
        projectData: IProjectData,
        platformData: IPlatformData,
        groupName: string,
        excludePatterns: string[],
        basedir?: string
    ): void {
        const resolvedPath = this.resolvePathWithBasedir(resourcePath, basedir, projectData.projectDir);

        if (!this.$fs.exists(resolvedPath)) {
            this.$logger.warn(`Custom resource not found, skipping: ${resourcePath}`);
            return;
        }

        const relativePath = path.relative(platformData.projectRoot, resolvedPath);

        if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
            this.$logger.debug(`Excluding from resources: ${relativePath}`);
            return;
        }

        const stats = this.$fs.getFsStats(resolvedPath);

        if (stats.isDirectory()) {
            if (relativePath.endsWith('.xcassets') || relativePath.endsWith('.bundle')) {
                this.$logger.debug(`Adding resource bundle: ${relativePath} for target:${targetUuid}`);
                this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
            } else {
                this.addAllResourcesRecursively(
                    resolvedPath,
                    targetUuid,
                    project,
                    platformData,
                    groupName,
                    excludePatterns
                );
            }
        } else {
            this.$logger.debug(`Adding custom resource file: ${relativePath}`);
            this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
        }
    }

    private addCustomSourceFile(
        srcPath: string,
        targetUuid: string,
        project: IXcode.project,
        projectData: IProjectData,
        platformData: IPlatformData,
        excludePatterns: string[],
        groupName: string,
        basedir?: string
    ): void {
        const resolvedPath = this.resolvePathWithBasedir(srcPath, basedir, projectData.projectDir);

        if (!this.$fs.exists(resolvedPath)) {
            this.$logger.warn(`Custom source file/folder not found, skipping: ${srcPath}`);
            return;
        }

        const relativePath = path.relative(platformData.projectRoot, resolvedPath);

        if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
            this.$logger.debug(`Excluding from src: ${relativePath}`);
            return;
        }

        const stats = this.$fs.getFsStats(resolvedPath);

        if (stats.isDirectory()) {
            this.$logger.debug(`Adding custom source directory: ${relativePath}`);
            this.addAllSourceFilesFromDirectory(
                resolvedPath,
                targetUuid,
                project,
                platformData,
                groupName,
                excludePatterns
            );
        } else {
            this.$logger.debug(`Adding custom source file: ${relativePath}`);
            this.addSourceFile(project, relativePath, { target: targetUuid }, groupName);
        }
    }

    private addAllSourceFilesFromDirectory(
        dirPath: string,
        targetUuid: string,
        project: IXcode.project,
        platformData: IPlatformData,
        groupName: string,
        excludePatterns: string[]
    ): void {
        const items = this.getFolderFiles(dirPath, platformData.projectRoot, excludePatterns);

        for (const item of items) {
            const relativePath = path.relative(platformData.projectRoot, item);
            const ext = path.extname(item).toLowerCase();
            if (sourceExtensions.includes(ext)) {
                this.$logger.debug(`Adding source file: ${relativePath}`);
                this.addSourceFile(project, relativePath, { target: targetUuid }, groupName);
            }
        }
    }

    private addAllResourcesRecursively(
        dirPath: string,
        targetUuid: string,
        project: IXcode.project,
        platformData: IPlatformData,
        groupName: string,
        excludePatterns: string[]
    ): void {
        const items = this.$fs.readDirectory(dirPath);

        for (const item of items) {
            if (item.startsWith('.')) {
                continue;
            }

            const itemPath = path.join(dirPath, item);
            const stats = this.$fs.getFsStats(itemPath);
            const relativePath = path.relative(platformData.projectRoot, itemPath);

            if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
                this.$logger.debug(`Excluding from resources: ${relativePath}`);
                return;
            }

            if (stats.isDirectory()) {
                if (item.endsWith('.xcassets') || item.endsWith('.bundle')) {
                    this.$logger.debug(`Adding resource bundle: ${relativePath} for target:${targetUuid}`);
                    this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
                } else {
                    this.addAllResourcesRecursively(itemPath, targetUuid, project, platformData, groupName, excludePatterns);
                }
            } else {
                this.$logger.debug(`Adding resource file: ${relativePath}`);
                this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
            }
        }
    }

    private async addModuleDependency(
        moduleDef: IWatchAppJSONConfigModule,
        config: IWatchAppJSONConfig,
        targetName: string,
        target: IXcode.target,
        project: IXcode.project,
        projectData: IProjectData,
        platformData: IPlatformData,
        srcExclude: string[],
        resourcesExclude: string[],
        basedir?: string
    ): Promise<void> {
        const modulePath = moduleDef.path
            ? this.resolvePathWithBasedir(moduleDef.path, basedir, projectData.projectDir)
            : null;

        if (!modulePath || !this.$fs.exists(modulePath)) {
            this.$logger.warn(`Module path not found, skipping module: ${modulePath}`);
            return;
        }

        const relativePath = path.relative(platformData.projectRoot, modulePath);
        const stats = this.$fs.getFsStats(modulePath);

        const isFramework = modulePath.endsWith('.framework') || modulePath.endsWith('.xcframework');
        const isFolder = stats.isDirectory() && !isFramework;

        if (isFramework) {
            this.addCompiledFramework(moduleDef, relativePath, targetName, target, project);
        } else if (isFolder) {
            await this.addFolderModule(moduleDef, modulePath, relativePath, targetName, target, config, project, basedir, srcExclude, resourcesExclude, projectData, platformData);
        } else {
            this.$logger.warn(`Unknown module type for: ${modulePath}`);
        }

        if (moduleDef.headerSearchPaths && Array.isArray(moduleDef.headerSearchPaths)) {
            for (const headerPath of moduleDef.headerSearchPaths) {
                const resolvedPath = this.resolvePathWithBasedir(headerPath, basedir, projectData.projectDir);
                const relPath = path.relative(platformData.projectRoot, resolvedPath);
                project.addToHeaderSearchPaths(relPath, targetName);
                this.$logger.debug(`Added header search path: ${relPath}`);
            }
        }

        if (moduleDef.linkerFlags && Array.isArray(moduleDef.linkerFlags)) {
            this.addLinkerFlags(moduleDef.linkerFlags, targetName, project);
        }
    }

    private addCompiledFramework(
        moduleDef: any,
        relativePath: string,
        targetName: string,
        target: IXcode.target,
        project: IXcode.project
    ): void {
        const moduleName = moduleDef.name;

        project.addFramework(relativePath, {
            target: target.uuid,
            customFramework: true,
            embed: moduleDef.embed !== false,
        });

        const frameworkDir = path.dirname(relativePath);
        project.addBuildProperty(
            "FRAMEWORK_SEARCH_PATHS",
            `"$(inherited)" "${frameworkDir}"`,
            null,
            targetName
        );

        this.$logger.debug(`Added compiled framework ${moduleName} at ${relativePath}`);
    }

    private async addFolderModule(
        moduleDef: IWatchAppJSONConfigModule,
        modulePath: string,
        relativePath: string,
        targetName: string,
        target: IXcode.target,
        config: IWatchAppJSONConfig,
        project: IXcode.project,
        basedir: string,
        srcExclude: string[],
        resourcesExclude: string[],
        projectData: IProjectData,
        platformData: IPlatformData
    ): Promise<void> {
        const moduleName = moduleDef.name || path.basename(modulePath);

        const targetRelativePath = path.relative(
            platformData.projectRoot,
            modulePath
        );
        const moduleTarget = project.addTarget(
            moduleName,
            moduleDef.targetType ?? 'framework',
            targetRelativePath,
            target.uuid
        );

        const { path: filePath, name, dependencies, frameworks, buildConfigurationProperties, src, resources, SPMPackages, ...otherProps } = moduleDef;
        project.addFramework(moduleName + '.framework', {
            target: target.uuid,
            basename: moduleName,
            path: moduleName + '.framework',
            customFramework: true,
            explicitFileType: 'wrapper.framework',
            ...otherProps
        });

        project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", moduleTarget.uuid);
        project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", moduleTarget.uuid);
        project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", moduleTarget.uuid);
        project.addBuildPhase([], "PBXCopyFilesBuildPhase", "Embed Frameworks", moduleTarget.uuid);

        const files = this.getFolderFiles(modulePath, platformData.projectRoot, srcExclude);
        if (files.length > 0) {
            project.addPbxGroup(files, moduleName, modulePath, null, {
                isMain: true,
                target: moduleTarget.uuid,
                filesRelativeToProject: true,
            });
        }

        // Handle frameworks with SPM package filtering
        const moduleSpmPackages = moduleDef.SPMPackages;
        if (moduleDef.frameworks && Array.isArray(moduleDef.frameworks)) {
            for (const framework of moduleDef.frameworks) {
                const frameworkName = typeof framework === 'string' ? framework : framework.path;
                const isSpmProduct = Array.isArray(moduleSpmPackages) && moduleSpmPackages.some((p: any) => {
                    const pkg = typeof p === 'string' ? config.SPMPackages?.find(s => s.name === p) : p;
                    return pkg && Array.isArray(pkg.libs) && pkg.libs.includes(frameworkName);
                });

                if (isSpmProduct) {
                    this.$logger.debug(`Skipping framework ${frameworkName} because it is provided by SPM package`);
                    continue;
                }

                if (typeof framework === 'string') {
                    project.addFramework(framework, { target: moduleTarget.uuid });
                } else {
                    project.addFramework(framework.path, { target: moduleTarget.uuid, ...framework });
                }
            }
        }

        if (moduleDef.src && Array.isArray(moduleDef.src)) {
            for (const srcPath of moduleDef.src) {
                this.addCustomSourceFile(
                    srcPath,
                    moduleTarget.uuid,
                    project,
                    projectData,
                    platformData,
                    srcExclude,
                    moduleName + 'Src',
                    basedir
                );
            }
        }

        if (moduleDef.resources && Array.isArray(moduleDef.resources)) {
            for (const resourcePath of moduleDef.resources) {
                this.addCustomResource(
                    resourcePath,
                    moduleTarget.uuid,
                    project,
                    projectData,
                    platformData,
                    moduleName + "Resources",
                    resourcesExclude,
                    basedir
                );
            }
        }

        if (moduleDef.dependencies && Array.isArray(moduleDef.dependencies)) {
            const currentTargets = project.pbxNativeTargetSection();
            const currentTargetsArray = Object.keys(currentTargets)
                .map(k => currentTargets[k]['name'] ? ({ uuid: k, name: currentTargets[k]['name'] }) : null)
                .filter(t => !!t);
            const targets = moduleDef.dependencies
                .map(dependency => currentTargetsArray.find(t => t.name === `\"${dependency}\"`))
                .filter(s => !!s);
            if (targets.length) {
                project.addTargetDependency(moduleTarget.uuid, targets.map(t => t.uuid));
            }
        }

        if (moduleDef.SPMPackages && Array.isArray(moduleDef.SPMPackages)) {
            this.$fs.writeFile(
                project.filepath,
                project.writeSync({ omitEmptyValues: true })
            );
            await this.applySPMPackagesToTargets(
                [moduleName],
                platformData,
                basedir,
                moduleDef.SPMPackages.map(t => {
                    if (typeof t === 'string') {
                        return config.SPMPackages?.find(s => s.name === t);
                    }
                    return t;
                })
            );
            project.parseSync();
        }

        if (moduleDef.buildConfigurationProperties || config.sharedModulesBuildConfigurationProperties) {
            const configurationProperties = {
                ...(config.sharedModulesBuildConfigurationProperties || {}),
                ...(moduleDef.buildConfigurationProperties || {})
            };
            this.$iOSNativeTargetService.setXcodeTargetBuildConfigurationProperties(
                Object.keys(configurationProperties).map(k => ({ name: k, value: configurationProperties[k] })),
                moduleName,
                project
            );
        }

        this.$logger.debug(`Added folder-based module ${moduleName} at ${relativePath}`);
    }

    private addLinkerFlags(
        flags: string[],
        targetName: string,
        project: IXcode.project
    ): void {
        for (const flag of flags) {
            const currentFlags = this.getBuildProperty("OTHER_LDFLAGS", targetName, project);
            const flagsArray = currentFlags
                ? (Array.isArray(currentFlags) ? currentFlags : [currentFlags])
                : ['"$(inherited)"'];

            if (!flagsArray.includes(flag)) {
                flagsArray.push(flag);
            }

            project.addBuildProperty("OTHER_LDFLAGS", flagsArray, null, targetName);
            this.$logger.debug(`Added linker flag: ${flag}`);
        }
    }

    private getBuildProperty(
        propertyName: string,
        targetName: string,
        project: IXcode.project
    ): any {
        const projectHash = (project as any).hash;
        if (!projectHash) {
            return null;
        }

        const configurations = projectHash.project.objects.XCBuildConfiguration;
        if (!configurations) {
            return null;
        }

        for (const key in configurations) {
            const config = configurations[key];
            if (config && config.buildSettings &&
                (config.buildSettings.PRODUCT_NAME === targetName ||
                    config.buildSettings.PRODUCT_NAME === `"${targetName}"`)) {
                return config.buildSettings[propertyName];
            }
        }

        return null;
    }

    private resolvePathWithBasedir(
        relativePath: string,
        basedir: string | undefined,
        fallbackDir: string
    ): string {
        return basedir
            ? path.resolve(basedir, relativePath)
            : path.resolve(fallbackDir, relativePath);
    }

    private getFolderFiles(dirPath: string, rootPath: string, excludePatterns?: string[]): string[] {
        const result: string[] = [];
        const files = this.$fs.readDirectory(dirPath).filter((fileName) => !fileName.startsWith("."));
        for (const item of files) {
            const itemPath = path.join(dirPath, item);
            const stats = this.$fs.getFsStats(itemPath);
            const relativePath = path.relative(rootPath, itemPath);

            if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
                this.$logger.debug(`Excluding from src: ${relativePath}`);
                continue;
            }
            if (stats.isDirectory()) {
                result.push(...this.getFolderFiles(itemPath, rootPath, excludePatterns));
            } else {
                result.push(itemPath);
            }
        }
        return result;
    }

    private shouldExclude(filePath: string, excludePatterns: string[]): boolean {
        for (const pattern of excludePatterns) {
            const matcher = new Minimatch(pattern, { dot: true });
            if (matcher.match(filePath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Apply SPM packages to watch app targets
     */
    private async applySPMPackagesToTargets(
        targetNames: string[],
        platformData: IPlatformData,
        basedir: string,
        watchSPMPackages: any[],
    ): Promise<void> {
        try {
            this.$logger.debug(
                `applySPMPackagesToTargets ${JSON.stringify(watchSPMPackages)}`,
            );
            if (watchSPMPackages.length === 0) {
                return;
            }

            this.$logger.debug(
                `Applying ${watchSPMPackages.length} SPM package(s) to targets:${targetNames}`,
            );

            // Add SPM packages to each watch target
            const assignments: IosSPMPackageAssignment[] = [];
            for (const pkg of watchSPMPackages) {
                if ("path" in pkg) {
                    pkg.path = path.resolve(basedir, pkg.path);
                }

                this.$logger.debug(
                    `Adding SPM package ${JSON.stringify(pkg)} to targets ${targetNames}`,
                );
                for (const targetName of targetNames) {
                    assignments.push({ targetName, package: pkg });
                }
            }

            if (
                !this.$spmPbxprojService.addPackages(
                    platformData.projectRoot,
                    assignments,
                )
            ) {
                this.$logger.debug(
                    `No SPM packages were applied to targets ${targetNames}`,
                );
                return;
            }

            this.$logger.debug(
                `Successfully applied SPM packages to targets ${targetNames}`,
            );
        } catch (err) {
            this.$logger.debug(
                `Error applying SPM packages to targets ${targetNames} "`,
                err,
            );
        }
    }

    private getExtensionSPMPackages(platformData: IPlatformData): any[] {
        const $projectConfigService = injector.resolve("projectConfigService");

        const extensionPackages = $projectConfigService.getValue(
            `${platformData.platformNameLowerCase}.extensions.SPMPackages`,
            []
        );

        return extensionPackages;
    }

    public removeExtensions({ pbxProjPath }: IRemoveExtensionsOptions): void {
        const project = new this.$xcode.project(pbxProjPath);
        project.parseSync();
        project.removeTargetsByProductType(
            IOSNativeTargetProductTypes.appExtension
        );
        this.$fs.writeFile(
            pbxProjPath,
            project.writeSync({ omitEmptyValues: true })
        );
    }
}

injector.register("iOSExtensionsService", IOSExtensionsService);
