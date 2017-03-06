import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import { EventEmitter } from "events";
import { AppFilesUpdater } from "./app-files-updater";
import * as temp from "temp";
temp.track();
let clui = require("clui");

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
		private $xmlValidator: IXmlValidator,
		private $npm: INodePackageManager,
		private $sysInfo: ISysInfo,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		private $projectChangesService: IProjectChangesService,
		private $emulatorPlatformService: IEmulatorPlatformService,
		private $analyticsService: IAnalyticsService) {
		super();
	}

	public async addPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData): Promise<void> {
		let platformsDir = projectData.platformsDir;
		this.$fs.ensureDirectoryExists(platformsDir);

		for (let platform of platforms) {
			await this.addPlatform(platform.toLowerCase(), platformTemplate, projectData);
		}
	}

	private async addPlatform(platformParam: string, platformTemplate: string, projectData: IProjectData, frameworkPath?: string): Promise<void> {
		let data = platformParam.split("@"),
			platform = data[0].toLowerCase(),
			version = data[1];

		this.validatePlatform(platform, projectData);

		let platformPath = path.join(projectData.platformsDir, platform);

		if (this.$fs.exists(platformPath)) {
			this.$errors.failWithoutHelp("Platform %s already added", platform);
		}

		let platformData = this.$platformsData.getPlatformData(platform, projectData);

		// Copy platform specific files in platforms dir
		let platformProjectService = platformData.platformProjectService;
		await platformProjectService.validate(projectData);

		// Log the values for project
		this.$logger.trace("Creating NativeScript project for the %s platform", platform);
		this.$logger.trace("Path: %s", platformData.projectRoot);
		this.$logger.trace("Package: %s", projectData.projectId);
		this.$logger.trace("Name: %s", projectData.projectName);

		this.$logger.out("Copying template files...");

		let packageToInstall = "";
		let npmOptions: IStringDictionary = {
			pathToSave: path.join(projectData.platformsDir, platform),
			dependencyType: "save"
		};

		if (!frameworkPath) {
			packageToInstall = platformData.frameworkPackageName;
			npmOptions["version"] = version;
		}

		let spinner = new clui.Spinner("Installing " + packageToInstall);
		let projectDir = projectData.projectDir;
		try {
			spinner.start();
			let downloadedPackagePath = await this.$npmInstallationManager.install(packageToInstall, projectDir, npmOptions);
			let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
			frameworkDir = path.resolve(frameworkDir);

			let coreModuleName = await this.addPlatformCore(platformData, frameworkDir, platformTemplate, projectData);
			await this.$npm.uninstall(coreModuleName, { save: true }, projectData.projectDir);
		} catch (err) {
			this.$fs.deleteDirectory(platformPath);
			throw err;
		} finally {
			spinner.stop();
		}

		this.$logger.out("Project successfully created.");

	}

	private async addPlatformCore(platformData: IPlatformData, frameworkDir: string, platformTemplate: string, projectData: IProjectData): Promise<string> {
		let coreModuleData = this.$fs.readJson(path.join(frameworkDir, "../", "package.json"));
		let installedVersion = coreModuleData.version;
		let coreModuleName = coreModuleData.name;

		let customTemplateOptions = await this.getPathToPlatformTemplate(platformTemplate, platformData.frameworkPackageName, projectData.projectDir);
		let pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;
		await platformData.platformProjectService.createProject(path.resolve(frameworkDir), installedVersion, projectData, pathToTemplate);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await platformData.platformProjectService.interpolateData(projectData);
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);

		let frameworkPackageNameData: any = { version: installedVersion };
		if (customTemplateOptions) {
			frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
		}

		this.$projectDataService.setNSValue(projectData.projectDir, platformData.frameworkPackageName, frameworkPackageNameData);

		return coreModuleName;

	}

	private async getPathToPlatformTemplate(selectedTemplate: string, frameworkPackageName: string, projectDir: string): Promise<{ selectedTemplate: string, pathToTemplate: string }> {
		if (!selectedTemplate) {
			// read data from package.json's nativescript key
			// check the nativescript.tns-<platform>.template value
			const nativescriptPlatformData = this.$projectDataService.getNSValue(projectDir, frameworkPackageName);
			selectedTemplate = nativescriptPlatformData && nativescriptPlatformData.template;
		}

		if (selectedTemplate) {
			let tempDir = temp.mkdirSync("platform-template");
			try {
				/*
				 * Output of npm.install is array of arrays. For example:
				 * [ [ 'test-android-platform-template@0.0.1',
				 *	'C:\\Users\\<USER>~1\\AppData\\Local\\Temp\\1\\platform-template11627-15560-rm3ngx\\node_modules\\test-android-platform-template',
				 *	undefined,
				 *	undefined,
				 *	'..\\..\\..\\android-platform-template' ] ]
				 * Project successfully created.
				 */
				let pathToTemplate = (await this.$npm.install(selectedTemplate, tempDir))[0];
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

		let subDirs = this.$fs.readDirectory(projectData.platformsDir);
		return _.filter(subDirs, p => this.$platformsData.platformsNames.indexOf(p) > -1);
	}

	public getAvailablePlatforms(projectData: IProjectData): string[] {
		let installedPlatforms = this.getInstalledPlatforms(projectData);
		return _.filter(this.$platformsData.platformsNames, p => {
			return installedPlatforms.indexOf(p) < 0 && this.isPlatformSupportedForOS(p, projectData); // Only those not already installed
		});
	}

	public getPreparedPlatforms(projectData: IProjectData): string[] {
		return _.filter(this.$platformsData.platformsNames, p => { return this.isPlatformPrepared(p, projectData); });
	}

	public async preparePlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string, projectData: IProjectData, provision: any): Promise<boolean> {
		this.validatePlatform(platform, projectData);

		await this.trackProjectType(projectData);

		//We need dev-dependencies here, so before-prepare hooks will be executed correctly.
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
		}

		// Need to check if any plugin requires Cocoapods to be installed.
		if (platform === "ios") {
			for (let pluginData of await this.$pluginsService.getAllInstalledPlugins(projectData)) {
				if (this.$fs.exists(path.join(pluginData.pluginPlatformsFolderPath(platform), "Podfile")) &&
					!(await this.$sysInfo.getCocoapodVersion())) {
					this.$errors.failWithoutHelp(`${pluginData.name} has Podfile and you don't have Cocoapods installed or it is not configured correctly. Please verify Cocoapods can work on your machine.`);
				}
			}
		}

		await this.ensurePlatformInstalled(platform, platformTemplate, projectData);
		let changesInfo = this.$projectChangesService.checkForChanges(platform, projectData);

		this.$logger.trace("Changes info in prepare platform:", changesInfo);

		if (changesInfo.hasChanges) {
			// android build artifacts need to be cleaned up when switching from release to debug builds
			if (platform.toLowerCase() === "android") {
				let previousPrepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
				// clean up prepared plugins when not building for release
				if (previousPrepareInfo && previousPrepareInfo.release !== appFilesUpdaterOptions.release) {
					let platformData = this.$platformsData.getPlatformData(platform, projectData);
					await platformData.platformProjectService.cleanProject(platformData.projectRoot, [], projectData);
				}
			}

			await this.preparePlatformCore(platform, appFilesUpdaterOptions, projectData, provision);
			this.$projectChangesService.savePrepareInfo(platform, projectData);
		} else {
			this.$logger.out("Skipping prepare.");
		}

		return true;
	}

	public async validateOptions(provision: any, projectData: IProjectData, platform?: string): Promise<boolean> {
		if (platform) {
			platform = this.$mobileHelper.normalizePlatformName(platform);
			this.$logger.trace("Validate options for platform: " + platform);
			let platformData = this.$platformsData.getPlatformData(platform, projectData);
			return await platformData.platformProjectService.validateOptions(provision);
		} else {
			let valid = true;
			for (let availablePlatform in this.$platformsData.availablePlatforms) {
				this.$logger.trace("Validate options for platform: " + availablePlatform);
				let platformData = this.$platformsData.getPlatformData(availablePlatform, projectData);
				valid = valid && await platformData.platformProjectService.validateOptions(provision);
			}

			return valid;
		}
	}

	@helpers.hook('prepare')
	private async preparePlatformCore(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData, provision: any, changesInfo?: IProjectChangesInfo): Promise<void> {
		this.$logger.out("Preparing project...");

		let platformData = this.$platformsData.getPlatformData(platform, projectData);

		if (!changesInfo || changesInfo.appFilesChanged) {
			await this.copyAppFiles(platform, appFilesUpdaterOptions, projectData);
		}
		if (!changesInfo || changesInfo.appResourcesChanged) {
			this.copyAppResources(platform, projectData);
			await platformData.platformProjectService.prepareProject(projectData, provision);
		}
		if (!changesInfo || changesInfo.modulesChanged) {
			await this.copyTnsModules(platform, projectData);
		}

		let directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		let excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
		if (!changesInfo || !changesInfo.modulesChanged) {
			excludedDirs.push(constants.TNS_MODULES_FOLDER_NAME);
		}

		this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, excludedDirs);

		if (!changesInfo || changesInfo.configChanged || changesInfo.modulesChanged) {
			await platformData.platformProjectService.processConfigurationFilesFromAppResources(appFilesUpdaterOptions.release, projectData);
		}

		await platformData.platformProjectService.interpolateConfigurationFile(projectData);

		this.$logger.out("Project successfully prepared (" + platform + ")");
	}

	private async copyAppFiles(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

		// Copy app folder to native project
		this.$fs.ensureDirectoryExists(appDestinationDirectoryPath);
		let appSourceDirectoryPath = path.join(projectData.projectDir, constants.APP_FOLDER_NAME);

		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, appFilesUpdaterOptions, this.$fs);
		appUpdater.updateApp(sourceFiles => {
			this.$xmlValidator.validateXmlFiles(sourceFiles);
		});
	}

	private copyAppResources(platform: string, projectData: IProjectData): void {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		let appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
		if (this.$fs.exists(appResourcesDirectoryPath)) {
			platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath, projectData);
			let appResourcesDestination = platformData.platformProjectService.getAppResourcesDestinationDirectoryPath(projectData);
			this.$fs.ensureDirectoryExists(appResourcesDestination);
			shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);
			this.$fs.deleteDirectory(appResourcesDirectoryPath);
		}
	}

	private async copyTnsModules(platform: string, projectData: IProjectData): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		let lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

		try {
			let tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime, projectData);
		} catch (error) {
			this.$logger.debug(error);
			shell.rm("-rf", appDestinationDirectoryPath);
			this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
		}
	}

	public async shouldBuild(platform: string, projectData: IProjectData, buildConfig: IBuildConfig): Promise<boolean> {
		if (this.$projectChangesService.currentChanges.changesRequireBuild) {
			return true;
		}
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		let forDevice = !buildConfig || buildConfig.buildForDevice;
		let outputPath = forDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath;
		if (!this.$fs.exists(outputPath)) {
			return true;
		}
		let packageNames = forDevice ? platformData.validPackageNamesForDevice : platformData.validPackageNamesForEmulator;
		let packages = this.getApplicationPackages(outputPath, packageNames);
		if (packages.length === 0) {
			return true;
		}
		let prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		let buildInfo = this.getBuildInfo(platform, platformData, buildConfig);
		if (!prepareInfo || !buildInfo) {
			return true;
		}
		if (buildConfig.clean) {
			return prepareInfo.time !== buildInfo.prepareTime;
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

	public async buildPlatform(platform: string, buildConfig: IBuildConfig, projectData: IProjectData): Promise<void> {
		this.$logger.out("Building project...");

		await this.trackProjectType(projectData);

		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		platformData.platformProjectService.on(constants.BUILD_OUTPUT_EVENT_NAME, (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
		});
		await platformData.platformProjectService.buildProject(platformData.projectRoot, projectData, buildConfig);
		let prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		let buildInfoFilePath = this.getBuildOutputPath(platform, platformData, buildConfig);
		let buildInfoFile = path.join(buildInfoFilePath, buildInfoFileName);
		let buildInfo: IBuildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};
		this.$fs.writeJson(buildInfoFile, buildInfo);
		this.$logger.out("Project successfully built.");
	}

	public async shouldInstall(device: Mobile.IDevice, projectData: IProjectData): Promise<boolean> {
		let platform = device.deviceInfo.platform;
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		if (!(await device.applicationManager.isApplicationInstalled(projectData.projectId))) {
			return true;
		}
		let deviceBuildInfo: IBuildInfo = await this.getDeviceBuildInfo(device, projectData);
		let localBuildInfo = this.getBuildInfo(platform, platformData, { buildForDevice: !device.isEmulator });
		return !localBuildInfo || !deviceBuildInfo || deviceBuildInfo.buildTime !== localBuildInfo.buildTime;
	}

	public async installApplication(device: Mobile.IDevice, options: IRelease, projectData: IProjectData): Promise<void> {
		this.$logger.out("Installing...");
		let platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		let packageFile = "";
		if (this.$devicesService.isiOSSimulator(device)) {
			packageFile = this.getLatestApplicationPackageForEmulator(platformData).packageName;
		} else {
			packageFile = this.getLatestApplicationPackageForDevice(platformData).packageName;
		}

		await platformData.platformProjectService.deploy(device.deviceInfo.identifier, projectData);

		await device.applicationManager.reinstallApplication(projectData.projectId, packageFile);

		if (!options.release) {
			let deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
			let buildInfoFilePath = this.getBuildOutputPath(device.deviceInfo.platform, platformData, { buildForDevice: !device.isEmulator });
			let appIdentifier = projectData.projectId;

			await device.fileSystem.putFile(path.join(buildInfoFilePath, buildInfoFileName), deviceFilePath, appIdentifier);
		}

		this.$logger.out(`Successfully installed on device with identifier '${device.deviceInfo.identifier}'.`);
	}

	public async deployPlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, deployOptions: IDeployPlatformOptions, projectData: IProjectData, provision: any): Promise<void> {
		await this.preparePlatform(platform, appFilesUpdaterOptions, deployOptions.platformTemplate, projectData, provision);
		this.$logger.out("Searching for devices...");
		await this.$devicesService.initialize({ platform: platform, deviceId: deployOptions.device });
		let action = async (device: Mobile.IDevice): Promise<void> => {
			let buildConfig: IiOSBuildConfig = {
				buildForDevice: !this.$devicesService.isiOSSimulator(device),
				projectDir: deployOptions.projectDir,
				release: deployOptions.release,
				device: deployOptions.device,
				provision: deployOptions.provision,
				teamId: deployOptions.teamId,
				keyStoreAlias: deployOptions.keyStoreAlias,
				keyStoreAliasPassword: deployOptions.keyStoreAliasPassword,
				keyStorePassword: deployOptions.keyStorePassword,
				keyStorePath: deployOptions.keyStorePath
			};
			let shouldBuild = await this.shouldBuild(platform, projectData, buildConfig);
			if (shouldBuild) {
				await this.buildPlatform(platform, buildConfig, projectData);
			} else {
				this.$logger.out("Skipping package build. No changes detected on the native side. This will be fast!");
			}

			if (deployOptions.forceInstall || shouldBuild || (await this.shouldInstall(device, projectData))) {
				await this.installApplication(device, deployOptions, projectData);
			} else {
				this.$logger.out("Skipping install.");
			}
		};

		await this.$devicesService.execute(action, this.getCanExecuteAction(platform, deployOptions));
	}

	public async runPlatform(platform: string, runOptions: IRunPlatformOptions, projectData: IProjectData): Promise<void> {
		await this.trackProjectType(projectData);

		this.$logger.out("Starting...");

		let action = async (device: Mobile.IDevice) => {
			await device.applicationManager.startApplication(projectData.projectId);
			this.$logger.out(`Successfully started on device with identifier '${device.deviceInfo.identifier}'.`);
		};

		await this.$devicesService.initialize({ platform: platform, deviceId: runOptions.device });
		await this.$devicesService.execute(action, this.getCanExecuteAction(platform, runOptions));
	}

	public async emulatePlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, emulateOptions: IEmulatePlatformOptions, projectData: IProjectData, provision: any): Promise<void> {
		if (emulateOptions.avd) {
			this.$logger.warn(`Option --avd is no longer supported. Please use --device instead!`);
			return Promise.resolve();
		}

		if (emulateOptions.availableDevices) {
			return this.$emulatorPlatformService.listAvailableEmulators(platform);
		}

		if (emulateOptions.device) {
			let info = await this.$emulatorPlatformService.getEmulatorInfo(platform, emulateOptions.device);
			if (info) {
				if (!info.isRunning) {
					await this.$emulatorPlatformService.startEmulator(info, projectData);
				}

				emulateOptions.device = null;
			} else {
				await this.$devicesService.initialize({ platform: platform, deviceId: emulateOptions.device });
				let found: Mobile.IDeviceInfo[] = [];
				if (this.$devicesService.hasDevices) {
					found = this.$devicesService.getDevices().filter((deviceInfo: Mobile.IDeviceInfo) => deviceInfo.identifier === emulateOptions.device);
				}

				if (found.length === 0) {
					this.$errors.fail("Cannot find device with name: %s", emulateOptions.device);
				}
			}
		}

		await this.deployPlatform(platform, appFilesUpdaterOptions, emulateOptions, projectData, provision);
		return this.runPlatform(platform, emulateOptions, projectData);
	}

	private getBuildOutputPath(platform: string, platformData: IPlatformData, options: IBuildForDevice): string {
		if (platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
			return options.buildForDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath;
		}

		return platformData.deviceBuildOutputPath;
	}

	private async getDeviceBuildInfoFilePath(device: Mobile.IDevice, projectData: IProjectData): Promise<string> {
		let deviceAppData = this.$deviceAppDataFactory.create(projectData.projectId, device.deviceInfo.platform, device);
		let deviceRootPath = path.dirname(await deviceAppData.getDeviceProjectRootPath());
		return helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, buildInfoFileName));
	}

	private async getDeviceBuildInfo(device: Mobile.IDevice, projectData: IProjectData): Promise<IBuildInfo> {
		let deviceFilePath = await this.getDeviceBuildInfoFilePath(device, projectData);
		try {
			return JSON.parse(await this.readFile(device, deviceFilePath, projectData));
		} catch (e) {
			return null;
		}
	}

	private getBuildInfo(platform: string, platformData: IPlatformData, options: IBuildForDevice): IBuildInfo {
		let buildInfoFilePath = this.getBuildOutputPath(platform, platformData, options);
		let buildInfoFile = path.join(buildInfoFilePath, buildInfoFileName);
		if (this.$fs.exists(buildInfoFile)) {
			try {
				let buildInfoTime = this.$fs.readJson(buildInfoFile);
				return buildInfoTime;
			} catch (e) {
				return null;
			}
		}

		return null;
	}

	public async cleanDestinationApp(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string, projectData: IProjectData): Promise<void> {
		await this.ensurePlatformInstalled(platform, platformTemplate, projectData);

		const appSourceDirectoryPath = path.join(projectData.projectDir, constants.APP_FOLDER_NAME);
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, appFilesUpdaterOptions, this.$fs);
		appUpdater.cleanDestinationApp();
	}

	public lastOutputPath(platform: string, settings: { isForDevice: boolean }, projectData: IProjectData): string {
		let packageFile: string;
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		if (settings.isForDevice) {
			packageFile = this.getLatestApplicationPackageForDevice(platformData).packageName;
		} else {
			packageFile = this.getLatestApplicationPackageForEmulator(platformData).packageName;
		}
		if (!packageFile || !this.$fs.exists(packageFile)) {
			this.$errors.failWithoutHelp("Unable to find built application. Try 'tns build %s'.", platform);
		}
		return packageFile;
	}

	public copyLastOutput(platform: string, targetPath: string, settings: { isForDevice: boolean }, projectData: IProjectData): void {
		platform = platform.toLowerCase();
		targetPath = path.resolve(targetPath);

		let packageFile = this.lastOutputPath(platform, settings, projectData);

		this.$fs.ensureDirectoryExists(path.dirname(targetPath));

		if (this.$fs.exists(targetPath) && this.$fs.getFsStats(targetPath).isDirectory()) {
			let sourceFileName = path.basename(packageFile);
			this.$logger.trace(`Specified target path: '${targetPath}' is directory. Same filename will be used: '${sourceFileName}'.`);
			targetPath = path.join(targetPath, sourceFileName);
		}
		this.$fs.copyFile(packageFile, targetPath);
		this.$logger.info(`Copied file '${packageFile}' to '${targetPath}'.`);
	}

	public async removePlatforms(platforms: string[], projectData: IProjectData): Promise<void> {
		for (let platform of platforms) {
			this.validatePlatformInstalled(platform, projectData);
			let platformData = this.$platformsData.getPlatformData(platform, projectData);

			await platformData.platformProjectService.stopServices(platformData.projectRoot);

			let platformDir = path.join(projectData.platformsDir, platform);
			this.$fs.deleteDirectory(platformDir);
			this.$projectDataService.removeNSProperty(projectData.projectDir, platformData.frameworkPackageName);

			this.$logger.out(`Platform ${platform} successfully removed.`);
		}
	}

	public async updatePlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData): Promise<void> {
		for (let platformParam of platforms) {
			let data = platformParam.split("@"),
				platform = data[0],
				version = data[1];

			if (this.isPlatformInstalled(platform, projectData)) {
				await this.updatePlatform(platform, version, platformTemplate, projectData);
			} else {
				await this.addPlatform(platformParam, platformTemplate, projectData);
			}
		};
	}

	private getCanExecuteAction(platform: string, options: IDeviceEmulator): any {
		let canExecute = (currentDevice: Mobile.IDevice): boolean => {
			if (options.device && currentDevice && currentDevice.deviceInfo) {
				let device = this.$devicesService.getDeviceByDeviceOption();
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

		if (!this.isPlatformSupportedForOS(platform, projectData)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", platform, process.platform);
		}
	}

	public validatePlatformInstalled(platform: string, projectData: IProjectData): void {
		this.validatePlatform(platform, projectData);

		if (!this.isPlatformInstalled(platform, projectData)) {
			this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
		}
	}

	public async ensurePlatformInstalled(platform: string, platformTemplate: string, projectData: IProjectData): Promise<void> {
		if (!this.isPlatformInstalled(platform, projectData)) {
			await this.addPlatform(platform, platformTemplate, projectData);
		}
	}

	private isPlatformInstalled(platform: string, projectData: IProjectData): boolean {
		return this.$fs.exists(path.join(projectData.platformsDir, platform.toLowerCase()));
	}

	private isValidPlatform(platform: string, projectData: IProjectData) {
		return this.$platformsData.getPlatformData(platform, projectData);
	}

	private isPlatformSupportedForOS(platform: string, projectData: IProjectData): boolean {
		let targetedOS = this.$platformsData.getPlatformData(platform, projectData).targetedOS;
		let res = !targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0;
		return res;
	}

	private isPlatformPrepared(platform: string, projectData: IProjectData): boolean {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);
		return platformData.platformProjectService.isPlatformPrepared(platformData.projectRoot, projectData);
	}

	private getApplicationPackages(buildOutputPath: string, validPackageNames: string[]): IApplicationPackage[] {
		// Get latest package` that is produced from build
		let candidates = this.$fs.readDirectory(buildOutputPath);
		let packages = _.filter(candidates, candidate => {
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
			let packageExtName = path.extname(validPackageNames[0]);
			this.$errors.fail("No %s found in %s directory", packageExtName, buildOutputPath);
		}

		packages = _.sortBy(packages, pkg => pkg.time).reverse(); // We need to reverse because sortBy always sorts in ascending order

		return packages[0];
	}

	public getLatestApplicationPackageForDevice(platformData: IPlatformData): IApplicationPackage {
		return this.getLatestApplicationPackage(platformData.deviceBuildOutputPath, platformData.validPackageNamesForDevice);
	}

	public getLatestApplicationPackageForEmulator(platformData: IPlatformData): IApplicationPackage {
		return this.getLatestApplicationPackage(platformData.emulatorBuildOutputPath || platformData.deviceBuildOutputPath, platformData.validPackageNamesForEmulator || platformData.validPackageNamesForDevice);
	}

	private async updatePlatform(platform: string, version: string, platformTemplate: string, projectData: IProjectData): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(platform, projectData);

		let data = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		let currentVersion = data && data.version ? data.version : "0.2.0";

		let newVersion = version === constants.PackageVersion.NEXT ?
			await this.$npmInstallationManager.getNextVersion(platformData.frameworkPackageName) :
			version || await this.$npmInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
		let installedModuleDir = await this.$npmInstallationManager.install(platformData.frameworkPackageName, projectData.projectDir, { version: newVersion, dependencyType: "save" });
		let cachedPackageData = this.$fs.readJson(path.join(installedModuleDir, "package.json"));
		newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;

		let canUpdate = platformData.platformProjectService.canUpdatePlatform(installedModuleDir, projectData);
		await this.$npm.uninstall(platformData.frameworkPackageName, { save: true }, projectData.projectDir);
		if (canUpdate) {
			if (!semver.valid(newVersion)) {
				this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
			}

			if (!semver.gt(currentVersion, newVersion)) {
				await this.updatePlatformCore(platformData, { currentVersion, newVersion, canUpdate, platformTemplate }, projectData);
			} else if (semver.eq(currentVersion, newVersion)) {
				this.$errors.fail("Current and new version are the same.");
			} else {
				this.$errors.fail(`Your current version: ${currentVersion} is higher than the one you're trying to install ${newVersion}.`);
			}
		} else {
			this.$errors.failWithoutHelp("Native Platform cannot be updated.");
		}

	}

	private async updatePlatformCore(platformData: IPlatformData, updateOptions: IUpdatePlatformOptions, projectData: IProjectData): Promise<void> {
		let packageName = platformData.normalizedPlatformName.toLowerCase();
		await this.removePlatforms([packageName], projectData);
		packageName = updateOptions.newVersion ? `${packageName}@${updateOptions.newVersion}` : packageName;
		await this.addPlatform(packageName, updateOptions.platformTemplate, projectData);
		this.$logger.out("Successfully updated to version ", updateOptions.newVersion);
	}

	public async readFile(device: Mobile.IDevice, deviceFilePath: string, projectData: IProjectData): Promise<string> {
		temp.track();
		let uniqueFilePath = temp.path({ suffix: ".tmp" });
		try {
			await device.fileSystem.getFile(deviceFilePath, projectData.projectId, uniqueFilePath);
		} catch (e) {
			return null;
		}

		if (this.$fs.exists(uniqueFilePath)) {
			let text = this.$fs.readText(uniqueFilePath);
			shell.rm(uniqueFilePath);
			return text;
		}

		return null;
	}
}

$injector.register("platformService", PlatformService);
