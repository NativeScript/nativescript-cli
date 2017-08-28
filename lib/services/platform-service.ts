import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import { EventEmitter } from "events";
import { AppFilesUpdater } from "./app-files-updater";
import { attachAwaitDetach } from "../common/helpers";
import * as temp from "temp";
temp.track();
const clui = require("clui");

const buildInfoFileName = ".nsbuildinfo";

export class PlatformService extends EventEmitter implements IPlatformService {
	// Type with hooks needs to have either $hooksService or $injector injected.
	// In order to stop TypeScript from failing for not used $hooksService, use it here.
	private get _hooksService(): IHooksService {
		return this.$hooksService;
	}

	private _trackedProjectFilePath: string = null;

	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npmInstallationManager: INpmInstallationManager,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $hooksService: IHooksService,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $pluginsService: IPluginsService,
		private $projectFilesManager: IProjectFilesManager,
		private $mobileHelper: Mobile.IMobileHelper,
		private $hostInfo: IHostInfo,
		private $devicePathProvider: IDevicePathProvider,
		private $xmlValidator: IXmlValidator,
		private $npm: INodePackageManager,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectChangesService: IProjectChangesService,
		private $analyticsService: IAnalyticsService) {
		super();
	}

	public async cleanPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, framworkPath?: string): Promise<void> {
		for (const platform of platforms) {
			const version: string = this.getCurrentPlatformVersion(platform, projectData);

			let platformWithVersion: string = platform;
			if (version !== undefined) {
				platformWithVersion += "@" + version;
			}

			await this.removePlatforms([platform], projectData);
			await this.addPlatforms([platformWithVersion], platformTemplate, projectData, config);
		}
	}

	public async addPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, frameworkPath?: string): Promise<void> {
		const platformsDir = projectData.platformsDir;
		this.$fs.ensureDirectoryExists(platformsDir);

		for (const platform of platforms) {
			this.validatePlatform(platform, projectData);
			const platformPath = path.join(projectData.platformsDir, platform);

			if (this.$fs.exists(platformPath)) {
				this.$errors.failWithoutHelp(`Platform ${platform} already added`);
			}

			await this.addPlatform(platform.toLowerCase(), platformTemplate, projectData, config, frameworkPath);
		}
	}

	private getCurrentPlatformVersion(platform: string, projectData: IProjectData): string {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const currentPlatformData: any = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		let version: string;
		if (currentPlatformData && currentPlatformData[constants.VERSION_STRING]) {
			version = currentPlatformData[constants.VERSION_STRING];
		}

		return version;
	}

	private async addPlatform(platformParam: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, frameworkPath?: string, nativePrepare?: INativePrepare): Promise<void> {
		const data = platformParam.split("@");
		const platform = data[0].toLowerCase();
		let version = data[1];

		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		if (version === undefined) {
			version = this.getCurrentPlatformVersion(platform, projectData);
		}

		// Log the values for project
		this.$logger.trace("Creating NativeScript project for the %s platform", platform);
		this.$logger.trace("Path: %s", platformData.projectRoot);
		this.$logger.trace("Package: %s", projectData.projectId);
		this.$logger.trace("Name: %s", projectData.projectName);

		this.$logger.out("Copying template files...");

		let packageToInstall = "";
		const npmOptions: IStringDictionary = {
			pathToSave: path.join(projectData.platformsDir, platform),
			dependencyType: "save"
		};

		if (!frameworkPath) {
			packageToInstall = platformData.frameworkPackageName;
			npmOptions["version"] = version;
		}

		const spinner = new clui.Spinner("Installing " + packageToInstall);
		const projectDir = projectData.projectDir;
		const platformPath = path.join(projectData.platformsDir, platform);

		try {
			spinner.start();
			const downloadedPackagePath = await this.$npmInstallationManager.install(packageToInstall, projectDir, npmOptions);
			let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
			frameworkDir = path.resolve(frameworkDir);

			const coreModuleName = await this.addPlatformCore(platformData, frameworkDir, platformTemplate, projectData, config, nativePrepare);
			await this.$npm.uninstall(coreModuleName, { save: true }, projectData.projectDir);
		} catch (err) {
			this.$fs.deleteDirectory(platformPath);
			throw err;
		} finally {
			spinner.stop();
		}

		this.$fs.ensureDirectoryExists(platformPath);
		this.$logger.out("Project successfully created.");
	}

	private async addPlatformCore(platformData: IPlatformData, frameworkDir: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, nativePrepare?: INativePrepare): Promise<string> {
		const coreModuleData = this.$fs.readJson(path.join(frameworkDir, "..", "package.json"));
		const installedVersion = coreModuleData.version;
		const customTemplateOptions = await this.getPathToPlatformTemplate(platformTemplate, platformData.frameworkPackageName, projectData.projectDir);
		config.pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;

		if (!nativePrepare || !nativePrepare.skipNativePrepare) {
			const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
			this.$fs.deleteDirectory(platformDir);
			await this.addPlatformCoreNative(platformData, frameworkDir, installedVersion, projectData, config);
		}

		const frameworkPackageNameData: any = { version: installedVersion };
		if (customTemplateOptions) {
			frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
		}

		this.$projectDataService.setNSValue(projectData.projectDir, platformData.frameworkPackageName, frameworkPackageNameData);

		const coreModuleName = coreModuleData.name;
		return coreModuleName;

	}

	private async addPlatformCoreNative(platformData: IPlatformData, frameworkDir: string, installedVersion: string, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		await platformData.platformProjectService.createProject(path.resolve(frameworkDir), installedVersion, projectData, config);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await platformData.platformProjectService.interpolateData(projectData, config);
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);
	}

	private async getPathToPlatformTemplate(selectedTemplate: string, frameworkPackageName: string, projectDir: string): Promise<{ selectedTemplate: string, pathToTemplate: string }> {
		if (!selectedTemplate) {
			// read data from package.json's nativescript key
			// check the nativescript.tns-<platform>.template value
			const nativescriptPlatformData = this.$projectDataService.getNSValue(projectDir, frameworkPackageName);
			selectedTemplate = nativescriptPlatformData && nativescriptPlatformData.template;
		}

		if (selectedTemplate) {
			const tempDir = temp.mkdirSync("platform-template");
			this.$fs.writeJson(path.join(tempDir, constants.PACKAGE_JSON_FILE_NAME), {});
			try {
				const npmInstallResult = await this.$npm.install(selectedTemplate, tempDir, {
					disableNpmInstall: false,
					frameworkPath: null,
					ignoreScripts: false
				});
				const pathToTemplate = path.join(tempDir, constants.NODE_MODULES_FOLDER_NAME, npmInstallResult.name);
				return { selectedTemplate, pathToTemplate };
			} catch (err) {
				this.$logger.trace("Error while trying to install specified template: ", err);
				this.$errors.failWithoutHelp(`Unable to install platform template ${selectedTemplate}. Make sure the specified value is valid.`);
			}
		}

		return null;
	}

	public getInstalledPlatforms(projectData: IProjectData): string[] {
		if (!this.$fs.exists(projectData.platformsDir)) {
			return [];
		}

		const subDirs = this.$fs.readDirectory(projectData.platformsDir);
		return _.filter(subDirs, p => this.$platformsData.platformsNames.indexOf(p) > -1);
	}

	public getAvailablePlatforms(projectData: IProjectData): string[] {
		const installedPlatforms = this.getInstalledPlatforms(projectData);
		return _.filter(this.$platformsData.platformsNames, p => {
			return installedPlatforms.indexOf(p) < 0 && this.isPlatformSupportedForOS(p, projectData); // Only those not already installed
		});
	}

	public getPreparedPlatforms(projectData: IProjectData): string[] {
		return _.filter(this.$platformsData.platformsNames, p => { return this.isPlatformPrepared(p, projectData); });
	}
	public async preparePlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, filesToSync?: Array<String>, nativePrepare?: INativePrepare): Promise<boolean> {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const changesInfo = await this.initialPrepare(platform, platformData, appFilesUpdaterOptions, platformTemplate, projectData, config, nativePrepare);
		const requiresNativePrepare = (!nativePrepare || !nativePrepare.skipNativePrepare) && changesInfo.nativePlatformStatus === constants.NativePlatformStatus.requiresPrepare;

		if (changesInfo.hasChanges || appFilesUpdaterOptions.bundle || requiresNativePrepare) {
			await this.preparePlatformCore(platform, appFilesUpdaterOptions, projectData, config, changesInfo, filesToSync, nativePrepare);
			this.$projectChangesService.savePrepareInfo(platform, projectData);
		} else {
			this.$logger.out("Skipping prepare.");
		}

		return true;
	}

	public async validateOptions(provision: true | string, teamId: true | string, projectData: IProjectData, platform?: string): Promise<boolean> {
		if (platform) {
			platform = this.$mobileHelper.normalizePlatformName(platform);
			this.$logger.trace("Validate options for platform: " + platform);
			const platformData = this.$platformsData.getPlatformData(platform, projectData);
			return await platformData.platformProjectService.validateOptions(projectData.projectId, provision, teamId);
		} else {
			let valid = true;
			for (const availablePlatform in this.$platformsData.availablePlatforms) {
				this.$logger.trace("Validate options for platform: " + availablePlatform);
				const platformData = this.$platformsData.getPlatformData(availablePlatform, projectData);
				valid = valid && await platformData.platformProjectService.validateOptions(projectData.projectId, provision, teamId);
			}

			return valid;
		}
	}

	private async cleanProject(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformData: IPlatformData, projectData: IProjectData): Promise<void> {
		// android build artifacts need to be cleaned up
		// when switching between debug, release and webpack builds
		if (platform.toLowerCase() !== "android") {
			return;
		}

		const previousPrepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		if (!previousPrepareInfo) {
			return;
		}

		const { release: previousWasRelease, bundle: previousWasBundle } = previousPrepareInfo;
		const { release: currentIsRelease, bundle: currentIsBundle } = appFilesUpdaterOptions;
		if ((previousWasRelease !== currentIsRelease) || (previousWasBundle !== currentIsBundle)) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}
	}

	private async initialPrepare(platform: string, platformData: IPlatformData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, nativePrepare?: INativePrepare): Promise<IProjectChangesInfo> {
		this.validatePlatform(platform, projectData);

		await this.trackProjectType(projectData);

		//We need dev-dependencies here, so before-prepare hooks will be executed correctly.
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
		}

		await this.ensurePlatformInstalled(platform, platformTemplate, projectData, config, nativePrepare);

		const bundle = appFilesUpdaterOptions.bundle;
		const nativePlatformStatus = (nativePrepare && nativePrepare.skipNativePrepare) ? constants.NativePlatformStatus.requiresPlatformAdd : constants.NativePlatformStatus.requiresPrepare;
		const changesInfo = await this.$projectChangesService.checkForChanges(platform, projectData, { bundle, release: appFilesUpdaterOptions.release, provision: config.provision, teamId: config.teamId, nativePlatformStatus });

		this.$logger.trace("Changes info in prepare platform:", changesInfo);
		return changesInfo;
	}

	/* Hooks are expected to use "filesToSync" parameter, as to give plugin authors additional information about the sync process.*/
	@helpers.hook('prepare')
	private async preparePlatformCore(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, changesInfo?: IProjectChangesInfo, filesToSync?: Array<String>, nativePrepare?: INativePrepare): Promise<void> {
		this.$logger.out("Preparing project...");

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: appFilesUpdaterOptions.release });
		await this.preparePlatformCoreJS(platform, platformData, appFilesUpdaterOptions, projectData, platformSpecificData, changesInfo, filesToSync, projectFilesConfig);

		if (!nativePrepare || !nativePrepare.skipNativePrepare) {
			await this.preparePlatformCoreNative(platform, platformData, appFilesUpdaterOptions, projectData, platformSpecificData, changesInfo, projectFilesConfig);
		}

		const directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
		if (!changesInfo || !changesInfo.modulesChanged) {
			excludedDirs.push(constants.TNS_MODULES_FOLDER_NAME);
		}

		this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, projectFilesConfig, excludedDirs);

		this.$logger.out(`Project successfully prepared (${platform})`);
	}

	private async preparePlatformCoreJS(platform: string, platformData: IPlatformData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, changesInfo?: IProjectChangesInfo, filesToSync?: Array<String>, projectFilesConfig?: IProjectFilesConfig): Promise<void> {
		if (!changesInfo || changesInfo.appFilesChanged) {
			await this.copyAppFiles(platformData, appFilesUpdaterOptions, projectData);

			// remove the App_Resources folder from the app/assets as here we're applying other files changes.
			const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			const appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath)) {
				this.$fs.deleteDirectory(appResourcesDirectoryPath);
			}
		}

		if (!changesInfo || changesInfo.modulesChanged) {
			await this.copyTnsModules(platform, platformData, projectData, projectFilesConfig);
		}
	}

	public async preparePlatformCoreNative(platform: string, platformData: IPlatformData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, changesInfo?: IProjectChangesInfo, projectFilesConfig?: IProjectFilesConfig): Promise<void> {
		if (changesInfo.hasChanges) {
			await this.cleanProject(platform, appFilesUpdaterOptions, platformData, projectData);
		}

		if (!changesInfo || changesInfo.changesRequirePrepare) {
			await this.copyAppFiles(platformData, appFilesUpdaterOptions, projectData);
			this.copyAppResources(platformData, projectData);
			await platformData.platformProjectService.prepareProject(projectData, platformSpecificData);
		}

		if (!changesInfo || changesInfo.modulesChanged || appFilesUpdaterOptions.bundle) {
			await this.$pluginsService.validate(platformData, projectData);

			const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

			const tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime, projectData, projectFilesConfig);
		}

		if (!changesInfo || changesInfo.configChanged || changesInfo.modulesChanged) {
			await platformData.platformProjectService.processConfigurationFilesFromAppResources(appFilesUpdaterOptions.release, projectData);
		}

		platformData.platformProjectService.interpolateConfigurationFile(projectData, platformSpecificData);
		this.$projectChangesService.setNativePlatformStatus(platform, projectData,
			{ nativePlatformStatus: constants.NativePlatformStatus.alreadyPrepared });
	}

	private async copyAppFiles(platformData: IPlatformData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData): Promise<void> {
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

		// Copy app folder to native project
		this.$fs.ensureDirectoryExists(appDestinationDirectoryPath);
		const appSourceDirectoryPath = path.join(projectData.projectDir, constants.APP_FOLDER_NAME);

		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, appFilesUpdaterOptions, this.$fs);
		appUpdater.updateApp(sourceFiles => {
			this.$xmlValidator.validateXmlFiles(sourceFiles);
		});
	}

	private copyAppResources(platformData: IPlatformData, projectData: IProjectData): void {
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
		if (this.$fs.exists(appResourcesDirectoryPath)) {
			platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath, projectData);
			const appResourcesDestination = platformData.platformProjectService.getAppResourcesDestinationDirectoryPath(projectData);
			this.$fs.ensureDirectoryExists(appResourcesDestination);
			shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);
			this.$fs.deleteDirectory(appResourcesDirectoryPath);
		}
	}

	private async copyTnsModules(platform: string, platformData: IPlatformData, projectData: IProjectData, projectFilesConfig?: IProjectFilesConfig): Promise<void> {
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

		try {
			const tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareJSNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime, projectData, projectFilesConfig);
		} catch (error) {
			this.$logger.debug(error);
			shell.rm("-rf", appDestinationDirectoryPath);
			this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
		}
	}

	public async shouldBuild(platform: string, projectData: IProjectData, buildConfig: IBuildConfig, outputPath?: string): Promise<boolean> {
		if (this.$projectChangesService.currentChanges.changesRequireBuild) {
			return true;
		}

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const forDevice = !buildConfig || buildConfig.buildForDevice;
		outputPath = outputPath || (forDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath || platformData.deviceBuildOutputPath);
		if (!this.$fs.exists(outputPath)) {
			return true;
		}

		const packageNames = platformData.getValidPackageNames({ isForDevice: forDevice });
		const packages = this.getApplicationPackages(outputPath, packageNames);
		if (packages.length === 0) {
			return true;
		}

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		const buildInfo = this.getBuildInfo(platform, platformData, buildConfig, outputPath);
		if (!prepareInfo || !buildInfo) {
			return true;
		}

		if (buildConfig.clean) {
			return true;
		}

		if (prepareInfo.time === buildInfo.prepareTime) {
			return false;
		}

		return prepareInfo.changesRequireBuildTime !== buildInfo.prepareTime;
	}

	public async trackProjectType(projectData: IProjectData): Promise<void> {
		// Track each project once per process.
		// In long living process, where we may work with multiple projects, we would like to track the information for each of them.
		if (projectData && (projectData.projectFilePath !== this._trackedProjectFilePath)) {
			this._trackedProjectFilePath = projectData.projectFilePath;

			await this.$analyticsService.track("Working with project type", projectData.projectType);
		}
	}

	public async trackActionForPlatform(actionData: ITrackPlatformAction): Promise<void> {
		const normalizePlatformName = this.$mobileHelper.normalizePlatformName(actionData.platform);
		let featureValue = normalizePlatformName;
		if (actionData.isForDevice !== null) {
			const deviceType = actionData.isForDevice ? "device" : "emulator";
			featureValue += `.${deviceType}`;
		}

		await this.$analyticsService.track(actionData.action, featureValue);

		if (actionData.deviceOsVersion) {
			await this.$analyticsService.track(`Device OS version`, `${normalizePlatformName}_${actionData.deviceOsVersion}`);
		}
	}

	public async buildPlatform(platform: string, buildConfig: IBuildConfig, projectData: IProjectData): Promise<void> {
		this.$logger.out("Building project...");

		await this.trackProjectType(projectData);
		const isForDevice = this.$mobileHelper.isAndroidPlatform(platform) ? null : buildConfig && buildConfig.buildForDevice;
		await this.trackActionForPlatform({ action: "Build", platform, isForDevice });

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
			this.$logger.printInfoMessageOnSameLine(data.data.toString());
		};

		await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME, platformData.platformProjectService, handler, platformData.platformProjectService.buildProject(platformData.projectRoot, projectData, buildConfig));

		const buildInfoFilePath = this.getBuildOutputPath(platform, platformData, buildConfig);
		this.saveBuildInfoFile(platform, projectData.projectDir, buildInfoFilePath);

		this.$logger.out("Project successfully built.");
	}

	public saveBuildInfoFile(platform: string, projectDir: string, buildInfoFileDirname: string): void {
		const buildInfoFile = path.join(buildInfoFileDirname, buildInfoFileName);

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, this.$projectDataService.getProjectData(projectDir));
		const buildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};

		this.$fs.writeJson(buildInfoFile, buildInfo);
	}

	public async shouldInstall(device: Mobile.IDevice, projectData: IProjectData, outputPath?: string): Promise<boolean> {
		const platform = device.deviceInfo.platform;
		if (!(await device.applicationManager.isApplicationInstalled(projectData.projectId))) {
			return true;
		}

		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const deviceBuildInfo: IBuildInfo = await this.getDeviceBuildInfo(device, projectData);
		const localBuildInfo = this.getBuildInfo(platform, platformData, { buildForDevice: !device.isEmulator }, outputPath);
		return !localBuildInfo || !deviceBuildInfo || deviceBuildInfo.buildTime !== localBuildInfo.buildTime;
	}

	public async installApplication(device: Mobile.IDevice, buildConfig: IBuildConfig, projectData: IProjectData, packageFile?: string, outputFilePath?: string): Promise<void> {
		this.$logger.out("Installing...");
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		if (!packageFile) {
			if (this.$devicesService.isiOSSimulator(device)) {
				packageFile = this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputFilePath).packageName;
			} else {
				packageFile = this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputFilePath).packageName;
			}
		}

		await platformData.platformProjectService.cleanDeviceTempFolder(device.deviceInfo.identifier, projectData);

		await device.applicationManager.reinstallApplication(projectData.projectId, packageFile);

		if (!buildConfig.release) {
			const deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
			const buildInfoFilePath = outputFilePath || this.getBuildOutputPath(device.deviceInfo.platform, platformData, { buildForDevice: !device.isEmulator });
			const appIdentifier = projectData.projectId;

			await device.fileSystem.putFile(path.join(buildInfoFilePath, buildInfoFileName), deviceFilePath, appIdentifier);
		}

		this.$logger.out(`Successfully installed on device with identifier '${device.deviceInfo.identifier}'.`);
	}

	public async deployPlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, deployOptions: IDeployPlatformOptions, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		await this.preparePlatform(platform, appFilesUpdaterOptions, deployOptions.platformTemplate, projectData, config);
		const options: Mobile.IDevicesServicesInitializationOptions = {
			platform: platform, deviceId: deployOptions.device, emulator: deployOptions.emulator
		};
		await this.$devicesService.initialize(options);
		const action = async (device: Mobile.IDevice): Promise<void> => {
			const buildConfig: IBuildConfig = {
				buildForDevice: !this.$devicesService.isiOSSimulator(device),
				projectDir: deployOptions.projectDir,
				release: deployOptions.release,
				device: deployOptions.device,
				provision: deployOptions.provision,
				teamId: deployOptions.teamId,
				keyStoreAlias: deployOptions.keyStoreAlias,
				keyStoreAliasPassword: deployOptions.keyStoreAliasPassword,
				keyStorePassword: deployOptions.keyStorePassword,
				keyStorePath: deployOptions.keyStorePath,
				clean: deployOptions.clean
			};
			const shouldBuild = await this.shouldBuild(platform, projectData, buildConfig);
			if (shouldBuild) {
				await this.buildPlatform(platform, buildConfig, projectData);
			} else {
				this.$logger.out("Skipping package build. No changes detected on the native side. This will be fast!");
			}

			if (deployOptions.forceInstall || shouldBuild || (await this.shouldInstall(device, projectData))) {
				await this.installApplication(device, buildConfig, projectData);
			} else {
				this.$logger.out("Skipping install.");
			}

			await this.trackActionForPlatform({ action: "Deploy", platform: device.deviceInfo.platform, isForDevice: !device.isEmulator, deviceOsVersion: device.deviceInfo.version });
		};

		await this.$devicesService.execute(action, this.getCanExecuteAction(platform, deployOptions));
	}

	public async startApplication(platform: string, runOptions: IRunPlatformOptions, projectId: string): Promise<void> {
		this.$logger.out("Starting...");

		const action = async (device: Mobile.IDevice) => {
			await device.applicationManager.startApplication(projectId);
			this.$logger.out(`Successfully started on device with identifier '${device.deviceInfo.identifier}'.`);
		};

		await this.$devicesService.initialize({ platform: platform, deviceId: runOptions.device });
		await this.$devicesService.execute(action, this.getCanExecuteAction(platform, runOptions));
	}

	private getBuildOutputPath(platform: string, platformData: IPlatformData, options: IBuildForDevice): string {
		if (platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
			return options.buildForDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath;
		}

		return platformData.deviceBuildOutputPath;
	}

	private async getDeviceBuildInfoFilePath(device: Mobile.IDevice, projectData: IProjectData): Promise<string> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(device, {
			appIdentifier: projectData.projectId,
			getDirname: true
		});
		return helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, buildInfoFileName));
	}

	private async getDeviceBuildInfo(device: Mobile.IDevice, projectData: IProjectData): Promise<IBuildInfo> {
		const deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
		try {
			return JSON.parse(await this.readFile(device, deviceFilePath, projectData));
		} catch (e) {
			return null;
		}
	}

	private getBuildInfo(platform: string, platformData: IPlatformData, options: IBuildForDevice, buildOutputPath?: string): IBuildInfo {
		buildOutputPath = buildOutputPath || this.getBuildOutputPath(platform, platformData, options);
		const buildInfoFile = path.join(buildOutputPath, buildInfoFileName);
		if (this.$fs.exists(buildInfoFile)) {
			try {
				const buildInfoTime = this.$fs.readJson(buildInfoFile);
				return buildInfoTime;
			} catch (e) {
				return null;
			}
		}

		return null;
	}

	public async cleanDestinationApp(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		await this.ensurePlatformInstalled(platform, platformTemplate, projectData, config);

		const appSourceDirectoryPath = path.join(projectData.projectDir, constants.APP_FOLDER_NAME);
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, appFilesUpdaterOptions, this.$fs);
		appUpdater.cleanDestinationApp();
	}

	public lastOutputPath(platform: string, buildConfig: IBuildConfig, projectData: IProjectData, outputPath?: string): string {
		let packageFile: string;
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		if (buildConfig.buildForDevice) {
			packageFile = this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputPath).packageName;
		} else {
			packageFile = this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputPath).packageName;
		}
		if (!packageFile || !this.$fs.exists(packageFile)) {
			this.$errors.failWithoutHelp("Unable to find built application. Try 'tns build %s'.", platform);
		}
		return packageFile;
	}

	public copyLastOutput(platform: string, targetPath: string, buildConfig: IBuildConfig, projectData: IProjectData): void {
		platform = platform.toLowerCase();
		targetPath = path.resolve(targetPath);

		const packageFile = this.lastOutputPath(platform, buildConfig, projectData);

		this.$fs.ensureDirectoryExists(path.dirname(targetPath));

		if (this.$fs.exists(targetPath) && this.$fs.getFsStats(targetPath).isDirectory()) {
			const sourceFileName = path.basename(packageFile);
			this.$logger.trace(`Specified target path: '${targetPath}' is directory. Same filename will be used: '${sourceFileName}'.`);
			targetPath = path.join(targetPath, sourceFileName);
		}
		this.$fs.copyFile(packageFile, targetPath);
		this.$logger.info(`Copied file '${packageFile}' to '${targetPath}'.`);
	}

	public async removePlatforms(platforms: string[], projectData: IProjectData): Promise<void> {
		for (const platform of platforms) {
			this.validatePlatformInstalled(platform, projectData);
			const platformData = this.$platformsData.getPlatformData(platform, projectData);

			await platformData.platformProjectService.stopServices(platformData.projectRoot);

			const platformDir = path.join(projectData.platformsDir, platform);
			this.$fs.deleteDirectory(platformDir);
			this.$projectDataService.removeNSProperty(projectData.projectDir, platformData.frameworkPackageName);

			this.$logger.out(`Platform ${platform} successfully removed.`);
		}
	}

	public async updatePlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		for (const platformParam of platforms) {
			const data = platformParam.split("@"),
				platform = data[0],
				version = data[1];

			if (this.isPlatformInstalled(platform, projectData)) {
				await this.updatePlatform(platform, version, platformTemplate, projectData, config);
			} else {
				await this.addPlatform(platformParam, platformTemplate, projectData, config);
			}
		}
	}

	private getCanExecuteAction(platform: string, options: IDeviceEmulator): any {
		const canExecute = (currentDevice: Mobile.IDevice): boolean => {
			if (options.device && currentDevice && currentDevice.deviceInfo) {
				const device = this.$devicesService.getDeviceByDeviceOption();
				if (device && device.deviceInfo) {
					return currentDevice.deviceInfo.identifier === device.deviceInfo.identifier;
				}
			}

			if (this.$mobileHelper.isiOSPlatform(platform) && this.$hostInfo.isDarwin) {
				if (this.$devicesService.isOnlyiOSSimultorRunning() || options.emulator || this.$devicesService.isiOSSimulator(currentDevice)) {
					return true;
				}

				return this.$devicesService.isiOSDevice(currentDevice);
			}

			return true;
		};

		return canExecute;
	}

	public validatePlatform(platform: string, projectData: IProjectData): void {
		if (!platform) {
			this.$errors.fail("No platform specified.");
		}

		platform = platform.split("@")[0].toLowerCase();

		if (!this.isValidPlatform(platform, projectData)) {
			this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(this.$platformsData.platformsNames));
		}
	}

	public validatePlatformInstalled(platform: string, projectData: IProjectData): void {
		this.validatePlatform(platform, projectData);

		if (!this.isPlatformInstalled(platform, projectData)) {
			this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
		}
	}

	public async ensurePlatformInstalled(platform: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, nativePrepare?: INativePrepare): Promise<void> {
		let requiresNativePlatformAdd = false;

		if (!this.isPlatformInstalled(platform, projectData)) {
			await this.addPlatform(platform, platformTemplate, projectData, config, "", nativePrepare);
		} else {
			const shouldAddNativePlatform = !nativePrepare || !nativePrepare.skipNativePrepare;
			const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
			// In case there's no prepare info, it means only platform add had been executed. So we've come from CLI and we do not need to prepare natively.
			requiresNativePlatformAdd = prepareInfo && prepareInfo.nativePlatformStatus === constants.NativePlatformStatus.requiresPlatformAdd;
			if (requiresNativePlatformAdd && shouldAddNativePlatform) {
				await this.addPlatform(platform, platformTemplate, projectData, config, "", nativePrepare);
			}
		}
	}

	private isPlatformInstalled(platform: string, projectData: IProjectData): boolean {
		return this.$fs.exists(path.join(projectData.platformsDir, platform.toLowerCase()));
	}

	private isValidPlatform(platform: string, projectData: IProjectData) {
		return this.$platformsData.getPlatformData(platform, projectData);
	}

	public isPlatformSupportedForOS(platform: string, projectData: IProjectData): boolean {
		const targetedOS = this.$platformsData.getPlatformData(platform, projectData).targetedOS;
		const res = !targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0;
		return res;
	}

	private isPlatformPrepared(platform: string, projectData: IProjectData): boolean {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		return platformData.platformProjectService.isPlatformPrepared(platformData.projectRoot, projectData);
	}

	private getApplicationPackages(buildOutputPath: string, validPackageNames: string[]): IApplicationPackage[] {
		// Get latest package` that is produced from build
		const candidates = this.$fs.readDirectory(buildOutputPath);
		const packages = _.filter(candidates, candidate => {
			return _.includes(validPackageNames, candidate);
		}).map(currentPackage => {
			currentPackage = path.join(buildOutputPath, currentPackage);

			return {
				packageName: currentPackage,
				time: this.$fs.getFsStats(currentPackage).mtime
			};
		});

		return packages;
	}

	private getLatestApplicationPackage(buildOutputPath: string, validPackageNames: string[]): IApplicationPackage {
		let packages = this.getApplicationPackages(buildOutputPath, validPackageNames);
		if (packages.length === 0) {
			const packageExtName = path.extname(validPackageNames[0]);
			this.$errors.fail("No %s found in %s directory", packageExtName, buildOutputPath);
		}

		packages = _.sortBy(packages, pkg => pkg.time).reverse(); // We need to reverse because sortBy always sorts in ascending order

		return packages[0];
	}

	public getLatestApplicationPackageForDevice(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage {
		return this.getLatestApplicationPackage(outputPath || platformData.deviceBuildOutputPath, platformData.getValidPackageNames({ isForDevice: true, isReleaseBuild: buildConfig.release }));
	}

	public getLatestApplicationPackageForEmulator(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage {
		return this.getLatestApplicationPackage(outputPath || platformData.emulatorBuildOutputPath || platformData.deviceBuildOutputPath, platformData.getValidPackageNames({ isForDevice: false, isReleaseBuild: buildConfig.release }));
	}

	private async updatePlatform(platform: string, version: string, platformTemplate: string, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		const data = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		const currentVersion = data && data.version ? data.version : "0.2.0";

		let newVersion = version === constants.PackageVersion.NEXT ?
			await this.$npmInstallationManager.getNextVersion(platformData.frameworkPackageName) :
			version || await this.$npmInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
		const installedModuleDir = await this.$npmInstallationManager.install(platformData.frameworkPackageName, projectData.projectDir, { version: newVersion, dependencyType: "save" });
		const cachedPackageData = this.$fs.readJson(path.join(installedModuleDir, "package.json"));
		newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;

		const canUpdate = platformData.platformProjectService.canUpdatePlatform(installedModuleDir, projectData);
		await this.$npm.uninstall(platformData.frameworkPackageName, { save: true }, projectData.projectDir);
		if (canUpdate) {
			if (!semver.valid(newVersion)) {
				this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
			}

			if (!semver.gt(currentVersion, newVersion)) {
				await this.updatePlatformCore(platformData, { currentVersion, newVersion, canUpdate, platformTemplate }, projectData, config);
			} else if (semver.eq(currentVersion, newVersion)) {
				this.$errors.fail("Current and new version are the same.");
			} else {
				this.$errors.fail(`Your current version: ${currentVersion} is higher than the one you're trying to install ${newVersion}.`);
			}
		} else {
			this.$errors.failWithoutHelp("Native Platform cannot be updated.");
		}

	}

	private async updatePlatformCore(platformData: IPlatformData, updateOptions: IUpdatePlatformOptions, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		let packageName = platformData.normalizedPlatformName.toLowerCase();
		await this.removePlatforms([packageName], projectData);
		packageName = updateOptions.newVersion ? `${packageName}@${updateOptions.newVersion}` : packageName;
		await this.addPlatform(packageName, updateOptions.platformTemplate, projectData, config);
		this.$logger.out("Successfully updated to version ", updateOptions.newVersion);
	}

	// TODO: Remove this method from here. It has nothing to do with platform
	public async readFile(device: Mobile.IDevice, deviceFilePath: string, projectData: IProjectData): Promise<string> {
		temp.track();
		const uniqueFilePath = temp.path({ suffix: ".tmp" });
		try {
			await device.fileSystem.getFile(deviceFilePath, projectData.projectId, uniqueFilePath);
		} catch (e) {
			return null;
		}

		if (this.$fs.exists(uniqueFilePath)) {
			const text = this.$fs.readText(uniqueFilePath);
			shell.rm(uniqueFilePath);
			return text;
		}

		return null;
	}
}

$injector.register("platformService", PlatformService);
