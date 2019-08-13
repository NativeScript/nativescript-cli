import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import { Configurations } from "../common/constants";
import * as helpers from "../common/helpers";
import { attachAwaitDetach } from "../common/helpers";
import * as projectServiceBaseLib from "./platform-project-service-base";
import { PlistSession, Reporter } from "plist-merge-patch";
import { EOL } from "os";
import * as temp from "temp";
import * as plist from "plist";
import { IOSProvisionService } from "./ios-provision-service";
import { IOSEntitlementsService } from "./ios-entitlements-service";
import { IOSBuildData } from "../data/build-data";
import { IOSPrepareData } from "../data/prepare-data";
import { BUILD_XCCONFIG_FILE_NAME, IosProjectConstants } from "../constants";

interface INativeSourceCodeGroup {
	name: string;
	path: string;
	files: string[];
}

const DevicePlatformSdkName = "iphoneos";
const SimulatorPlatformSdkName = "iphonesimulator";
const FRAMEWORK_EXTENSIONS = [".framework", ".xcframework"];

const getPlatformSdkName = (forDevice: boolean): string => forDevice ? DevicePlatformSdkName : SimulatorPlatformSdkName;
const getConfigurationName = (release: boolean): string => release ? Configurations.Release : Configurations.Debug;

export class IOSProjectService extends projectServiceBaseLib.PlatformProjectServiceBase {
	private static IOS_PROJECT_NAME_PLACEHOLDER = "__PROJECT_NAME__";
	private static IOS_PLATFORM_NAME = "ios";

	constructor($fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $cocoapodsService: ICocoaPodsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $injector: IInjector,
		$projectDataService: IProjectDataService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $hostInfo: IHostInfo,
		private $xcprojService: IXcprojService,
		private $iOSProvisionService: IOSProvisionService,
		private $iOSSigningService: IiOSSigningService,
		private $pbxprojDomXcode: IPbxprojDomXcode,
		private $xcode: IXcode,
		private $iOSEntitlementsService: IOSEntitlementsService,
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		private $plistParser: IPlistParser,
		private $xcconfigService: IXcconfigService,
		private $xcodebuildService: IXcodebuildService,
		private $iOSExtensionsService: IIOSExtensionsService,
		private $iOSWatchAppService: IIOSWatchAppService) {
		super($fs, $projectDataService);
	}

	private _platformsDirCache: string = null;
	private _platformData: IPlatformData = null;
	public getPlatformData(projectData: IProjectData): IPlatformData {
		if (!projectData && !this._platformData) {
			throw new Error("First call of getPlatformData without providing projectData.");
		}

		if (projectData && projectData.platformsDir && this._platformsDirCache !== projectData.platformsDir) {
			const projectRoot = path.join(projectData.platformsDir, this.$devicePlatformsConstants.iOS.toLowerCase());

			this._platformData = {
				frameworkPackageName: constants.TNS_IOS_RUNTIME_NAME,
				normalizedPlatformName: "iOS",
				platformNameLowerCase: "ios",
				appDestinationDirectoryPath: path.join(projectRoot, projectData.projectName),
				platformProjectService: <any>this,
				projectRoot: projectRoot,
				getBuildOutputPath: (options: IBuildData): string => {
					const config = getConfigurationName(!options || options.release);
					return path.join(projectRoot, constants.BUILD_DIR, `${config}-${getPlatformSdkName(!options || options.buildForDevice || options.buildForAppStore)}`);
				},
				getValidBuildOutputData: (buildOptions: IBuildData): IValidBuildOutputData => {
					const forDevice = !buildOptions || !!buildOptions.buildForDevice || !!buildOptions.buildForAppStore;
					if (forDevice) {
						return {
							packageNames: [`${projectData.projectName}.ipa`]
						};
					}

					return {
						packageNames: [`${projectData.projectName}.app`, `${projectData.projectName}.zip`]
					};
				},
				frameworkDirectoriesExtensions: FRAMEWORK_EXTENSIONS,
				frameworkDirectoriesNames: ["Metadata", "metadataGenerator", "NativeScript", "internal"],
				targetedOS: ['darwin'],
				configurationFileName: constants.INFO_PLIST_FILE_NAME,
				configurationFilePath: path.join(projectRoot, projectData.projectName, projectData.projectName + `-${constants.INFO_PLIST_FILE_NAME}`),
				relativeToFrameworkConfigurationFilePath: path.join("__PROJECT_NAME__", "__PROJECT_NAME__-Info.plist"),
				fastLivesyncFileExtensions: [".tiff", ".tif", ".jpg", "jpeg", "gif", ".png", ".bmp", ".BMPf", ".ico", ".cur", ".xbm"] // https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/
			};
		}

		return this._platformData;
	}

	public async validateOptions(projectId: string, provision: true | string, teamId: true | string): Promise<boolean> {
		if (provision && teamId) {
			this.$errors.fail("The options --provision and --teamId are mutually exclusive.");
		}

		if (provision === true) {
			await this.$iOSProvisionService.listProvisions(projectId);
			this.$errors.fail("Please provide provisioning profile uuid or name with the --provision option.");
		}

		if (teamId === true) {
			await this.$iOSProvisionService.listTeams();
			this.$errors.fail("Please provide team id or team name with the --teamId options.");
		}

		return true;
	}

	public getAppResourcesDestinationDirectoryPath(projectData: IProjectData): string {
		return path.join(this.getPlatformData(projectData).projectRoot, projectData.projectName, "Resources");
	}

	public async validate(projectData: IProjectData, options: IOptions, notConfiguredEnvOptions?: INotConfiguredEnvOptions): Promise<IValidatePlatformOutput> {
		if (!this.$hostInfo.isDarwin) {
			return;
		}

		const checkEnvironmentRequirementsOutput = await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
			platform: this.getPlatformData(projectData).normalizedPlatformName,
			projectDir: projectData.projectDir,
			options,
			notConfiguredEnvOptions
		});

		return {
			checkEnvironmentRequirementsOutput
		};
	}

	public async createProject(frameworkDir: string, frameworkVersion: string, projectData: IProjectData): Promise<void> {
		this.$fs.ensureDirectoryExists(path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER));
		shell.cp("-R", path.join(frameworkDir, "*"), this.getPlatformData(projectData).projectRoot);
	}

	//TODO: plamen5kov: revisit this method, might have unnecessary/obsolete logic
	public async interpolateData(projectData: IProjectData): Promise<void> {
		const projectRootFilePath = path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER);
		// Starting with NativeScript for iOS 1.6.0, the project Info.plist file resides not in the platform project,
		// but in the hello-world app template as a platform specific resource.
		if (this.$fs.exists(path.join(projectRootFilePath, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + "-Info.plist"))) {
			this.replaceFileName("-Info.plist", projectRootFilePath, projectData);
		}
		this.replaceFileName("-Prefix.pch", projectRootFilePath, projectData);
		if (this.$fs.exists(path.join(projectRootFilePath, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + ".entitlements"))) {
			this.replaceFileName(".entitlements", projectRootFilePath, projectData);
		}

		const xcschemeDirPath = path.join(this.getPlatformData(projectData).projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + IosProjectConstants.XcodeProjExtName, "xcshareddata/xcschemes");
		const xcschemeFilePath = path.join(xcschemeDirPath, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + IosProjectConstants.XcodeSchemeExtName);

		if (this.$fs.exists(xcschemeFilePath)) {
			this.$logger.debug("Found shared scheme at xcschemeFilePath, renaming to match project name.");
			this.$logger.debug("Checkpoint 0");
			this.replaceFileContent(xcschemeFilePath, projectData);
			this.$logger.debug("Checkpoint 1");
			this.replaceFileName(IosProjectConstants.XcodeSchemeExtName, xcschemeDirPath, projectData);
			this.$logger.debug("Checkpoint 2");
		} else {
			this.$logger.debug("Copying xcscheme from template not found at " + xcschemeFilePath);
		}

		this.replaceFileName(IosProjectConstants.XcodeProjExtName, this.getPlatformData(projectData).projectRoot, projectData);

		const pbxprojFilePath = this.getPbxProjPath(projectData);
		this.replaceFileContent(pbxprojFilePath, projectData);
	}

	public interpolateConfigurationFile(projectData: IProjectData): void {
		return undefined;
	}

	public async cleanProject(projectRoot: string, projectData: IProjectData): Promise<void> {
		return null;
	}

	public afterCreateProject(projectRoot: string, projectData: IProjectData): void {
		this.$fs.rename(path.join(projectRoot, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER),
			path.join(projectRoot, projectData.projectName));
	}

	public async buildProject(projectRoot: string, projectData: IProjectData, iOSBuildData: IOSBuildData): Promise<void> {
		const platformData = this.getPlatformData(projectData);

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
		};

		if (iOSBuildData.buildForDevice) {
			await this.$iOSSigningService.setupSigningForDevice(projectRoot, projectData, iOSBuildData);
			await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
				this.$childProcess,
				handler,
				this.$xcodebuildService.buildForDevice(platformData, projectData, <any>iOSBuildData));
		} else if (iOSBuildData.buildForAppStore) {
			await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
				this.$childProcess,
				handler,
				this.$xcodebuildService.buildForAppStore(platformData, projectData, <any>iOSBuildData));
		} else {
			await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
				this.$childProcess,
				handler,
				this.$xcodebuildService.buildForSimulator(platformData, projectData, <any>iOSBuildData));
		}

		this.validateApplicationIdentifier(projectData);
	}

	public isPlatformPrepared(projectRoot: string, projectData: IProjectData): boolean {
		return this.$fs.exists(path.join(projectRoot, projectData.projectName, constants.APP_FOLDER_NAME));
	}

	public cleanDeviceTempFolder(deviceIdentifier: string): Promise<void> {
		return Promise.resolve();
	}

	private async isDynamicFramework(frameworkPath: string): Promise<boolean> {
		const frameworkName = path.basename(frameworkPath, path.extname(frameworkPath));
		const isDynamicFrameworkBundle = async (bundlePath: string) => {
			const frameworkBinaryPath = path.join(bundlePath, frameworkName);

			return _.includes((await this.$childProcess.spawnFromEvent("file", [frameworkBinaryPath], "close")).stdout, "dynamically linked");
		};

		if (path.extname(frameworkPath) === ".xcframework") {
			let isDynamic = true;
			const subDirs = this.$fs.readDirectory(frameworkPath).filter(entry => this.$fs.getFsStats(entry).isDirectory());
			for (const subDir of subDirs) {
				const singlePlatformFramework = path.join(subDir, frameworkName + ".framework");
				if (this.$fs.exists(singlePlatformFramework)) {
					isDynamic = await isDynamicFrameworkBundle(singlePlatformFramework);
					break;
				}
			}

			return isDynamic;
		} else {
			return await isDynamicFrameworkBundle(frameworkName);
		}
	}

	private async addFramework(frameworkPath: string, projectData: IProjectData): Promise<void> {
		if (!this.$hostInfo.isWindows) {
			this.validateFramework(frameworkPath);

			const project = this.createPbxProj(projectData);
			const frameworkAddOptions: IXcode.Options = { customFramework: true };
			if (this.isDynamicFramework(frameworkPath)) {
				frameworkAddOptions["embed"] = true;
			}

			const frameworkRelativePath = '$(SRCROOT)/' + this.getLibSubpathRelativeToProjectPath(frameworkPath, projectData);
			project.addFramework(frameworkRelativePath, frameworkAddOptions);
			this.savePbxProj(project, projectData);
		}
	}

	private async addStaticLibrary(staticLibPath: string, projectData: IProjectData): Promise<void> {
		// Copy files to lib folder.
		const libraryName = path.basename(staticLibPath, ".a");
		const headersSubpath = path.join(path.dirname(staticLibPath), "include", libraryName);

		// Add static library to project file and setup header search paths
		const project = this.createPbxProj(projectData);
		const relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(staticLibPath, projectData);
		project.addFramework(relativeStaticLibPath);

		const relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath, projectData));
		project.addToHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });

		this.generateModulemap(headersSubpath, libraryName);
		this.savePbxProj(project, projectData);
	}

	public canUpdatePlatform(installedModuleDir: string, projectData: IProjectData): boolean {
		const currentXcodeProjectFile = this.buildPathToCurrentXcodeProjectFile(projectData);
		const currentXcodeProjectFileContent = this.$fs.readFile(currentXcodeProjectFile);

		const newXcodeProjectFile = this.buildPathToNewXcodeProjectFile(installedModuleDir);
		this.replaceFileContent(newXcodeProjectFile, projectData);
		const newXcodeProjectFileContent = this.$fs.readFile(newXcodeProjectFile);

		const contentIsTheSame = currentXcodeProjectFileContent.toString() === newXcodeProjectFileContent.toString();

		if (!contentIsTheSame) {
			this.$logger.warn(`The content of the current project file: ${currentXcodeProjectFile} and the new project file: ${newXcodeProjectFile} is different.`);
		}

		return contentIsTheSame;
	}

	public async prepareProject(projectData: IProjectData, prepareData: IOSPrepareData): Promise<void> {
		const projectRoot = path.join(projectData.platformsDir, "ios");
		const platformData = this.getPlatformData(projectData);
		const resourcesDirectoryPath = projectData.getAppResourcesDirectoryPath();

		const provision = prepareData && prepareData.provision;
		const teamId = prepareData && prepareData.teamId;
		if (provision) {
			await this.$iOSSigningService.setupSigningFromProvision(projectRoot, projectData, provision, prepareData.mobileProvisionData);
		}
		if (teamId) {
			await this.$iOSSigningService.setupSigningFromTeam(projectRoot, projectData, teamId);
		}

		const project = this.createPbxProj(projectData);

		const resources = project.pbxGroupByName("Resources");

		if (resources) {
			const references = project.pbxFileReferenceSection();

			const xcodeProjectImages = _.map(<any[]>resources.children, resource => this.replace(references[resource.value].name));
			this.$logger.trace("Images from Xcode project");
			this.$logger.trace(xcodeProjectImages);

			const appResourcesImages = this.$fs.readDirectory(this.getAppResourcesDestinationDirectoryPath(projectData));
			this.$logger.trace("Current images from App_Resources");
			this.$logger.trace(appResourcesImages);

			const imagesToAdd = _.difference(appResourcesImages, xcodeProjectImages);
			this.$logger.trace(`New images to add into xcode project: ${imagesToAdd.join(", ")}`);
			_.each(imagesToAdd, image => project.addResourceFile(path.relative(this.getPlatformData(projectData).projectRoot, path.join(this.getAppResourcesDestinationDirectoryPath(projectData), image))));

			const imagesToRemove = _.difference(xcodeProjectImages, appResourcesImages);
			this.$logger.trace(`Images to remove from xcode project: ${imagesToRemove.join(", ")}`);
			_.each(imagesToRemove, image => project.removeResourceFile(path.join(this.getAppResourcesDestinationDirectoryPath(projectData), image)));

			this.savePbxProj(project, projectData);

			const resourcesNativeCodePath = path.join(
				resourcesDirectoryPath,
				platformData.normalizedPlatformName,
				constants.NATIVE_SOURCE_FOLDER
			);
			await this.prepareNativeSourceCode(constants.TNS_NATIVE_SOURCE_GROUP_NAME, resourcesNativeCodePath, projectData);
		}

		const pbxProjPath = this.getPbxProjPath(projectData);
		this.$iOSWatchAppService.removeWatchApp({ pbxProjPath });
		const addedWatchApp = await this.$iOSWatchAppService.addWatchAppFromPath({ watchAppFolderPath: path.join(resourcesDirectoryPath, platformData.normalizedPlatformName), projectData, platformData, pbxProjPath });

		if (addedWatchApp) {
			this.$logger.warn("The support for Apple Watch App is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/nativescript-cli/issues/4589");
		}
	}

	public prepareAppResources(projectData: IProjectData): void {
		const platformData = this.getPlatformData(projectData);
		const projectAppResourcesPath = projectData.getAppResourcesDirectoryPath(projectData.projectDir);
		const platformsAppResourcesPath = this.getAppResourcesDestinationDirectoryPath(projectData);

		this.$fs.deleteDirectory(platformsAppResourcesPath);
		this.$fs.ensureDirectoryExists(platformsAppResourcesPath);

		this.$fs.copyFile(path.join(projectAppResourcesPath, platformData.normalizedPlatformName, "*"), platformsAppResourcesPath);

		this.$fs.deleteFile(path.join(platformsAppResourcesPath, platformData.configurationFileName));
		this.$fs.deleteFile(path.join(platformsAppResourcesPath, constants.PODFILE_NAME));

		this.$fs.deleteDirectory(path.join(platformsAppResourcesPath, constants.NATIVE_SOURCE_FOLDER));
		this.$fs.deleteDirectory(path.join(platformsAppResourcesPath, constants.NATIVE_EXTENSION_FOLDER));
		this.$fs.deleteDirectory(path.join(platformsAppResourcesPath, "watchapp"));
		this.$fs.deleteDirectory(path.join(platformsAppResourcesPath, "watchextension"));
	}

	public async processConfigurationFilesFromAppResources(projectData: IProjectData, opts: IRelease): Promise<void> {
		await this.mergeInfoPlists(projectData, opts);
		await this.$iOSEntitlementsService.merge(projectData);
		await this.mergeProjectXcconfigFiles(projectData);
	}

	public ensureConfigurationFileInAppResources(): void {
		return null;
	}

	private async mergeInfoPlists(projectData: IProjectData, buildOptions: IRelease): Promise<void> {
		const projectDir = projectData.projectDir;
		const infoPlistPath = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, this.getPlatformData(projectData).configurationFileName);
		this.ensureConfigurationFileInAppResources();

		const reporterTraceMessage = "Info.plist:";
		const reporter: Reporter = {
			log: (txt: string) => this.$logger.trace(`${reporterTraceMessage} ${txt}`),
			warn: (txt: string) => this.$logger.warn(`${reporterTraceMessage} ${txt}`)
		};

		const session = new PlistSession(reporter);
		const makePatch = (plistPath: string) => {
			if (!this.$fs.exists(plistPath)) {
				this.$logger.trace("No plist found at: " + plistPath);
				return;
			}

			this.$logger.trace("Schedule merge plist at: " + plistPath);
			session.patch({
				name: path.relative(projectDir, plistPath),
				read: () => this.$fs.readText(plistPath)
			});
		};

		const allPlugins = await this.getAllInstalledPlugins(projectData);
		for (const plugin of allPlugins) {
			const pluginInfoPlistPath = path.join(plugin.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME), this.getPlatformData(projectData).configurationFileName);
			makePatch(pluginInfoPlistPath);
		}

		makePatch(infoPlistPath);

		if (projectData.projectIdentifiers && projectData.projectIdentifiers.ios) {
			session.patch({
				name: "CFBundleIdentifier from package.json nativescript.id",
				read: () =>
					`<?xml version="1.0" encoding="UTF-8"?>
						<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
						<plist version="1.0">
						<dict>
							<key>CFBundleIdentifier</key>
							<string>${projectData.projectIdentifiers.ios}</string>
						</dict>
						</plist>`
			});
		}

		if (!buildOptions.release && projectData.projectIdentifiers && projectData.projectIdentifiers.ios) {
			session.patch({
				name: "CFBundleURLTypes from package.json nativescript.id",
				read: () =>
					`<?xml version="1.0" encoding="UTF-8"?>
						<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
						<plist version="1.0">
						<dict>
							<key>CFBundleURLTypes</key>
							<array>
								<dict>
									<key>CFBundleTypeRole</key>
									<string>Editor</string>
									<key>CFBundleURLSchemes</key>
									<array>
										<string>${projectData.projectIdentifiers.ios.replace(/[^A-Za-z0-9]/g, "")}</string>
									</array>
								</dict>
							</array>
						</dict>
						</plist>`
			});
		}

		const plistContent = session.build();

		this.$logger.trace("Info.plist: Write to: " + this.getPlatformData(projectData).configurationFilePath);
		this.$fs.writeFile(this.getPlatformData(projectData).configurationFilePath, plistContent);
	}

	private getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]> {
		return (<IPluginsService>this.$injector.resolve("pluginsService")).getAllInstalledPlugins(projectData);
	}

	private replace(name: string): string {
		if (_.startsWith(name, '"')) {
			name = name.substr(1, name.length - 2);
		}

		return name.replace(/\\\"/g, "\"");
	}

	private getLibSubpathRelativeToProjectPath(targetPath: string, projectData: IProjectData): string {
		const frameworkPath = path.relative(this.getPlatformData(projectData).projectRoot, targetPath);
		return frameworkPath;
	}

	private getPbxProjPath(projectData: IProjectData): string {
		return path.join(this.$xcprojService.getXcodeprojPath(projectData, this.getPlatformData(projectData).projectRoot), "project.pbxproj");
	}

	private createPbxProj(projectData: IProjectData): any {
		const project = new this.$xcode.project(this.getPbxProjPath(projectData));
		project.parseSync();

		return project;
	}

	private savePbxProj(project: any, projectData: IProjectData, omitEmptyValues?: boolean): void {
		return this.$fs.writeFile(this.getPbxProjPath(projectData), project.writeSync({ omitEmptyValues }));
	}

	public async preparePluginNativeCode(pluginData: IPluginData, projectData: IProjectData, opts?: any): Promise<void> {
		const pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

		const sourcePath = path.join(pluginPlatformsFolderPath, "src");
		if (this.$fs.exists(pluginPlatformsFolderPath) && this.$fs.exists(sourcePath)) {
			await this.prepareNativeSourceCode(pluginData.name, sourcePath, projectData);
		}

		await this.prepareResources(pluginPlatformsFolderPath, pluginData, projectData);
		await this.prepareFrameworks(pluginPlatformsFolderPath, pluginData, projectData);
		await this.prepareStaticLibs(pluginPlatformsFolderPath, pluginData, projectData);

		const projectRoot = this.getPlatformData(projectData).projectRoot;
		await this.$cocoapodsService.applyPodfileToProject(pluginData.name, this.$cocoapodsService.getPluginPodfilePath(pluginData), projectData, projectRoot);
	}

	public async removePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		const pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

		this.removeNativeSourceCode(pluginPlatformsFolderPath, pluginData, projectData);
		this.removeFrameworks(pluginPlatformsFolderPath, pluginData, projectData);
		this.removeStaticLibs(pluginPlatformsFolderPath, pluginData, projectData);
		const projectRoot = this.getPlatformData(projectData).projectRoot;

		this.$cocoapodsService.removePodfileFromProject(pluginData.name, this.$cocoapodsService.getPluginPodfilePath(pluginData), projectData, projectRoot);
	}

	public async handleNativeDependenciesChange(projectData: IProjectData, opts: IRelease): Promise<void> {
		const platformData = this.getPlatformData(projectData);
		await this.$cocoapodsService.applyPodfileFromAppResources(projectData, platformData);

		const projectPodfilePath = this.$cocoapodsService.getProjectPodfilePath(platformData.projectRoot);
		if (this.$fs.exists(projectPodfilePath)) {
			await this.$cocoapodsService.executePodInstall(platformData.projectRoot, this.$xcprojService.getXcodeprojPath(projectData, platformData.projectRoot));
			// The `pod install` command adds a new target to the .pbxproject. This target adds additional build phases to Xcode project.
			// Some of these phases relies on env variables (like PODS_PODFILE_DIR_PATH or PODS_ROOT).
			// These variables are produced from merge of pod's xcconfig file and project's xcconfig file.
			// So the correct order is `pod install` to be executed before merging pod's xcconfig file.
			await this.$cocoapodsService.mergePodXcconfigFile(projectData, platformData, opts);
		}

		const pbxProjPath = this.getPbxProjPath(projectData);
		this.$iOSExtensionsService.removeExtensions({ pbxProjPath });
		await this.addExtensions(projectData);
	}

	public beforePrepareAllPlugins(): Promise<void> {
		return Promise.resolve();
	}

	public async checkForChanges(changesInfo: IProjectChangesInfo, prepareData: IOSPrepareData, projectData: IProjectData): Promise<void> {
		const { provision, teamId } = prepareData;
		const hasProvision = provision !== undefined;
		const hasTeamId = teamId !== undefined;
		if (hasProvision || hasTeamId) {
			// Check if the native project's signing is set to the provided provision...
			const pbxprojPath = this.getPbxProjPath(projectData);

			if (this.$fs.exists(pbxprojPath)) {
				const xcode = this.$pbxprojDomXcode.Xcode.open(pbxprojPath);
				const signing = xcode.getSigning(projectData.projectName);

				if (hasProvision) {
					if (signing && signing.style === "Manual") {
						for (const name in signing.configurations) {
							const config = signing.configurations[name];
							if (config.uuid !== provision && config.name !== provision) {
								changesInfo.signingChanged = true;
								break;
							}
						}
					} else {
						// Specifying provisioning profile requires "Manual" signing style.
						// If the current signing style was not "Manual" it was probably "Automatic" or,
						// it was not uniform for the debug and release build configurations.
						changesInfo.signingChanged = true;
					}
				}
				if (hasTeamId) {
					if (signing && signing.style === "Automatic") {
						if (signing.team !== teamId) {
							const teamIdsForName = await this.$iOSProvisionService.getTeamIdsWithName(teamId);
							if (!teamIdsForName.some(id => id === signing.team)) {
								changesInfo.signingChanged = true;
							}
						}
					} else {
						// Specifying team id or name requires "Automatic" signing style.
						// If the current signing style was not "Automatic" it was probably "Manual".
						changesInfo.signingChanged = true;
					}
				}
			} else {
				changesInfo.signingChanged = true;
			}
		}
	}

	public getDeploymentTarget(projectData: IProjectData): string {
		const target = this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "IPHONEOS_DEPLOYMENT_TARGET");
		return target;
	}

	private getAllLibsForPluginWithFileExtension(pluginData: IPluginData, fileExtension: string | string[]): string[] {
		const fileExtensions = _.isArray(fileExtension) ? fileExtension : [fileExtension];
		const filterCallback = (fileName: string, pluginPlatformsFolderPath: string) =>
		fileExtensions.indexOf(path.extname(fileName)) !== -1;
		return this.getAllNativeLibrariesForPlugin(pluginData, IOSProjectService.IOS_PLATFORM_NAME, filterCallback);
	}

	private buildPathToCurrentXcodeProjectFile(projectData: IProjectData): string {
		return path.join(projectData.platformsDir, "ios", `${projectData.projectName}.xcodeproj`, "project.pbxproj");
	}

	private buildPathToNewXcodeProjectFile(newModulesDir: string): string {
		return path.join(newModulesDir, constants.PROJECT_FRAMEWORK_FOLDER_NAME, `${IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER}.xcodeproj`, "project.pbxproj");
	}

	private validateFramework(libraryPath: string): void {
		const infoPlistPath = path.join(libraryPath, constants.INFO_PLIST_FILE_NAME);
		if (!this.$fs.exists(infoPlistPath)) {
			this.$errors.fail("The bundle at %s does not contain an Info.plist file.", libraryPath);
		}

		const plistJson = this.$plistParser.parseFileSync(infoPlistPath);
		const packageType = plistJson["CFBundlePackageType"];

		if (packageType !== "FMWK" && packageType !== "XFWK") {
			this.$errors.fail("The bundle at %s does not appear to be a dynamic framework.", libraryPath);
		}
	}

	private replaceFileContent(file: string, projectData: IProjectData): void {
		const fileContent = this.$fs.readText(file);
		const replacedContent = helpers.stringReplaceAll(fileContent, IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER, projectData.projectName);
		this.$fs.writeFile(file, replacedContent);
	}

	private replaceFileName(fileNamePart: string, fileRootLocation: string, projectData: IProjectData): void {
		const oldFileName = IOSProjectService.IOS_PROJECT_NAME_PLACEHOLDER + fileNamePart;
		const newFileName = projectData.projectName + fileNamePart;

		this.$fs.rename(path.join(fileRootLocation, oldFileName), path.join(fileRootLocation, newFileName));
	}

	private async prepareNativeSourceCode(groupName: string, sourceFolderPath: string, projectData: IProjectData): Promise<void> {
		const project = this.createPbxProj(projectData);
		const group = this.getRootGroup(groupName, sourceFolderPath);
		project.addPbxGroup(group.files, group.name, group.path, null, { isMain: true, filesRelativeToProject: true });
		project.addToHeaderSearchPaths(group.path);
		this.savePbxProj(project, projectData);
	}

	private async addExtensions(projectData: IProjectData): Promise<void> {
		const resorcesExtensionsPath = path.join(
			projectData.getAppResourcesDirectoryPath(),
			this.getPlatformData(projectData).normalizedPlatformName, constants.NATIVE_EXTENSION_FOLDER
		);
		const platformData = this.getPlatformData(projectData);
		const pbxProjPath = this.getPbxProjPath(projectData);
		const addedExtensionsFromResources = await this.$iOSExtensionsService.addExtensionsFromPath({ extensionsFolderPath: resorcesExtensionsPath, projectData, platformData, pbxProjPath });
		const plugins = await this.getAllInstalledPlugins(projectData);
		let addedExtensionsFromPlugins = false;
		for (const pluginIndex in plugins) {
			const pluginData = plugins[pluginIndex];
			const pluginPlatformsFolderPath = pluginData.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);

			const extensionPath = path.join(pluginPlatformsFolderPath, constants.NATIVE_EXTENSION_FOLDER);
			const addedExtensionFromPlugin = await this.$iOSExtensionsService.addExtensionsFromPath({ extensionsFolderPath: extensionPath, projectData, platformData, pbxProjPath });
			addedExtensionsFromPlugins = addedExtensionsFromPlugins || addedExtensionFromPlugin;
		}

		if (addedExtensionsFromResources || addedExtensionsFromPlugins) {
			this.$logger.warn("The support for iOS App Extensions is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/nativescript-cli/issues/4472");
		}
	}

	private getRootGroup(name: string, rootPath: string) {
		const filePathsArr: string[] = [];
		const rootGroup: INativeSourceCodeGroup = { name: name, files: filePathsArr, path: rootPath };

		if (this.$fs.exists(rootPath)) {
			const stats = this.$fs.getFsStats(rootPath);
			if (stats.isDirectory() && !this.$fs.isEmptyDir(rootPath)) {
				this.$fs.readDirectory(rootPath).forEach(fileName => {
					const filePath = path.join(rootGroup.path, fileName);
					filePathsArr.push(filePath);
				});
			}
		}

		return rootGroup;
	}

	private async prepareResources(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		const project = this.createPbxProj(projectData);
		const resourcesPath = path.join(pluginPlatformsFolderPath, "Resources");
		if (this.$fs.exists(resourcesPath) && !this.$fs.isEmptyDir(resourcesPath)) {
			for (const fileName of this.$fs.readDirectory(resourcesPath)) {
				const filePath = path.join(resourcesPath, fileName);

				project.addResourceFile(filePath);
			}
		}
		this.savePbxProj(project, projectData);
	}
	private async prepareFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		for (const fileName of this.getAllLibsForPluginWithFileExtension(pluginData, FRAMEWORK_EXTENSIONS)) {
			await this.addFramework(path.join(pluginPlatformsFolderPath, fileName), projectData);
		}
	}

	private async prepareStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		for (const fileName of this.getAllLibsForPluginWithFileExtension(pluginData, ".a")) {
			await this.addStaticLibrary(path.join(pluginPlatformsFolderPath, fileName), projectData);
		}
	}

	private removeNativeSourceCode(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		const project = this.createPbxProj(projectData);
		const group = this.getRootGroup(pluginData.name, pluginPlatformsFolderPath);
		project.removePbxGroup(group.name, group.path);
		project.removeFromHeaderSearchPaths(group.path);
		this.savePbxProj(project, projectData);
	}

	private removeFrameworks(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		const project = this.createPbxProj(projectData);
		_.each(this.getAllLibsForPluginWithFileExtension(pluginData, FRAMEWORK_EXTENSIONS), fileName => {
			const relativeFrameworkPath = this.getLibSubpathRelativeToProjectPath(fileName, projectData);
			project.removeFramework(relativeFrameworkPath, { customFramework: true, embed: true });
		});

		this.savePbxProj(project, projectData);
	}

	private removeStaticLibs(pluginPlatformsFolderPath: string, pluginData: IPluginData, projectData: IProjectData): void {
		const project = this.createPbxProj(projectData);

		_.each(this.getAllLibsForPluginWithFileExtension(pluginData, ".a"), fileName => {
			const staticLibPath = path.join(pluginPlatformsFolderPath, fileName);
			const relativeStaticLibPath = this.getLibSubpathRelativeToProjectPath(path.basename(staticLibPath), projectData);
			project.removeFramework(relativeStaticLibPath);

			const headersSubpath = path.join("include", path.basename(staticLibPath, ".a"));
			const relativeHeaderSearchPath = path.join(this.getLibSubpathRelativeToProjectPath(headersSubpath, projectData));
			project.removeFromHeaderSearchPaths({ relativePath: relativeHeaderSearchPath });
		});

		this.savePbxProj(project, projectData);
	}

	private generateModulemap(headersFolderPath: string, libraryName: string): void {
		const headersFilter = (fileName: string, containingFolderPath: string) => (path.extname(fileName) === ".h" && this.$fs.getFsStats(path.join(containingFolderPath, fileName)).isFile());
		const headersFolderContents = this.$fs.readDirectory(headersFolderPath);
		let headers = _(headersFolderContents).filter(item => headersFilter(item, headersFolderPath)).value();

		if (!headers.length) {
			this.$fs.deleteFile(path.join(headersFolderPath, "module.modulemap"));
			return;
		}

		headers = _.map(headers, value => `header "${value}"`);

		const modulemap = `module ${libraryName} { explicit module ${libraryName} { ${headers.join(" ")} } }`;
		this.$fs.writeFile(path.join(headersFolderPath, "module.modulemap"), modulemap);
	}

	private async mergeProjectXcconfigFiles(projectData: IProjectData): Promise<void> {
		const platformData = this.getPlatformData(projectData);
		const pluginsXcconfigFilePaths = _.values(this.$xcconfigService.getPluginsXcconfigFilePaths(platformData.projectRoot));

		for (const pluginsXcconfigFilePath of pluginsXcconfigFilePaths) {
			this.$fs.deleteFile(pluginsXcconfigFilePath);
		}

		const pluginsService = <IPluginsService>this.$injector.resolve("pluginsService");
		const allPlugins: IPluginData[] = await pluginsService.getAllInstalledPlugins(projectData);
		for (const plugin of allPlugins) {
			const pluginPlatformsFolderPath = plugin.pluginPlatformsFolderPath(IOSProjectService.IOS_PLATFORM_NAME);
			const pluginXcconfigFilePath = path.join(pluginPlatformsFolderPath, BUILD_XCCONFIG_FILE_NAME);
			if (this.$fs.exists(pluginXcconfigFilePath)) {
				for (const pluginsXcconfigFilePath of pluginsXcconfigFilePaths) {
					await this.$xcconfigService.mergeFiles(pluginXcconfigFilePath, pluginsXcconfigFilePath);
				}
			}
		}

		const appResourcesXcconfigPath = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, BUILD_XCCONFIG_FILE_NAME);
		if (this.$fs.exists(appResourcesXcconfigPath)) {
			for (const pluginsXcconfigFilePath of pluginsXcconfigFilePaths) {
				await this.$xcconfigService.mergeFiles(appResourcesXcconfigPath, pluginsXcconfigFilePath);
			}
		}

		for (const pluginsXcconfigFilePath of pluginsXcconfigFilePaths) {
			if (!this.$fs.exists(pluginsXcconfigFilePath)) {
				// We need the pluginsXcconfig file to exist in platforms dir as it is required in the native template:
				// https://github.com/NativeScript/ios-runtime/blob/9c2b7b5f70b9bee8452b7a24aa6b646214c7d2be/build/project-template/__PROJECT_NAME__/build-debug.xcconfig#L3
				// From Xcode 10 in case the file is missing, this include fails and the build itself fails (was a warning in previous Xcode versions).
				this.$fs.writeFile(pluginsXcconfigFilePath, "");
			}
		}

		for (const pluginsXcconfigFilePath of pluginsXcconfigFilePaths) {
			// Set Entitlements Property to point to default file if not set explicitly by the user.
			const entitlementsPropertyValue = this.$xcconfigService.readPropertyValue(pluginsXcconfigFilePath, constants.CODE_SIGN_ENTITLEMENTS);
			if (entitlementsPropertyValue === null && this.$fs.exists(this.$iOSEntitlementsService.getPlatformsEntitlementsPath(projectData))) {
				temp.track();
				const tempEntitlementsDir = temp.mkdirSync("entitlements");
				const tempEntitlementsFilePath = path.join(tempEntitlementsDir, "set-entitlements.xcconfig");
				const entitlementsRelativePath = this.$iOSEntitlementsService.getPlatformsEntitlementsRelativePath(projectData);
				this.$fs.writeFile(tempEntitlementsFilePath, `CODE_SIGN_ENTITLEMENTS = ${entitlementsRelativePath}${EOL}`);

				await this.$xcconfigService.mergeFiles(tempEntitlementsFilePath, pluginsXcconfigFilePath);
			}
		}
	}

	private getBuildXCConfigFilePath(projectData: IProjectData): string {
		const buildXCConfig = path.join(projectData.appResourcesDirectoryPath,
			this.getPlatformData(projectData).normalizedPlatformName, BUILD_XCCONFIG_FILE_NAME);
		return buildXCConfig;
	}

	private validateApplicationIdentifier(projectData: IProjectData): void {
		const infoPlistPath = path.join(projectData.appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName, this.getPlatformData(projectData).configurationFileName);
		const mergedPlistPath = this.getPlatformData(projectData).configurationFilePath;

		if (!this.$fs.exists(infoPlistPath) || !this.$fs.exists(mergedPlistPath)) {
			return;
		}

		const infoPlist = plist.parse(this.$fs.readText(infoPlistPath));
		const mergedPlist = plist.parse(this.$fs.readText(mergedPlistPath));

		if (infoPlist.CFBundleIdentifier && infoPlist.CFBundleIdentifier !== mergedPlist.CFBundleIdentifier) {
			this.$logger.warn("[WARNING]: The CFBundleIdentifier key inside the 'Info.plist' will be overriden by the 'id' inside 'package.json'.");
		}
	}
}

$injector.register("iOSProjectService", IOSProjectService);
