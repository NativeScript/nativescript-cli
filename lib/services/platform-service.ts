import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import {AppFilesUpdater} from "./app-files-updater";
import * as temp from "temp";
import {ProjectChangesInfo, IPrepareInfo} from "./project-changes-info";
temp.track();
let clui = require("clui");

const buildInfoFileName = ".nsbuildinfo";

export class PlatformService implements IPlatformService {

	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npmInstallationManager: INpmInstallationManager,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $hooksService: IHooksService,
		private $commandsService: ICommandsService,
		private $options: IOptions,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $pluginsService: IPluginsService,
		private $projectFilesManager: IProjectFilesManager,
		private $mobileHelper: Mobile.IMobileHelper,
		private $hostInfo: IHostInfo,
		private $xmlValidator: IXmlValidator,
		private $npm: INodePackageManager,
		private $sysInfo: ISysInfo,
		private $staticConfig: Config.IStaticConfig,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $childProcess: IChildProcess) { }

	private _prepareInfo: IPrepareInfo;

	public addPlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			let platformsDir = this.$projectData.platformsDir;
			this.$fs.ensureDirectoryExists(platformsDir).wait();

			_.each(platforms, platform => {
				this.addPlatform(platform.toLowerCase()).wait();
			});

		}).future<void>()();
	}

	private addPlatform(platformParam: string): IFuture<void> {
		return (() => {
			let data = platformParam.split("@"),
				platform = data[0],
				version = data[1];

			this.validatePlatform(platform);

			let platformPath = path.join(this.$projectData.platformsDir, platform);

			if (this.$fs.exists(platformPath).wait()) {
				this.$errors.failWithoutHelp("Platform %s already added", platform);
			}

			let platformData = this.$platformsData.getPlatformData(platform);

			// Copy platform specific files in platforms dir
			let platformProjectService = platformData.platformProjectService;
			platformProjectService.validate().wait();

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
			try {
				spinner.start();
				let downloadedPackagePath = this.$npmInstallationManager.install(packageToInstall, this.$projectData.projectDir, npmOptions).wait();
				let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
				frameworkDir = path.resolve(frameworkDir);

				let coreModuleName = this.addPlatformCore(platformData, frameworkDir).wait();
				this.$npm.uninstall(coreModuleName, {save: true}, this.$projectData.projectDir).wait();
			} catch (err) {
				this.$fs.deleteDirectory(platformPath).wait();
				throw err;
			} finally {
				spinner.stop();
			}

			this.$logger.out("Project successfully created.");

		}).future<void>()();
	}

	private addPlatformCore(platformData: IPlatformData, frameworkDir: string): IFuture<string> {
		return (() => {
			let coreModuleData = this.$fs.readJson(path.join(frameworkDir, "../", "package.json")).wait();
			let installedVersion = coreModuleData.version;
			let coreModuleName = coreModuleData.name;

			this.$projectDataService.initialize(this.$projectData.projectDir);
			let customTemplateOptions = this.getPathToPlatformTemplate(this.$options.platformTemplate, platformData.frameworkPackageName).wait();
			let pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;
			platformData.platformProjectService.createProject(path.resolve(frameworkDir), installedVersion, pathToTemplate).wait();
			platformData.platformProjectService.ensureConfigurationFileInAppResources().wait();
			platformData.platformProjectService.interpolateData().wait();
			platformData.platformProjectService.afterCreateProject(platformData.projectRoot).wait();

			this.applyBaseConfigOption(platformData).wait();

			let frameworkPackageNameData: any = { version: installedVersion };
			if (customTemplateOptions) {
				frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
			}
			this.$projectDataService.setValue(platformData.frameworkPackageName, frameworkPackageNameData).wait();

			return coreModuleName;

		}).future<string>()();
	}

	private getPathToPlatformTemplate(selectedTemplate: string, frameworkPackageName: string): IFuture<any> {
		return (() => {
			if (!selectedTemplate) {
				// read data from package.json's nativescript key
				// check the nativescript.tns-<platform>.template value
				let nativescriptPlatformData = this.$projectDataService.getValue(frameworkPackageName).wait();
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
					let pathToTemplate = this.$npm.install(selectedTemplate, tempDir).wait()[0];
					return { selectedTemplate, pathToTemplate };
				} catch (err) {
					this.$logger.trace("Error while trying to install specified template: ", err);
					this.$errors.failWithoutHelp(`Unable to install platform template ${selectedTemplate}. Make sure the specified value is valid.`);
				}
			}

			return null;
		}).future<any>()();
	}

	public getInstalledPlatforms(): IFuture<string[]> {
		return (() => {
			if (!this.$fs.exists(this.$projectData.platformsDir).wait()) {
				return [];
			}

			let subDirs = this.$fs.readDirectory(this.$projectData.platformsDir).wait();
			return _.filter(subDirs, p => this.$platformsData.platformsNames.indexOf(p) > -1);
		}).future<string[]>()();
	}

	public getAvailablePlatforms(): IFuture<string[]> {
		return (() => {
			let installedPlatforms = this.getInstalledPlatforms().wait();
			return _.filter(this.$platformsData.platformsNames, p => {
				return installedPlatforms.indexOf(p) < 0 && this.isPlatformSupportedForOS(p); // Only those not already installed
			});
		}).future<string[]>()();
	}

	public getPreparedPlatforms(): IFuture<string[]> {
		return (() => {
			return _.filter(this.$platformsData.platformsNames, p => { return this.isPlatformPrepared(p).wait(); });
		}).future<string[]>()();
	}

	public preparePlatform(platform: string, force?: boolean, skipModulesAndResources?: boolean): IFuture<boolean> {
		return (() => {
			this.validatePlatform(platform);

			//We need dev-dependencies here, so before-prepare hooks will be executed correctly.
			try {
				this.$pluginsService.ensureAllDependenciesAreInstalled().wait();
			} catch (err) {
				this.$logger.trace(err);
				this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
			}

			// Need to check if any plugin requires Cocoapods to be installed.
			if (platform === "ios") {
				_.each(this.$pluginsService.getAllInstalledPlugins().wait(), (pluginData: IPluginData) => {
					if (this.$fs.exists(path.join(pluginData.pluginPlatformsFolderPath(platform), "Podfile")).wait() &&
						!this.$sysInfo.getCocoapodVersion().wait()) {
						this.$errors.failWithoutHelp(`${pluginData.name} has Podfile and you don't have Cocoapods installed or it is not configured correctly. Please verify Cocoapods can work on your machine.`);
					}
				});
			}

			this.ensurePlatformInstalled(platform).wait();

			let changeInfo:ProjectChangesInfo = new ProjectChangesInfo(platform, force, skipModulesAndResources, this.$platformsData, this.$projectData, this.$devicePlatformsConstants, this.$options, this.$fs);
			this._prepareInfo = changeInfo.prepareInfo;
			if (!this.isPlatformPrepared(platform).wait() || changeInfo.hasChanges) {
				this.preparePlatformCore(platform, changeInfo).wait();
				return true;
			}
			return false;
		}).future<boolean>()();
	}

	@helpers.hook('prepare')
	private preparePlatformCore(platform: string, changeInfo:ProjectChangesInfo): IFuture<void> {
		return (() => {

			let platformData = this.$platformsData.getPlatformData(platform);

			if (changeInfo.appFilesChanged) {
				this.copyAppFiles(platform).wait();
			}
			if (changeInfo.appResourcesChanged) {
				this.copyAppResources(platform).wait();
				platformData.platformProjectService.prepareProject().wait();
			}
			if (changeInfo.modulesChanged) {
				this.copyTnsModules(platform).wait();
			}

			let directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			let excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
			if (!changeInfo.modulesChanged) {
				excludedDirs.push(constants.TNS_MODULES_FOLDER_NAME);
			}
			this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, excludedDirs).wait();

			if (changeInfo.configChanged || changeInfo.modulesChanged) {
				this.applyBaseConfigOption(platformData).wait();
				platformData.platformProjectService.processConfigurationFilesFromAppResources().wait();
			}

			platformData.platformProjectService.interpolateConfigurationFile().wait();

			this.$logger.out("Project successfully prepared ("+platform+")");
		}).future<void>()();
	}

	private copyAppFiles(platform: string): IFuture<void> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.ensureConfigurationFileInAppResources().wait();
			let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

			// Copy app folder to native project
			this.$fs.ensureDirectoryExists(appDestinationDirectoryPath).wait();
			let appSourceDirectoryPath = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);

			const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, this.$options, this.$fs);
			appUpdater.updateApp(sourceFiles => {
				this.$xmlValidator.validateXmlFiles(sourceFiles).wait();
			});
		}).future<void>()();
	}

	private copyAppResources(platform: string): IFuture<void> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(platform);
			let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			let appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath).wait()) {
				platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath).wait();
				let appResourcesDestination = platformData.platformProjectService.getAppResourcesDestinationDirectoryPath().wait();
				this.$fs.ensureDirectoryExists(appResourcesDestination).wait();
				shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}
		}).future<void>()();
	}

	private copyTnsModules(platform: string): IFuture<void> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(platform);
			let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			let lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath).wait() ? this.$fs.getFsStats(appDestinationDirectoryPath).wait().mtime : null;

			try {
				let tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
				// Process node_modules folder
				this.$nodeModulesBuilder.prepareNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime).wait();
			} catch (error) {
				this.$logger.debug(error);
				shell.rm("-rf", appDestinationDirectoryPath);
				this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
			}
		}).future<void>()();
	}

	public cleanDestinationApp(platform: string): IFuture<void> {
		return (() => {
			this.ensurePlatformInstalled(platform).wait();

			const appSourceDirectoryPath = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);
			let platformData = this.$platformsData.getPlatformData(platform);
			let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			const appUpdater = new AppFilesUpdater(appSourceDirectoryPath, appDestinationDirectoryPath, this.$options, this.$fs);
			appUpdater.cleanDestinationApp();
		}).future<void>()();
	}

	public buildPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			let platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.buildProject(platformData.projectRoot, buildConfig).wait();
			this.$logger.out("Project successfully built.");
		}).future<void>()();
	}

	public prepareAndBuild(platform: string, buildConfig?: IBuildConfig, forceBuild?: boolean): IFuture<void> {
		return (() => {
			let shouldBuild = this.preparePlatform(platform, false).wait();
			let platformData = this.$platformsData.getPlatformData(platform);
			let buildInfoFilePath = this.getBuildOutputPath(platform, platformData, buildConfig);
			let buildInfoFile = path.join(buildInfoFilePath, buildInfoFileName);
			if (!shouldBuild) {
				if (this.$fs.exists(buildInfoFile).wait()) {
					let buildInfoText = this.$fs.readText(buildInfoFile).wait();
					shouldBuild = this._prepareInfo.time !== buildInfoText;
				} else {
					shouldBuild = true;
				}
			}
			if (shouldBuild || forceBuild) {
				this.buildForDeploy(platform, buildConfig).wait();
				this.$fs.writeFile(buildInfoFile, this._prepareInfo.time).wait();
			}
		}).future<void>()();
	}

	private getBuildOutputPath(platform: string, platformData: IPlatformData, buildConfig?: IBuildConfig): string {
		let buildForDevice = buildConfig ? buildConfig.buildForDevice : this.$options.forDevice;
		if (platform === this.$devicePlatformsConstants.iOS.toLowerCase()) {
			return buildForDevice ? platformData.deviceBuildOutputPath : platformData.emulatorBuildOutputPath;
		}
		return platformData.deviceBuildOutputPath;
	}

	public buildForDeploy(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			let platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.buildForDeploy(platformData.projectRoot, buildConfig).wait();
			this.$logger.out("Project successfully built");
		}).future<void>()();
	}

	public lastOutputPath(platform: string, settings: { isForDevice: boolean }): string {
		let packageFile: string;
		let platformData = this.$platformsData.getPlatformData(platform);
		if (settings.isForDevice) {
			packageFile = this.getLatestApplicationPackageForDevice(platformData).wait().packageName;
		} else {
			packageFile = this.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
		}
		if (!packageFile || !this.$fs.exists(packageFile).wait()) {
			this.$errors.failWithoutHelp("Unable to find built application. Try 'tns build %s'.", platform);
		}
		return packageFile;
	}

	public copyLastOutput(platform: string, targetPath: string, settings: { isForDevice: boolean }): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			targetPath = path.resolve(targetPath);

			let packageFile = this.lastOutputPath(platform, settings);

			this.$fs.ensureDirectoryExists(path.dirname(targetPath)).wait();

			if (this.$fs.exists(targetPath).wait() && this.$fs.getFsStats(targetPath).wait().isDirectory()) {
				let sourceFileName = path.basename(packageFile);
				this.$logger.trace(`Specified target path: '${targetPath}' is directory. Same filename will be used: '${sourceFileName}'.`);
				targetPath = path.join(targetPath, sourceFileName);
			}
			this.$fs.copyFile(packageFile, targetPath).wait();
			this.$logger.info(`Copied file '${packageFile}' to '${targetPath}'.`);
		}).future<void>()();
	}

	public removePlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			this.$projectDataService.initialize(this.$projectData.projectDir);

			_.each(platforms, platform => {
				this.validatePlatformInstalled(platform);
				let platformData = this.$platformsData.getPlatformData(platform);

				let platformDir = path.join(this.$projectData.platformsDir, platform);
				this.$fs.deleteDirectory(platformDir).wait();
				this.$projectDataService.removeProperty(platformData.frameworkPackageName).wait();

				this.$logger.out(`Platform ${platform} successfully removed.`);
			});

		}).future<void>()();
	}

	public updatePlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			_.each(platforms, platformParam => {
				let data = platformParam.split("@"),
					platform = data[0],
					version = data[1];

				if (this.isPlatformInstalled(platform).wait()) {
					this.updatePlatform(platform, version).wait();
				} else {
					this.addPlatform(platformParam).wait();
				}
			});
		}).future<void>()();
	}

	public runPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		platform = platform.toLowerCase();
		if (this.$options.emulator) {
			return this.deployOnEmulator(platform, buildConfig);
		}

		return this.deployOnDevice(platform, buildConfig);
	}

	public installOnDevice(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			this.ensurePlatformInstalled(platform).wait();
			let platformData = this.$platformsData.getPlatformData(platform);

			this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device }).wait();
			let packageFileDict: IStringDictionary = {};

			let action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {

					let packageFileKey = this.getPackageFileKey(device);
					let packageFile = packageFileDict[packageFileKey];
					if (!packageFile) {
						if (this.$devicesService.isiOSSimulator(device)) {
							this.prepareAndBuild(platform, buildConfig).wait();
							packageFile = this.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
						} else {
							let deviceBuildConfig = buildConfig || {};
							deviceBuildConfig.buildForDevice = true;
							this.prepareAndBuild(platform, deviceBuildConfig).wait();
							packageFile = this.getLatestApplicationPackageForDevice(platformData).wait().packageName;
						}
					}

					platformData.platformProjectService.deploy(device.deviceInfo.identifier).wait();
					device.applicationManager.reinstallApplication(this.$projectData.projectId, packageFile).wait();
					this.$logger.info(`Successfully deployed on device with identifier '${device.deviceInfo.identifier}'.`);

					packageFileDict[packageFileKey] = packageFile;

				}).future<void>()();
			};
			this.$devicesService.execute(action, this.getCanExecuteAction(platform)).wait();
		}).future<void>()();
	}

	private getPackageFileKey(device: Mobile.IDevice): string {
		if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			return device.deviceInfo.platform.toLowerCase();
		}
		return device.deviceInfo.platform.toLowerCase() + device.deviceInfo.type;
	}

	public deployOnDevice(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			this.installOnDevice(platform, buildConfig).wait();
			this.startOnDevice(platform).wait();
		}).future<void>()();
	}

	public startOnDevice(platform: string): IFuture<void> {
		return (() => {
			let action = (device: Mobile.IDevice) => device.applicationManager.startApplication(this.$projectData.projectId);
			this.$devicesService.execute(action, this.getCanExecuteAction(platform)).wait();
		}).future<void>()();
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

	public deployOnEmulator(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		platform = platform.toLowerCase();
		if (this.$options.avd) {
			this.$logger.warn(`Option --avd is no longer supported. Please use --device instead!`);
		}

		if (this.$options.availableDevices || this.$options.device || this.$options.avd) {
			return (() => {
				let devices: string;

				if (this.$mobileHelper.isiOSPlatform(platform)) {
					devices = this.$childProcess.exec("instruments -s devices").wait();
				} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
					let androidPath = path.join(process.env.ANDROID_HOME, "tools", "android");
					devices = this.$childProcess.exec(`${androidPath} list avd`).wait();
				}

				if (this.$options.availableDevices) {
					this.$logger.info(devices);
				}

				if (this.$options.device || this.$options.avd) {
					if (this.$options.device) {
						this.$options.avd = this.$options.device;
					}

					if (devices.indexOf(this.$options.device) !== -1 || devices.indexOf(this.$options.avd) !== -1) {
						this.ensurePlatformInstalled(platform).wait();

						let packageFile: string, logFilePath: string;
						let platformData = this.$platformsData.getPlatformData(platform);
						let emulatorServices = platformData.emulatorServices;

						emulatorServices.checkAvailability().wait();
						emulatorServices.checkDependencies().wait();

						this.prepareAndBuild(platform, buildConfig).wait();

						packageFile = this.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
						this.$logger.out("Using ", packageFile);

						logFilePath = path.join(platformData.projectRoot, this.$projectData.projectName, "emulator.log");

						emulatorServices.runApplicationOnEmulator(packageFile, { stderrFilePath: logFilePath, stdoutFilePath: logFilePath, appId: this.$projectData.projectId }).wait();
					} else {
						this.$errors.fail(`Cannot find device with name: ${this.$options.device || this.$options.avd}.`);
					}
				}
			}).future<void>()();
		} else {
			this.$options.emulator = true;
			return this.deployOnDevice(platform, buildConfig);
		}
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

		if (!this.isPlatformInstalled(platform).wait()) {
			this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
		}
	}

	public ensurePlatformInstalled(platform: string): IFuture<void> {
		return (() => {
			if (!this.isPlatformInstalled(platform).wait()) {
				this.addPlatform(platform).wait();
			}
		}).future<void>()();
	}

	private isPlatformInstalled(platform: string): IFuture<boolean> {
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

	private isPlatformPrepared(platform: string): IFuture<boolean> {
		let platformData = this.$platformsData.getPlatformData(platform);
		return platformData.platformProjectService.isPlatformPrepared(platformData.projectRoot);
	}

	private getApplicationPackages(buildOutputPath: string, validPackageNames: string[]): IFuture<IApplicationPackage[]> {
		return (() => {
			// Get latest package that is produced from build
			let candidates = this.$fs.readDirectory(buildOutputPath).wait();
			let packages = _.filter(candidates, candidate => {
				return _.includes(validPackageNames, candidate);
			}).map(currentPackage => {
				currentPackage = path.join(buildOutputPath, currentPackage);

				return {
					packageName: currentPackage,
					time: this.$fs.getFsStats(currentPackage).wait().mtime
				};
			});

			return packages;
		}).future<IApplicationPackage[]>()();
	}

	private getLatestApplicationPackage(buildOutputPath: string, validPackageNames: string[]): IFuture<IApplicationPackage> {
		return (() => {
			let packages = this.getApplicationPackages(buildOutputPath, validPackageNames).wait();
			if (packages.length === 0) {
				let packageExtName = path.extname(validPackageNames[0]);
				this.$errors.fail("No %s found in %s directory", packageExtName, buildOutputPath);
			}

			packages = _.sortBy(packages, pkg => pkg.time).reverse(); // We need to reverse because sortBy always sorts in ascending order

			return packages[0];
		}).future<IApplicationPackage>()();
	}

	public getLatestApplicationPackageForDevice(platformData: IPlatformData) {
		return this.getLatestApplicationPackage(platformData.deviceBuildOutputPath, platformData.validPackageNamesForDevice);
	}

	public getLatestApplicationPackageForEmulator(platformData: IPlatformData) {
		return this.getLatestApplicationPackage(platformData.emulatorBuildOutputPath || platformData.deviceBuildOutputPath, platformData.validPackageNamesForEmulator || platformData.validPackageNamesForDevice);
	}

	private updatePlatform(platform: string, version: string): IFuture<void> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(platform);

			this.$projectDataService.initialize(this.$projectData.projectDir);
			let data = this.$projectDataService.getValue(platformData.frameworkPackageName).wait();
			let currentVersion = data && data.version ? data.version : "0.2.0";

			let newVersion = version === constants.PackageVersion.NEXT ?
				this.$npmInstallationManager.getNextVersion(platformData.frameworkPackageName).wait() :
				version || this.$npmInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName).wait();
			let installedModuleDir = this.$npmInstallationManager.install(platformData.frameworkPackageName, this.$projectData.projectDir, {version: newVersion, dependencyType: "save"}).wait();
			let cachedPackageData = this.$fs.readJson(path.join(installedModuleDir, "package.json")).wait();
			newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;

			let canUpdate = platformData.platformProjectService.canUpdatePlatform(installedModuleDir).wait();
			this.$npm.uninstall(platformData.frameworkPackageName, {save: true}, this.$projectData.projectDir).wait();
			if (canUpdate) {
				if (!semver.valid(newVersion)) {
					this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
				}

				if (!semver.gt(currentVersion, newVersion)) {
					this.updatePlatformCore(platformData, currentVersion, newVersion, canUpdate).wait();
				} else if (semver.eq(currentVersion, newVersion)) {
					this.$errors.fail("Current and new version are the same.");
				} else {
					this.$errors.fail(`Your current version: ${currentVersion} is higher than the one you're trying to install ${newVersion}.`);
				}
			} else {
				this.$errors.failWithoutHelp("Native Platform cannot be updated.");
			}

		}).future<void>()();
	}

	private updatePlatformCore(platformData: IPlatformData, currentVersion: string, newVersion: string, canUpdate: boolean): IFuture<void> {
		return (() => {
			let packageName = platformData.normalizedPlatformName.toLowerCase();
			this.removePlatforms([packageName]).wait();
			packageName = newVersion ? `${packageName}@${newVersion}` : packageName;
			this.addPlatform(packageName).wait();
			this.$logger.out("Successfully updated to version ", newVersion);
		}).future<void>()();
	}

	private applyBaseConfigOption(platformData: IPlatformData): IFuture<void> {
		return (() => {
			if (this.$options.baseConfig) {
				let newConfigFile = path.resolve(this.$options.baseConfig);
				this.$logger.trace(`Replacing '${platformData.configurationFilePath}' with '${newConfigFile}'.`);
				this.$fs.copyFile(newConfigFile, platformData.configurationFilePath).wait();
			}
		}).future<void>()();
	}
}
$injector.register("platformService", PlatformService);
