import * as path from "path";
import {
	IOSDeviceTargets,
	IOS_WATCHAPP_FOLDER,
	IOS_WATCHAPP_EXTENSION_FOLDER,
	IOSNativeTargetProductTypes,
	IOSNativeTargetTypes,
} from "../constants";
import {
	IIOSWatchAppService,
	IIOSNativeTargetService,
	IAddWatchAppFromPathOptions,
	IRemoveWatchAppOptions,
	IProjectData,
	IXcodeTargetBuildConfigurationProperty,
	IWatchAppJSONConfig,
	IWatchAppJSONConfigModule,
} from "../definitions/project";
import { IPlatformData } from "../definitions/platform";
import { IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";
import { MobileProject } from "@nstudio/trapezedev-project";
import { Minimatch } from "minimatch";

const sourceExtensions = [
	'.swift', '.m', '.mm', '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'
];
const resourceExtensions = [
	'.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf',  // Images
	'.ttf', '.otf', '.woff', '.woff2',                 // Fonts
	'.xcassets',                                        // Asset catalogs
	'.storyboard', '.xib',                             // Interface files
	'.strings', '.stringsdict',                        // Localization
	'.json', '.xml', '.plist',                         // Data files
	'.m4a', '.mp3', '.wav', '.caf',                    // Audio
	'.mp4', '.mov',                                     // Video
	'.bundle',                                          // Resource bundles
];
const WATCH_APP_IDENTIFIER = "watchkitapp";
const WACTCH_EXTENSION_IDENTIFIER = "watchkitextension";
const CONFIG_FILE_WATCHAPP = "watchapp.json";
const CONFIG_FILE_EXTENSION = "extension.json";
const RESOURCES_TO_IGNORE = [CONFIG_FILE_WATCHAPP, CONFIG_FILE_EXTENSION, 'node_modules'];

export class IOSWatchAppService implements IIOSWatchAppService {

	constructor(
		protected $fs: IFileSystem,
		protected $pbxprojDomXcode: IPbxprojDomXcode,
		protected $xcode: IXcode,
		private $iOSNativeTargetService: IIOSNativeTargetService,
		private $logger: ILogger
	) {}

	private addResourceFile(project: IXcode.project, path: string, opt: Record<string, string>, group = 'WatchResources') {
		
		const file = (project as any).addResourceFile(path, opt, group);
		(project as any).addToResourcesPbxGroup(file, group);
	}
	private addSourceFile(project: IXcode.project, path: string, opt: Record<string, string>, group = 'WatchSrc') {
		const file = (project as any).addSourceFile(path, opt, group);
		(project as any).addToResourcesPbxGroup(file, group);
	}

	public async addWatchAppFromPath({
		watchAppFolderPath,
		projectData,
		platformData,
		pbxProjPath,
	}: IAddWatchAppFromPathOptions): Promise<boolean> {
		const targetUuids: string[] = [];
		const targetNames: string[] = [];
		const appPath = path.join(watchAppFolderPath, IOS_WATCHAPP_FOLDER);

		// Check if watchapp exists - it's required
		if (!this.$fs.exists(appPath)) {
			return false;
		}

		const appFolder = this.$iOSNativeTargetService.getTargetDirectories(
			appPath
		)[0];

		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();

		const configPath = path.join(
			path.join(appPath, appFolder),
			"watchapp.json"
		);
		const config: IWatchAppJSONConfig = this.$fs.exists(configPath) ? this.$fs.readJson(configPath): null;

		const targetType = config?.targetType ?? IOSNativeTargetTypes.watchApp;
		project.removeTargetsByProductType(IOSNativeTargetProductTypes.watchApp);
		project.removeTargetsByProductType(targetType);

		const parentTargetUuid = project.getFirstTarget().uuid;

		const watchApptarget = this.addTarget(
			appPath,
			appFolder,
			targetType,
			project,
			platformData,
			parentTargetUuid,
			IOSNativeTargetTypes.watchApp
		);

		await this.configureTarget(
			appFolder,
			path.join(appPath, appFolder),
			`${projectData.projectIdentifiers.ios}.${WATCH_APP_IDENTIFIER}`,
			configPath,
			config,
			watchApptarget,
			project,
			projectData,
			platformData,
			pbxProjPath
		);
		targetUuids.push(watchApptarget.uuid);
		targetNames.push(appFolder);

		const extensionPath = path.join(
			watchAppFolderPath,
			IOS_WATCHAPP_EXTENSION_FOLDER
		);
		// Extension is optional (Xcode 14+ supports single target)
		if (this.$fs.exists(extensionPath)) {
			const extensionFolder = this.$iOSNativeTargetService.getTargetDirectories(
				extensionPath
			)[0];
			const configPath = path.join(
				path.join(extensionPath, extensionFolder),
				"extension.json"
			);

			const config = this.$fs.exists(configPath) ? this.$fs.readJson(configPath): null;

			const targetType = config?.targetType ?? IOSNativeTargetTypes.watchExtension;
			project.removeTargetsByProductType(IOSNativeTargetProductTypes.watchExtension);
			project.removeTargetsByProductType(targetType);

			const watchExtensionTarget = this.addTarget(
				extensionPath,
				extensionFolder,
				targetType,
				project,
				platformData,
				watchApptarget.uuid
			);

			await this.configureTarget(
				extensionFolder,
				path.join(extensionPath, extensionFolder),
				`${projectData.projectIdentifiers.ios}.${WATCH_APP_IDENTIFIER}.${WACTCH_EXTENSION_IDENTIFIER}`,
				configPath,
				config,
				watchExtensionTarget,
				project,
				projectData,
				platformData,
				pbxProjPath
			);
			targetUuids.push(watchExtensionTarget.uuid);
			targetNames.push(extensionFolder);
		} else {
			this.$logger.debug(
				"No watch extension found - using single target mode (Xcode 14+)"
			);
		}

		this.$fs.writeFile(
			pbxProjPath,
			project.writeSync({ omitEmptyValues: true })
		);

		// Add SPM packages (file needs to be saved first)
		const watchSPMPackages = this.getWatchSPMPackages(platformData);

		await this.applySPMPackagesToTargets(
			targetNames,
			platformData,
			projectData.projectDir,
			watchSPMPackages
		);
		// nothing done after we dont need to reload project

		this.$iOSNativeTargetService.prepareSigning(
			targetUuids,
			projectData,
			pbxProjPath
		);

		return true;
	}

	private addTarget(
		targetRootPath: string,
		targetFolder: string,
		targetType: string,
		project: IXcode.project,
		platformData: IPlatformData,
		parentTarget?: string,
		productTargetType?: string
	): IXcode.target {
		const targetPath = path.join(targetRootPath, targetFolder);
		const targetRelativePath = path.relative(
			platformData.projectRoot,
			targetPath
		);
		
		const target = project.addTarget(
			targetFolder,
			targetType,
			targetRelativePath,
			parentTarget,
			productTargetType
		);
		
		// Add build phases
		project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
		project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);
		project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", target.uuid);
		project.addBuildPhase([], "PBXCopyFilesBuildPhase", "Embed Frameworks", target.uuid);
		
		project.addToHeaderSearchPaths(
			targetPath,
			target.pbxNativeTarget.productName
		);
		
		return target;
	}

	/**
	 * Recursively add source files from a directory to a target
	 */
	private addSourceFilesFromDirectory(
		dirPath: string,
		targetUuid: string,
		project: IXcode.project,
		platformData: IPlatformData,
		groupName: string,
		excludePatterns?: string[]
	): void {

		const items = this.getFolderFiles(dirPath, platformData.projectRoot, excludePatterns)

		for (const item of items) {
			const relativePath = path.relative(platformData.projectRoot, item);
			// Check if file is a source file by extension
			const ext = path.extname(item).toLowerCase();
			if (sourceExtensions.includes(ext)) {
				this.$logger.debug(`Adding source file: ${relativePath}`);
				this.addSourceFile(project, relativePath, {target: targetUuid}, groupName);
			}
		}
	}

	private async addTargetResources(
		watchAppFolderPath: string,
		targetUuids: string[],
		project: IXcode.project,
		platformData: IPlatformData,
		groupName: string,
		excludePatterns?: string[]
	): Promise<void> {
		try {
			if (!this.$fs.exists(watchAppFolderPath)) {
				return;
			}
			for (let i = 0; i < targetUuids.length; i++) {
				const targetUuid = targetUuids[i];
				this.addResourcesFromDirectory(
					watchAppFolderPath,
					targetUuid,
					project,
					platformData,
					groupName,
					excludePatterns
				);
			}

			this.$logger.debug("Watch app resources added successfully");
		} catch (err) {
			this.$logger.warn(`Error adding watch app resources: ${err.message}`);
		}
	}

	/**
	 * Recursively add resources from a directory to a target
	 */
	private addResourcesFromDirectory(
		dirPath: string,
		targetUuid: string,
		project: IXcode.project,
		platformData: IPlatformData,
		groupName: string,
		excludePatterns?: string[]
	): void {

		const items = this.$fs.readDirectory(dirPath);

		for (const item of items) {
			// Skip hidden files and excluded files/directories
			if (item.startsWith('.') || RESOURCES_TO_IGNORE.indexOf(item) !== -1) {
				continue;
			}

			const itemPath = path.join(dirPath, item);
			const stats = this.$fs.getFsStats(itemPath);
			const relativePath = path.relative(platformData.projectRoot, itemPath);

			// Check if file/directory should be excluded based on patterns
			if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
				this.$logger.debug(`Excluding from resources: ${relativePath}`);
				continue;
			}

			if (stats.isDirectory()) {
				// Special handling for .xcassets, .bundle, and other resource bundles
				if (item.endsWith('.xcassets') || item.endsWith('.bundle')) {
					this.$logger.debug(`Adding resource bundle: ${relativePath}`);
					this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
				} else {
					// Recursively scan subdirectories
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
				// Check if file is a resource by extension
				const ext = path.extname(item).toLowerCase();
				if (resourceExtensions.includes(ext)) {
					this.$logger.debug(`Adding resource file: ${relativePath}`);
					this.addResourceFile(project, relativePath, { target: targetUuid }, groupName);
				}
			}
		}
	}

	public removeWatchApp({ pbxProjPath }: IRemoveWatchAppOptions): void {
		const project = new this.$xcode.project(pbxProjPath);
		project.parseSync();
		project.removeTargetsByProductType(IOSNativeTargetProductTypes.watchApp);
		project.removeTargetsByProductType(
			IOSNativeTargetProductTypes.watchExtension
		);
		this.$fs.writeFile(
			pbxProjPath,
			project.writeSync({ omitEmptyValues: true })
		);
	}

	public hasWatchApp(
		platformData: IPlatformData,
		projectData: IProjectData
	): boolean {
		const watchAppPath = path.join(
			projectData.getAppResourcesDirectoryPath(),
			platformData.normalizedPlatformName,
			IOS_WATCHAPP_FOLDER
		);

		return this.$fs.exists(watchAppPath);
	}

	private async configureTarget(
		targetName: string,
		targetPath: string,
		identifier: string,
		configPath: string,
		config: IWatchAppJSONConfig,
		target: IXcode.target,
		project: IXcode.project,
		projectData: IProjectData,
		platformData: IPlatformData,
		pbxProjPath: string
	) {
		const identifierParts = identifier.split(".");
		identifierParts.pop();
		const wkAppBundleIdentifier = identifierParts.join(".");

		// Build configuration properties
		const buildConfigProperties: IXcodeTargetBuildConfigurationProperty[] = [
			{ name: "PRODUCT_BUNDLE_IDENTIFIER", value: identifier },
			{ name: "SDKROOT", value: "watchos" },
			{ name: "TARGETED_DEVICE_FAMILY", value: IOSDeviceTargets.watchos },
			{ name: "WATCHOS_DEPLOYMENT_TARGET", value: 5.2 },
			{ name: "WK_APP_BUNDLE_IDENTIFIER", value: wkAppBundleIdentifier },
		];
		const resourcesGroup = targetName + "Resources";
		project.addPbxGroup([], resourcesGroup, project.filepath, null, {
			isMain: true,
			target: target.uuid,
			filesRelativeToProject: true,
		});
		const srcGroup = targetName + "Src";
		project.addPbxGroup([], srcGroup, project.filepath, null, {
			isMain: true,
			target: target.uuid,
			filesRelativeToProject: true,
		});


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

		// Handle custom Info.plist path
		if (config?.infoPlistPath) {
			const infoPlistPath = path.resolve(basedir, config.infoPlistPath);
			if (this.$fs.exists(infoPlistPath)) {
				const relativeInfoPlistPath = path.relative(platformData.projectRoot, infoPlistPath);
				buildConfigProperties.push({
					name: "INFOPLIST_FILE",
					value: `"${infoPlistPath}"`
				});
				resourcesExclude.push(relativeInfoPlistPath)
			} else {
				this.$logger.warn(`Custom Info.plist not found at: ${infoPlistPath}`);
			}
		}

		// Handle custom xcprivacy file path
		if (config?.xcprivacyPath) {
			const xcprivacyPath = path.resolve(basedir, config.xcprivacyPath);
			if (this.$fs.exists(xcprivacyPath)) {
				const relativeXcprivacyPath = path.relative(platformData.projectRoot, xcprivacyPath);
				this.addResourceFile(project, xcprivacyPath, { target: target.uuid }, targetName + "Resources");
				resourcesExclude.push(relativeXcprivacyPath)
			} else {
				this.$logger.warn(`Custom xcprivacy file not found at: ${xcprivacyPath}`);
			}
		}

		this.$iOSNativeTargetService.setXcodeTargetBuildConfigurationProperties(
			buildConfigProperties,
			targetName,
			project
		);

		this.$iOSNativeTargetService.setConfigurationsFromJsonFile(
			configPath,
			target.uuid,
			targetName,
			project
		);
		project.addToHeaderSearchPaths(
			targetPath,
			target.pbxNativeTarget.productName
		);

		if (config?.importSourcesFromMainFolder !== false) {
			await this.addSourceFilesFromDirectory(
				path.dirname(configPath),
				target.uuid,
				project,
				platformData,
				targetName + 'Src',
				srcExclude
			);
		}

		if (config?.importResourcesFromMainFolder !== false) {
			await this.addTargetResources(
				path.dirname(configPath),
				[target.uuid],
				project,
				platformData,
				resourcesGroup,
				resourcesExclude
			);
		}


		if (config) {
			// Process additional configurations
			await this.processWatchAppConfiguration(
				config,
				basedir,
				targetName,
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

	private async processWatchAppConfiguration(
		config: IWatchAppJSONConfig,
		basedir: string,
		targetName: string,
		target: IXcode.target,
		project: IXcode.project,
		projectData: IProjectData,
		platformData: IPlatformData,
		pbxProjPath: string,
		srcExclude: string[],
		resourcesExclude: string[]
	): Promise<void> {
		this.$logger.debug(`processWatchAppConfiguration ${JSON.stringify(config)}`);

		// Handle custom resources
		if (config.resources && Array.isArray(config.resources)) {
			this.$logger.debug(
				`Processing ${config.resources.length} custom resource(s) for watch target: ${targetName}`
			);
			for (const resourcePath of config.resources) {
				this.addCustomResource(
					resourcePath,
					target.uuid,
					project,
					projectData,
					platformData,
					targetName + "Resources",
					resourcesExclude,
					basedir
				);
			}
		}

		if (config.src && Array.isArray(config.src)) {
			this.$logger.debug(
				`Processing ${config.src.length} custom source file(s) for watch target: ${targetName}`
			);
			for (const srcPath of config.src) {
				this.addCustomSourceFile(
					srcPath,
					target.uuid,
					project,
					projectData,
					platformData,
					srcExclude,
					targetName + 'Src',
					basedir
				);
			}
		}

		if (config.SPMPackages && Array.isArray(config.SPMPackages)) {
			// to be able to add SPM the file needs to be saved
			// but it means we need to reload it again after spm packages addition
			this.$fs.writeFile(
				pbxProjPath,
				project.writeSync({ omitEmptyValues: true })
			);
			await this.applySPMPackagesToTargets(
				[targetName],
				platformData,
				basedir,
				config.SPMPackages
			);
			project.parseSync();
		}

		if (config.modules && Array.isArray(config.modules)) {
			this.$logger.debug(
				`Processing ${config.modules.length} module(s) for watch target: ${targetName}`
			);
			for (const moduleDef of config.modules) {
				await this.addModuleDependency(
					moduleDef,
					config,
					targetName,
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
			this.$logger.warn(
				`Custom resource not found, skipping: ${resourcePath}`
			);
			return;
		}

		const relativePath = path.relative(platformData.projectRoot, resolvedPath);

		if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
			this.$logger.debug(`Excluding from resources: ${relativePath}`);
			return;
		}
		const stats = this.$fs.getFsStats(resolvedPath);

		if (stats.isDirectory()) {
			this.$logger.debug(
				`Recursively adding files from resource directory: ${resourcePath}`
			);
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
		basedir?: string,
	): void {
		const resolvedPath = this.resolvePathWithBasedir(srcPath, basedir, projectData.projectDir);

		if (!this.$fs.exists(resolvedPath)) {
			this.$logger.warn(
				`Custom source file/folder not found, skipping: ${srcPath}`
			);
			return;
		}


		const relativePath = path.relative(platformData.projectRoot, resolvedPath);

		if (excludePatterns && this.shouldExclude(relativePath, excludePatterns)) {
			this.$logger.debug(`Excluding from src: ${relativePath}`);
			return;
		}

		const stats = this.$fs.getFsStats(resolvedPath);

		if (stats.isDirectory()) {
			this.$logger.debug(
				`Adding custom source directory: ${relativePath}`
			);
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
			this.addSourceFile(project, relativePath, {target: targetUuid}, groupName);
		}
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

	private addAllSourceFilesFromDirectory(
		dirPath: string,
		targetUuid: string,
		project: IXcode.project,
		platformData: IPlatformData,
		groupName: string,
		excludePatterns: string[]
	): void {

		const items = this.getFolderFiles(dirPath, platformData.projectRoot, excludePatterns)

		for (const item of items) {
			const relativePath = path.relative(platformData.projectRoot, item);
			// Check if file is a source file by extension
			const ext = path.extname(item).toLowerCase();
			if (sourceExtensions.includes(ext)) {
				this.$logger.debug(`Adding source file: ${relativePath}`);
				this.addSourceFile(project, relativePath, {target: targetUuid}, groupName);
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
				// Special handling for .xcassets, .bundle - add as bundles, not recursively
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
		basedir?: string,
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
		this.$logger.debug(`Adding module dependency: ${JSON.stringify(moduleDef)} to ${targetName}, basedir:${basedir}, isFramework:${isFramework} isFolder:${isFolder}`);

		if (isFramework) {
			// Handle compiled frameworks (xcframework, framework)
			this.addCompiledFramework(moduleDef, relativePath, targetName, target, project);
		} else if (isFolder) {
			// Handle folder-based modules
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
			embed: moduleDef.embed !== false, // Default to true
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

	private getFolderFiles(dirPath: string, rootPath: string, excludePatterns?: string[]) {
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
				result.push(...this.getFolderFiles(itemPath, rootPath, excludePatterns))
			} else {
				result.push(itemPath)

			}
		}
		return result;
	}

	addBuildPhaseIfNotExisting(project: IXcode.project, buildPhaseType: string, comment: string, target: string) {
		let buildPhase = project.buildPhaseObject(buildPhaseType, comment, target);
		if (!buildPhase) {
			project.addBuildPhase([], buildPhaseType, comment, target);
		}
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
		this.$logger.debug(`Adding folder module ${moduleName} with path ${modulePath} with target uuid:${moduleTarget.uuid}`);

		const {path: filePath, name, dependencies, frameworks, buildConfigurationProperties, src, resources, SPMPackages, ...otherProps} = moduleDef
		project.addFramework(moduleName + '.framework', {
			target: target.uuid,
			basename: moduleName,
			path: moduleName + '.framework',
			customFramework: true,
			explicitFileType: 'wrapper.framework',
			...otherProps
		});

		// Add build phases
		project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", moduleTarget.uuid);
		project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", moduleTarget.uuid);
		project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", moduleTarget.uuid);
		project.addBuildPhase([], "PBXCopyFilesBuildPhase", "Embed Frameworks", moduleTarget.uuid);

		const files = this.getFolderFiles(modulePath, platformData.projectRoot, srcExclude);
		this.$logger.debug(`module ${moduleName} has  ${files.length} files`);
		if (files.length > 0) {
			project.addPbxGroup(files, moduleName, modulePath, null, {
				isMain: true,
				target: moduleTarget.uuid,
				filesRelativeToProject: true,
			});
		}

		if (moduleDef.frameworks && Array.isArray(moduleDef.frameworks)) {
			this.$logger.debug(`Adding ${moduleDef.frameworks.length} framework(s) for module ${JSON.stringify(moduleDef)}`);
			for (const framework of moduleDef.frameworks) {
				this.$logger.debug(`Adding framework ${JSON.stringify(framework)} for module ${JSON.stringify(moduleDef)}`);
				if (typeof framework === 'string') {
					project.addFramework(framework, { target: moduleTarget.uuid});
				} else {
					project.addFramework(framework.path, { target: moduleTarget.uuid, ...framework});
				}
				this.$logger.debug(`Added framework dependency: ${framework}`);
			}
		}

		if (moduleDef.src && Array.isArray(moduleDef.src)) {
			this.$logger.debug(
				`Processing ${config.src.length} custom source file(s) for target: ${moduleName}`
			);
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
			this.$logger.debug(
				`Processing ${moduleDef.resources.length} custom resource(s) for target: ${moduleName}/${moduleTarget.uuid}`
			);
			for (const resourcePath of moduleDef.resources) {
				this.addCustomResource(
					resourcePath,
					moduleTarget.uuid,
					project,
					projectData,
					platformData,
					targetName + "Resources",
					resourcesExclude,
					basedir
				);
			}
		}

		if (moduleDef.dependencies && Array.isArray(moduleDef.dependencies)) {
			const currentTargets = project.pbxNativeTargetSection();
			const currentTargetsArray = Object.keys(currentTargets).map(k=>currentTargets[k]['name']?({uuid:k, name: currentTargets[k]['name']}): null).filter(t => !!t)
			const targets = moduleDef.dependencies.map(dependency => currentTargetsArray.find(t=>t.name === `\"${dependency}\"`)).filter(s => !!s);
			if (targets.length) {
				this.$logger.debug(`Adding target dependencies ${moduleDef.dependencies} with uuids:${targets.map(t => t.uuid)} for module ${moduleDef.name}`);
				project.addTargetDependency(moduleTarget.uuid, targets.map(t => t.uuid));
			}
		}

		if (moduleDef.SPMPackages && Array.isArray(moduleDef.SPMPackages)) {
			// to be able to add SPM the file needs to be saved
			// but it means we need to reload it again after spm packages addition
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
						return config.SPMPackages.find(s => s.name === t)
					}
					return t;
 				})
			);
			project.parseSync();
		}

		if (moduleDef.buildConfigurationProperties || config.sharedModulesBuildConfigurationProperties) {
			const configurationProperties = {...(config.sharedModulesBuildConfigurationProperties || {}), ...(moduleDef.buildConfigurationProperties || {})};
			this.$iOSNativeTargetService.setXcodeTargetBuildConfigurationProperties(
				Object.keys(configurationProperties).map(k => ({name: k, value: configurationProperties[k]})),
				moduleName,
				project
			);
		}

		this.$logger.debug(`Added folder-based module ${moduleName} at ${relativePath}`);
	}

	/**
	 * Add linker flags to a target's build settings
	 */
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

	/**
	 * Get build property value for a specific target
	 */
	private getBuildProperty(
		propertyName: string,
		targetName: string,
		project: IXcode.project
	): any {
		// Access the project hash to read build settings
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

	/**
	 * Check if a path should be excluded based on glob patterns
	 */
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
		watchSPMPackages: any[]
	): Promise<void> {
		try {
			this.$logger.debug(`applySPMPackagesToTargets ${JSON.stringify(watchSPMPackages)}`);
			if (watchSPMPackages.length === 0) {
				return;
			}

			this.$logger.debug(
				`Applying ${watchSPMPackages.length} SPM package(s) to targets:${targetNames}`
			);

			const project = new MobileProject(platformData.projectRoot, {
				ios: {
					path: ".",
				},
				enableAndroid: false,
			});
			await project.load();

			if (!project.ios) {
				this.$logger.debug("No iOS project found via trapeze");
				return;
			}

			// Add SPM packages to each watch target
			for (const pkg of watchSPMPackages) {
				if ("path" in pkg) {
					pkg.path = path.resolve(basedir, pkg.path);
				}

				this.$logger.debug(`Adding SPM package ${JSON.stringify(pkg)} to targets ${targetNames}`);
				for (const targetName of targetNames) {
					project.ios.addSPMPackage(targetName, pkg);
				}
			}

			await project.commit();
			this.$logger.debug(`Successfully applied SPM packages to targets ${targetNames}`);
		} catch (err) {
			this.$logger.debug(`Error applying SPM packages to targets ${targetNames} "`, err);
		}
	}

	/**
	 * Get SPM packages configured for watch app targets
	 */
	private getWatchSPMPackages(
		platformData: IPlatformData
	): IosSPMPackage[] {
		const $projectConfigService = injector.resolve("projectConfigService");
		
		// Check for watch-specific SPM packages in config
		const watchPackages = $projectConfigService.getValue(
			`${platformData.platformNameLowerCase}.watchApp.SPMPackages`,
			[]
		);

		return watchPackages;
	}
}

injector.register("iOSWatchAppService", IOSWatchAppService);
