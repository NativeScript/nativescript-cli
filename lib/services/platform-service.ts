import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import { AppFilesUpdater } from "./app-files-updater";
import * as temp from "temp";
temp.track();
let clui = require("clui");

const buildInfoFileName = ".nsbuildinfo";

export class PlatformService implements IPlatformService {
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
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $hooksService: IHooksService,
		private $options: IOptions,
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
		private $analyticsService: IAnalyticsService) { }

	public async addPlatforms(platforms: string[]): Promise<void> {
		let platformsDir = this.$projectData.platformsDir;
		this.$fs.ensureDirectoryExists(platformsDir);

		for (let platform of platforms) {
			await this.addPlatform(platform.toLowerCase());
		}
	}

	private async addPlatform(platformParam: string): Promise<void> {
		let data = platformParam.split("@"),
			platform = data[0].toLowerCase(),
			version = data[1];

		this.validatePlatform(platform);

		let platformPath = path.join(this.$projectData.platformsDir, platform);

		if (this.$fs.exists(platformPath)) {
			this.$errors.failWithoutHelp("Platform %s already added", platform);
		}

		let platformData = this.$platformsData.getPlatformData(platform);

		// Copy platform specific files in platforms dir
		let platformProjectService = platformData.platformProjectService;
		await platformProjectService.validate();

		// Log the values for project
		this.$logger.trace("Creating NativeScript project for the %s platform", platform);
		this.$logger.trace("Path: %s", platformData.projectRoot);
		this.$logger.trace("Package: %s", this.$projectData.projectId);
		this.$logger.trace("Name: %s", this.$projectData.projectName);

		this.$logger.out("Copying template files...");

		let packageToInstall = "";
		let npmOptions: IStringDictionary = {
			pathToSave: path.join(this.$projectData.platformsDir, platform),
			dependencyType: "save"
		};

		if (!this.$options.frameworkPath) {
			packageToInstall = platformData.frameworkPackageName;
			npmOptions["version"] = version;
		}

		let spinner = new clui.Spinner("Installing " + packageToInstall);
		let projectDir = this.$projectData.projectDir;
		try {
			spinner.start();
			let downloadedPackagePath = await this.$npmInstallationManager.install(packageToInstall, projectDir, npmOptions);
			let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
			frameworkDir = path.resolve(frameworkDir);

			let coreModuleName = await this.addPlatformCore(platformData, frameworkDir);
			await this.$npm.uninstall(coreModuleName, { save: true }, this.$projectData.projectDir);
		} catch (err) {
			this.$fs.deleteDirectory(platformPath);
			throw err;
		} finally {
			spinner.stop();
		}

		this.$logger.out("Project successfully created.");

	}

	private async addPlatformCore(platformData: IPlatformData, frameworkDir: string): Promise<string> {
		let coreModuleData = this.$fs.readJson(path.join(frameworkDir, "../", "package.json"));
		let installedVersion = coreModuleData.version;
		let coreModuleName = coreModuleData.name;

		this.$projectDataService.initialize(this.$projectData.projectDir);
		let customTemplateOptions = await this.getPathToPlatformTemplate(this.$options.platformTemplate, platformData.frameworkPackageName);
		let pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;
		await platformData.platformProjectService.createProject(path.resolve(frameworkDir), installedVersion, pathToTemplate);
		platformData.platformProjectService.ensureConfigurationFileInAppResources();
		await platformData.platformProjectService.interpolateData();
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot);

		this.applyBaseConfigOption(platformData);

		let frameworkPackageNameData: any = { version: installedVersion };
		if (customTemplateOptions) {
			frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
		}
		this.$projectDataService.setValue(platformData.frameworkPackageName, frameworkPackageNameData);

		return coreModuleName;

	}

	private async getPathToPlatformTemplate(selectedTemplate: string, frameworkPackageName: string): Promise<any> {
		if (!selectedTemplate) {
			// read data from package.json's nativescript key
			// check the nativescript.tns-<platform>.template value
			let nativescriptPlatformData = this.$projectDataService.getValue(frameworkPackageName);
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

	public getInstalledPlatforms(): string[] {
		if (!this.$fs.exists(this.$projectData.platformsDir)) {
			return [];
		}

		let subDirs = this.$fs.readDirectory(this.$projectData.platformsDir);
		return _.filter(subDirs, p => this.$platformsData.platformsNames.indexOf(p) > -1);
	}

	public getAvailablePlatforms(): string[] {
		let installedPlatforms = this.getInstalledPlatforms();
		return _.filter(this.$platformsData.platformsNames, p => {
			return installedPlatforms.indexOf(p) < 0 && this.isPlatformSupportedForOS(p); // Only those not already installed
		});
	}

	public getPreparedPlatforms(): string[] {
		return _.filter(this.$platformsData.platformsNames, p => { return this.isPlatformPrepared(p); });
	}

	public async preparePlatform(platform: string): Promise<boolean> {
		this.validatePlatform(platform);

		await this.trackProjectType();

		//We need dev-dependencies here, so before-prepare hooks will be executed correctly.
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled();
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
		}

		// Need to check if any plugin requires Cocoapods to be installed.
		if (platform === "ios") {
			for (let pluginData of await this.$pluginsService.getAllInstalledPlugins()) {
				if (this.$fs.exists(path.join(pluginData.pluginPlatformsFolderPath(platform), "Podfile")) &&
					!(await this.$sysInfo.getCocoapodVersion())) {
					this.$errors.failWithoutHelp(`${pluginData.name} has Podfile and you don't have Cocoapods installed or it is not configured correctly. Please verify Cocoapods can work on your machine.`);
				}
			}
		}

		await this.ensurePlatformInstalled(platform);
		let changesInfo = this.$projectChangesService.checkForChanges(platform);

		this.$logger.trace("Changes info in prepare platform:", changesInfo);

		if (changesInfo.hasChanges) {
			await this.preparePlatformCore(platform, changesInfo);
			this.$projectChangesService.savePrepareInfo(platform);
		} else {
			this.$logger.out("Skipping prepare.");
		}

		return true;
	}

	public async validateOptions(platform?: string): Promise<boolean> {
		if (platform) {
			platform = this.$mobileHelper.normalizePlatformName(platform);
			this.$logger.trace("Validate options for platform: " + platform);
			let platformData = this.$platformsData.getPlatformData(platform);
			return await platformData.platformProjectService.validateOptions();
		} else {
			let valid = true;
			for (let availablePlatform in this.$platformsData.availablePlatforms) {
				this.$logger.trace("Validate options for platform: " + availablePlatform);
				let platformData = this.$platformsData.getPlatformData(availablePlatform);
				valid = valid && await platformData.platformProjectService.validateOptions();
			}

			return valid;
		}
	}

	@helpers.hook('prepare')
	private async preparePlatformCore(platform: string, changesInfo?: IProjectChangesInfo): Promise<void> {
		this.$logger.out("Preparing project...");

		let platformData = this.$platformsData.getPlatformData(platform);

		if (!changesInfo || changesInfo.appFilesChanged) {
			await this.copyAppFiles(platform);
		}
		if (!changesInfo || changesInfo.appResourcesChanged) {
			this.copyAppResources(platform);
			await platformData.platformProjectService.prepareProject();
		}
		if (!changesInfo || changesInfo.modulesChanged) {
			await this.copyTnsModules(platform);
		}

		let directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		let excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
		if (!changesInfo || !changesInfo.modulesChanged) {
			excludedDirs.push(constants.TNS_MODULES_FOLDER_NAME);
		}

		this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, excludedDirs);

		if (!changesInfo || changesInfo.configChanged || changesInfo.modulesChanged) {
			this.applyBaseConfigOption(platformData);
			await platformData.platformProjectService.processConfigurationFilesFromAppResources();
		}

		await platformData.platformProjectService.interpolateConfigurationFile();

		this.$logger.out("Project successfully prepared (" + platform + ")");
	}

	private async copyAppFiles(platform: string): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(platform);
		platformData.platformProjectService.ensureConfigurationFileInAppResources();
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

		// Copy app folder to native project
		this.$fs.ensureDirectoryExists(appDestinationDirectoryPath);
		let appSourceDirectoryPath = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);

		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, this.$options, this.$fs);
		appUpdater.updateApp(sourceFiles => {
			this.$xmlValidator.validateXmlFiles(sourceFiles);
		});
	}

	private copyAppResources(platform: string): void {
		let platformData = this.$platformsData.getPlatformData(platform);
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		let appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
		if (this.$fs.exists(appResourcesDirectoryPath)) {
			platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath);
			let appResourcesDestination = platformData.platformProjectService.getAppResourcesDestinationDirectoryPath();
			this.$fs.ensureDirectoryExists(appResourcesDestination);
			shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);
			this.$fs.deleteDirectory(appResourcesDirectoryPath);
		}
	}

	private async copyTnsModules(platform: string): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(platform);
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		let lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

		try {
			let tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime);
		} catch (error) {
			this.$logger.debug(error);
			shell.rm("-rf", appDestinationDirectoryPath);
			this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
		}
	}

	public async shouldBuild(platform: string, buildConfig?: IBuildConfig): Promise<boolean> {
		if (this.$projectChangesService.currentChanges.changesRequireBuild) {
			return true;
		}
		let platformData = this.$platformsData.getPlatformData(platform);
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
		let prepareInfo = this.$projectChangesService.getPrepareInfo(platform);
		let buildInfo = this.getBuildInfo(platform, platformData, buildConfig);
		if (!prepareInfo || !buildInfo) {
			return true;
		}
		if (this.$options.clean) {
			return prepareInfo.time !== buildInfo.prepareTime;
		}
		if (prepareInfo.time === buildInfo.prepareTime) {
			return false;
		}
		return prepareInfo.changesRequireBuildTime !== buildInfo.prepareTime;
	}

	public async trackProjectType(): Promise<void> {
		// Track each project once per process.
		// In long living process, where we may work with multiple projects, we would like to track the information for each of them.
		if (this.$projectData && (this.$projectData.projectFilePath !== this._trackedProjectFilePath)) {
			this._trackedProjectFilePath = this.$projectData.projectFilePath;

			await this.$analyticsService.track("Working with project type", this.$projectData.projectType);
		}
	}

	public async buildPlatform(platform: string, buildConfig?: IBuildConfig): Promise<void> {
		this.$logger.out("Building project...");

		await this.trackProjectType();

		let platformData = this.$platformsData.getPlatformData(platform);
		await platformData.platformProjectService.buildProject(platformData.projectRoot, buildConfig);
		let prepareInfo = this.$projectChangesService.getPrepareInfo(platform);
		let buildInfoFilePath = this.getBuildOutputPath(platform, platformData, buildConfig);
		let buildInfoFile = path.join(buildInfoFilePath, buildInfoFileName);
		let buildInfo: IBuildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};
		this.$fs.writeJson(buildInfoFile, buildInfo);
		this.$logger.out("Project successfully built.");
	}

	public async shouldInstall(device: Mobile.IDevice): Promise<boolean> {
		let platform = device.deviceInfo.platform;
		let platformData = this.$platformsData.getPlatformData(platform);
		if (!(await device.applicationManager.isApplicationInstalled(this.$projectData.projectId))) {
			return true;
		}
		let deviceBuildInfo: IBuildInfo = await this.getDeviceBuildInfo(device);
		let localBuildInfo = this.getBuildInfo(platform, platformData, { buildForDevice: !device.isEmulator });
		return !localBuildInfo || !deviceBuildInfo || deviceBuildInfo.buildTime !== localBuildInfo.buildTime;
	}

	public async installApplication(device: Mobile.IDevice): Promise<void> {
		this.$logger.out("Installing...");
		let platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform);
		let packageFile = "";
		if (this.$devicesService.isiOSSimulator(device)) {
			packageFile = this.getLatestApplicationPackageForEmulator(platformData).packageName;
		} else {
			packageFile = this.getLatestApplicationPackageForDevice(platformData).packageName;
		}

		await platformData.platformProjectService.deploy(device.deviceInfo.identifier);

		await device.applicationManager.reinstallApplication(this.$projectData.projectId, packageFile);

		if (!this.$options.release) {
			let deviceFilePath = await this.getDeviceBuildInfoFilePath(device);
			let buildInfoFilePath = this.getBuildOutputPath(device.deviceInfo.platform, platformData, { buildForDevice: !device.isEmulator });
			let appIdentifier = this.$projectData.projectId;

			await device.fileSystem.putFile(path.join(buildInfoFilePath, buildInfoFileName), deviceFilePath, appIdentifier);
		}

		this.$logger.out(`Successfully installed on device with identifier '${device.deviceInfo.identifier}'.`);
	}

	public async deployPlatform(platform: string, forceInstall?: boolean): Promise<void> {
		await this.preparePlatform(platform);
		this.$logger.out("Searching for devices...");
		await this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device });
		let action = async (device: Mobile.IDevice): Promise<void> => {
			let buildConfig: IBuildConfig = { buildForDevice: !this.$devicesService.isiOSSimulator(device) };
			let shouldBuild = await this.shouldBuild(platform, buildConfig);
			if (shouldBuild) {
				await this.buildPlatform(platform, buildConfig);
			} else {
				this.$logger.out("Skipping package build. No changes detected on the native side. This will be fast!");
			}

			if (forceInstall || shouldBuild || (await this.shouldInstall(device))) {
				await this.installApplication(device);
			} else {
				this.$logger.out("Skipping install.");
			}
		};

		await this.$devicesService.execute(action, this.getCanExecuteAction(platform));
	}

	public async runPlatform(platform: string): Promise<void> {
		await this.trackProjectType();

		if (this.$options.justlaunch) {
			this.$options.watch = false;
		}

		this.$logger.out("Starting...");

		let action = async (device: Mobile.IDevice) => {
			await device.applicationManager.startApplication(this.$projectData.projectId);
			this.$logger.out(`Successfully started on device with identifier '${device.deviceInfo.identifier}'.`);
		};

		await this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device });
		await this.$devicesService.execute(action, this.getCanExecuteAction(platform));
	}

	public async emulatePlatform(platform: string): Promise<void> {
		if (this.$options.avd) {
			this.$logger.warn(`Option --avd is no longer supported. Please use --device instead!`);
			return Promise.resolve();
		}

		if (this.$options.availableDevices) {
			return this.$emulatorPlatformService.listAvailableEmulators(platform);
		}

		this.$options.emulator = true;
		if (this.$options.device) {
			let info = await this.$emulatorPlatformService.getEmulatorInfo(platform, this.$options.device);
			if (info) {
				if (!info.isRunning) {
					await this.$emulatorPlatformService.startEmulator(info);
				}

				this.$options.device = null;
			} else {
				await this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device });
				let found: Mobile.IDeviceInfo[] = [];
				if (this.$devicesService.hasDevices) {
					found = this.$devicesService.getDevices().filter((device: Mobile.IDeviceInfo) => device.identifier === this.$options.device);
				}

				if (found.length === 0) {
					this.$errors.fail("Cannot find device with name: %s", this.$options.device);
				}
			}
		}

		await this.deployPlatform(platform);
		return this.runPlatform(platform);
	}

	private getBuildOutputPath(platform: string, platformData: IPlatformData, buildConfig?: IBuildConfig): string {
		let buildForDevice = buildConfig ? buildConfig.buildForDevice : this.$options.forDevice;
		if (platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
			return buildForDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath;
		}
		return platformData.deviceBuildOutputPath;
	}

	private async getDeviceBuildInfoFilePath(device: Mobile.IDevice): Promise<string> {
		let deviceAppData = this.$deviceAppDataFactory.create(this.$projectData.projectId, device.deviceInfo.platform, device);
		let deviceRootPath = path.dirname(await deviceAppData.getDeviceProjectRootPath());
		return helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, buildInfoFileName));
	}

	private async getDeviceBuildInfo(device: Mobile.IDevice): Promise<IBuildInfo> {
		let deviceFilePath = await this.getDeviceBuildInfoFilePath(device);
		try {
			return JSON.parse(await this.readFile(device, deviceFilePath));
		} catch (e) {
			return null;
		}
	}

	private getBuildInfo(platform: string, platformData: IPlatformData, buildConfig: IBuildConfig): IBuildInfo {
		let buildInfoFilePath = this.getBuildOutputPath(platform, platformData, buildConfig);
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

	public async cleanDestinationApp(platform: string): Promise<void> {
		await this.ensurePlatformInstalled(platform);

		const appSourceDirectoryPath = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);
		let platformData = this.$platformsData.getPlatformData(platform);
		let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, this.$options, this.$fs);
		appUpdater.cleanDestinationApp();
	}

	public lastOutputPath(platform: string, settings: { isForDevice: boolean }): string {
		let packageFile: string;
		let platformData = this.$platformsData.getPlatformData(platform);
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

	public copyLastOutput(platform: string, targetPath: string, settings: { isForDevice: boolean }): void {
		platform = platform.toLowerCase();
		targetPath = path.resolve(targetPath);

		let packageFile = this.lastOutputPath(platform, settings);

		this.$fs.ensureDirectoryExists(path.dirname(targetPath));

		if (this.$fs.exists(targetPath) && this.$fs.getFsStats(targetPath).isDirectory()) {
			let sourceFileName = path.basename(packageFile);
			this.$logger.trace(`Specified target path: '${targetPath}' is directory. Same filename will be used: '${sourceFileName}'.`);
			targetPath = path.join(targetPath, sourceFileName);
		}
		this.$fs.copyFile(packageFile, targetPath);
		this.$logger.info(`Copied file '${packageFile}' to '${targetPath}'.`);
	}

	public async removePlatforms(platforms: string[]): Promise<void> {
		this.$projectDataService.initialize(this.$projectData.projectDir);

		for (let platform of platforms) {
			this.validatePlatformInstalled(platform);
			let platformData = this.$platformsData.getPlatformData(platform);

			await this.$platformsData.getPlatformData(platform).platformProjectService.stopServices();

			let platformDir = path.join(this.$projectData.platformsDir, platform);
			this.$fs.deleteDirectory(platformDir);
			this.$projectDataService.removeProperty(platformData.frameworkPackageName);

			this.$logger.out(`Platform ${platform} successfully removed.`);
		}
	}

	public async updatePlatforms(platforms: string[]): Promise<void> {
		for (let platformParam of platforms) {
			let data = platformParam.split("@"),
				platform = data[0],
				version = data[1];

			if (this.isPlatformInstalled(platform)) {
				await this.updatePlatform(platform, version);
			} else {
				await this.addPlatform(platformParam);
			}
		};
	}

	private getCanExecuteAction(platform: string): any {
		let canExecute = (currentDevice: Mobile.IDevice): boolean => {
			if (this.$options.device && currentDevice && currentDevice.deviceInfo) {
				let device = this.$devicesService.getDeviceByDeviceOption();
				if (device && device.deviceInfo) {
					return currentDevice.deviceInfo.identifier === device.deviceInfo.identifier;
				}
			}

			if (this.$mobileHelper.isiOSPlatform(platform) && this.$hostInfo.isDarwin) {
				if (this.$devicesService.isOnlyiOSSimultorRunning() || this.$options.emulator || this.$devicesService.isiOSSimulator(currentDevice)) {
					return true;
				}

				return this.$devicesService.isiOSDevice(currentDevice);
			}

			return true;
		};

		return canExecute;
	}

	public validatePlatform(platform: string): void {
		if (!platform) {
			this.$errors.fail("No platform specified.");
		}

		platform = platform.split("@")[0].toLowerCase();

		if (!this.isValidPlatform(platform)) {
			this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(this.$platformsData.platformsNames));
		}

		if (!this.isPlatformSupportedForOS(platform)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", platform, process.platform);
		}
	}

	public validatePlatformInstalled(platform: string): void {
		this.validatePlatform(platform);

		if (!this.isPlatformInstalled(platform)) {
			this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
		}
	}

	public async ensurePlatformInstalled(platform: string): Promise<void> {
		if (!this.isPlatformInstalled(platform)) {
			await this.addPlatform(platform);
		}
	}

	private isPlatformInstalled(platform: string): boolean {
		return this.$fs.exists(path.join(this.$projectData.platformsDir, platform.toLowerCase()));
	}

	private isValidPlatform(platform: string) {
		return this.$platformsData.getPlatformData(platform);
	}

	private isPlatformSupportedForOS(platform: string): boolean {
		let targetedOS = this.$platformsData.getPlatformData(platform).targetedOS;
		let res = !targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0;
		return res;
	}

	private isPlatformPrepared(platform: string): boolean {
		let platformData = this.$platformsData.getPlatformData(platform);
		return platformData.platformProjectService.isPlatformPrepared(platformData.projectRoot);
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

	private async updatePlatform(platform: string, version: string): Promise<void> {
		let platformData = this.$platformsData.getPlatformData(platform);

		this.$projectDataService.initialize(this.$projectData.projectDir);
		let data = this.$projectDataService.getValue(platformData.frameworkPackageName);
		let currentVersion = data && data.version ? data.version : "0.2.0";

		let newVersion = version === constants.PackageVersion.NEXT ?
			await this.$npmInstallationManager.getNextVersion(platformData.frameworkPackageName) :
			version || await this.$npmInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
		let installedModuleDir = await this.$npmInstallationManager.install(platformData.frameworkPackageName, this.$projectData.projectDir, { version: newVersion, dependencyType: "save" });
		let cachedPackageData = this.$fs.readJson(path.join(installedModuleDir, "package.json"));
		newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;

		let canUpdate = platformData.platformProjectService.canUpdatePlatform(installedModuleDir);
		await this.$npm.uninstall(platformData.frameworkPackageName, { save: true }, this.$projectData.projectDir);
		if (canUpdate) {
			if (!semver.valid(newVersion)) {
				this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
			}

			if (!semver.gt(currentVersion, newVersion)) {
				await this.updatePlatformCore(platformData, currentVersion, newVersion, canUpdate);
			} else if (semver.eq(currentVersion, newVersion)) {
				this.$errors.fail("Current and new version are the same.");
			} else {
				this.$errors.fail(`Your current version: ${currentVersion} is higher than the one you're trying to install ${newVersion}.`);
			}
		} else {
			this.$errors.failWithoutHelp("Native Platform cannot be updated.");
		}

	}

	private async updatePlatformCore(platformData: IPlatformData, currentVersion: string, newVersion: string, canUpdate: boolean): Promise<void> {
		let packageName = platformData.normalizedPlatformName.toLowerCase();
		await this.removePlatforms([packageName]);
		packageName = newVersion ? `${packageName}@${newVersion}` : packageName;
		await this.addPlatform(packageName);
		this.$logger.out("Successfully updated to version ", newVersion);
	}

	private applyBaseConfigOption(platformData: IPlatformData): void {
		if (this.$options.baseConfig) {
			let newConfigFile = path.resolve(this.$options.baseConfig);
			this.$logger.trace(`Replacing '${platformData.configurationFilePath}' with '${newConfigFile}'.`);
			this.$fs.copyFile(newConfigFile, platformData.configurationFilePath);
		}
	}

	public async readFile(device: Mobile.IDevice, deviceFilePath: string): Promise<string> {
		temp.track();
		let uniqueFilePath = temp.path({ suffix: ".tmp" });
		try {
			await device.fileSystem.getFile(deviceFilePath, this.$projectData.projectId, uniqueFilePath);
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
