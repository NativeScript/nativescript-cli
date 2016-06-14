import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";
import * as minimatch from "minimatch";
import Future = require("fibers/future");
import * as temp from "temp";
temp.track();
let clui = require("clui");

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
		private $broccoliBuilder: IBroccoliBuilder,
		private $pluginsService: IPluginsService,
		private $projectFilesManager: IProjectFilesManager,
		private $mobileHelper: Mobile.IMobileHelper,
		private $hostInfo: IHostInfo,
		private $xmlValidator: IXmlValidator,
		private $npm: INodePackageManager,
		private $sysInfo: ISysInfo,
		private $staticConfig: Config.IStaticConfig,
		private $childProcess: IChildProcess) { }

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
			let [platform, version] = platformParam.split("@");

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
				pathToSave: path.join(this.$projectData.platformsDir, platform)
			};

			if (this.$options.frameworkPath) {
				packageToInstall = this.$options.frameworkPath;
			} else {
				packageToInstall = platformData.frameworkPackageName;
				npmOptions["version"] = version;
			}

			let spinner = new clui.Spinner("Installing " + packageToInstall);
			try {
				spinner.start();
				let downloadedPackagePath = this.$npmInstallationManager.install(packageToInstall, npmOptions).wait();
				let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
				frameworkDir = path.resolve(frameworkDir);

				this.addPlatformCore(platformData, frameworkDir).wait();
			} catch (err) {
				this.$fs.deleteDirectory(platformPath).wait();
				throw err;
			} finally {
				spinner.stop();
			}

			this.$logger.out("Project successfully created.");

		}).future<void>()();
	}

	private addPlatformCore(platformData: IPlatformData, frameworkDir: string): IFuture<void> {
		return (() => {
			let installedVersion = this.$fs.readJson(path.join(frameworkDir, "../", "package.json")).wait().version;
			let isFrameworkPathDirectory = false,
				isFrameworkPathNotSymlinkedFile = false;

			if (this.$options.frameworkPath) {
				let frameworkPathStats = this.$fs.getFsStats(this.$options.frameworkPath).wait();
				isFrameworkPathDirectory = frameworkPathStats.isDirectory();
				isFrameworkPathNotSymlinkedFile = !this.$options.symlink && frameworkPathStats.isFile();
			}

			let sourceFrameworkDir = isFrameworkPathDirectory && this.$options.symlink ? path.join(this.$options.frameworkPath, "framework") : frameworkDir;
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let customTemplateOptions = this.getPathToPlatformTemplate(this.$options.platformTemplate, platformData.frameworkPackageName).wait();
			let pathToTemplate = customTemplateOptions && customTemplateOptions.pathToTemplate;
			platformData.platformProjectService.createProject(path.resolve(sourceFrameworkDir), installedVersion, pathToTemplate).wait();

			if (isFrameworkPathDirectory || isFrameworkPathNotSymlinkedFile) {
				// Need to remove unneeded node_modules folder
				// One level up is the runtime module and one above is the node_modules folder.
				this.$fs.deleteDirectory(path.join(frameworkDir, "../../")).wait();
			}

			platformData.platformProjectService.ensureConfigurationFileInAppResources().wait();
			platformData.platformProjectService.interpolateData().wait();
			platformData.platformProjectService.afterCreateProject(platformData.projectRoot).wait();

			this.applyBaseConfigOption(platformData).wait();

			let frameworkPackageNameData: any = { version: installedVersion };
			if (customTemplateOptions) {
				frameworkPackageNameData.template = customTemplateOptions.selectedTemplate;
			}
			this.$projectDataService.setValue(platformData.frameworkPackageName, frameworkPackageNameData).wait();

		}).future<void>()();
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
					let pathToTemplate = this.$npm.install(selectedTemplate, tempDir).wait()[0][1];
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

	public preparePlatform(platform: string): IFuture<boolean> {
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
						!this.$sysInfo.getSysInfo(this.$staticConfig.pathToPackageJson).wait().cocoapodVer) {
						this.$errors.failWithoutHelp(`${pluginData.name} has Podfile and you don't have Cocoapods installed or it is not configured correctly. Please verify Cocoapods can work on your machine.`);
					}
				});
			}

			return this.preparePlatformCore(platform).wait();
		}).future<boolean>()();
	}

	@helpers.hook('prepare')
	private preparePlatformCore(platform: string): IFuture<boolean> {
		return (() => {
			platform = platform.toLowerCase();
			this.ensurePlatformInstalled(platform).wait();

			let platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.ensureConfigurationFileInAppResources().wait();
			let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			let lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath).wait() ?
				this.$fs.getFsStats(appDestinationDirectoryPath).wait().mtime : null;

			// Copy app folder to native project
			this.$fs.ensureDirectoryExists(appDestinationDirectoryPath).wait();
			let appSourceDirectoryPath = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);

			// Delete the destination app in order to prevent EEXIST errors when symlinks are used.
			let contents = this.$fs.readDirectory(appDestinationDirectoryPath).wait();

			_(contents)
				.filter(directoryName => directoryName !== constants.TNS_MODULES_FOLDER_NAME)
				.each(directoryName => this.$fs.deleteDirectory(path.join(appDestinationDirectoryPath, directoryName)).wait())
				.value();

			// Copy all files from app dir, but make sure to exclude tns_modules
			let sourceFiles = this.$fs.enumerateFilesInDirectorySync(appSourceDirectoryPath, null, { includeEmptyDirectories: true });

			if (this.$options.release) {
				let testsFolderPath = path.join(appSourceDirectoryPath, 'tests');
				sourceFiles = sourceFiles.filter(source => source.indexOf(testsFolderPath) === -1);
			}

			let hasTnsModulesInAppFolder = this.$fs.exists(path.join(appSourceDirectoryPath, constants.TNS_MODULES_FOLDER_NAME)).wait();
			if (hasTnsModulesInAppFolder && this.$projectData.dependencies && this.$projectData.dependencies[constants.TNS_CORE_MODULES_NAME]) {
				this.$logger.warn("You have tns_modules dir in your app folder and tns-core-modules in your package.json file. Tns_modules dir in your app folder will not be used and you can safely remove it.");
				sourceFiles = sourceFiles.filter(source => !minimatch(source, `**/${constants.TNS_MODULES_FOLDER_NAME}/**`, { nocase: true }));
			}

			// verify .xml files are well-formed
			this.$xmlValidator.validateXmlFiles(sourceFiles).wait();

			// Remove .ts and .js.map files in release
			if (this.$options.release) {
				constants.LIVESYNC_EXCLUDED_FILE_PATTERNS.forEach(pattern => sourceFiles = sourceFiles.filter(file => !minimatch(file, pattern, { nocase: true })));
			}

			let copyFileFutures = sourceFiles.map(source => {
				let destinationPath = path.join(appDestinationDirectoryPath, path.relative(appSourceDirectoryPath, source));
				if (this.$fs.getFsStats(source).wait().isDirectory()) {
					return this.$fs.createDirectory(destinationPath);
				}
				return this.$fs.copyFile(source, destinationPath);
			});
			Future.wait(copyFileFutures);

			// Copy App_Resources to project root folder
			this.$fs.ensureDirectoryExists(platformData.platformProjectService.getAppResourcesDestinationDirectoryPath().wait()).wait(); // Should be deleted
			let appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath).wait()) {
				platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath).wait();
				shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), platformData.platformProjectService.getAppResourcesDestinationDirectoryPath().wait());
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			platformData.platformProjectService.prepareProject().wait();

			let appDir = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			try {
				let tnsModulesDestinationPath = path.join(appDir, constants.TNS_MODULES_FOLDER_NAME);
				if (!this.$options.bundle) {
					// Process node_modules folder
					this.$broccoliBuilder.prepareNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime).wait();
				} else {
					// Clean target node_modules folder. Not needed when bundling.
					this.$broccoliBuilder.cleanNodeModules(tnsModulesDestinationPath, platform);
				}
			} catch (error) {
				this.$logger.debug(error);
				shell.rm("-rf", appDir);
				this.$errors.failWithoutHelp(`Processing node_modules failed. ${error}`);
			}

			// Process platform specific files
			let directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			let excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
			this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, excludedDirs).wait();

			this.applyBaseConfigOption(platformData).wait();

			// Process configurations files from App_Resources
			platformData.platformProjectService.processConfigurationFilesFromAppResources().wait();

			// Replace placeholders in configuration files
			platformData.platformProjectService.interpolateConfigurationFile().wait();

			this.$logger.out("Project successfully prepared");
			return true;
		}).future<boolean>()();
	}

	public buildPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			if (!this.preparePlatform(platform).wait()) {
				this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
			}

			let platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.buildProject(platformData.projectRoot, buildConfig).wait();
			this.$logger.out("Project successfully built.");
		}).future<void>()();
	}

	public buildForDeploy(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			if (!this.preparePlatform(platform).wait()) {
				this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
			}

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
				let [platform, version] = platformParam.split("@");
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
			let packageFile: string = null;

			let action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					if (!packageFile) {
						if (this.$devicesService.isiOSSimulator(device)) {
							this.buildForDeploy(platform, buildConfig).wait();
							packageFile = this.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
						} else {
							buildConfig = buildConfig || {};
							buildConfig.buildForDevice = true;
							this.buildForDeploy(platform, buildConfig).wait();
							packageFile = this.getLatestApplicationPackageForDevice(platformData).wait().packageName;
						}
					}

					platformData.platformProjectService.deploy(device.deviceInfo.identifier).wait();
					device.applicationManager.reinstallApplication(this.$projectData.projectId, packageFile).wait();
					this.$logger.info(`Successfully deployed on device with identifier '${device.deviceInfo.identifier}'.`);
				}).future<void>()();
			};
			this.$devicesService.execute(action, this.getCanExecuteAction(platform)).wait();
		}).future<void>()();
	}

	public deployOnDevice(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			this.installOnDevice(platform, buildConfig).wait();
			let action = (device: Mobile.IDevice) => device.applicationManager.startApplication(this.$projectData.projectId);
			this.$devicesService.execute(action, this.getCanExecuteAction(platform)).wait();
		}).future<void>()();
	}

	private getCanExecuteAction(platform: string): any {
		let canExecute = (device: Mobile.IDevice): boolean => {
			if (this.$options.device) {
				return device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
			}

			if (this.$mobileHelper.isiOSPlatform(platform) && this.$hostInfo.isDarwin) {
				if (this.$devicesService.isOnlyiOSSimultorRunning()) {
					return true;
				}

				return this.$options.emulator ? this.$devicesService.isiOSSimulator(device) : this.$devicesService.isiOSDevice(device);
			}

			return true;
		};

		return canExecute;
	}

	public deployOnEmulator(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		platform = platform.toLowerCase();

		if (this.$options.avd) {
			this.$logger.warn(`Option --avd is no longer supported. Please use --device isntead!`);
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

						this.buildPlatform(platform, buildConfig).wait();

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
				return _.contains(validPackageNames, candidate);
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
			let newVersion = version || this.$npmInstallationManager.getLatestVersion(platformData.frameworkPackageName).wait();

			let cachedPackageData = this.$npmInstallationManager.addToCache(platformData.frameworkPackageName, newVersion).wait();
			newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;

			let canUpdate = platformData.platformProjectService.canUpdatePlatform(currentVersion, newVersion).wait();
			if (canUpdate) {
				if (!semver.valid(newVersion)) {
					this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
				}

				if (semver.gt(currentVersion, newVersion)) { // Downgrade
					let isUpdateConfirmed = this.$prompter.confirm(`You are going to downgrade to runtime v.${newVersion}. Are you sure?`, () => false).wait();
					if (isUpdateConfirmed) {
						this.updatePlatformCore(platformData, currentVersion, newVersion, canUpdate).wait();
					}
				} else if (semver.eq(currentVersion, newVersion)) {
					this.$errors.fail("Current and new version are the same.");
				} else {
					this.updatePlatformCore(platformData, currentVersion, newVersion, canUpdate).wait();
				}
			} else {
				this.updatePlatformCore(platformData, currentVersion, newVersion, canUpdate).wait();
			}

		}).future<void>()();
	}

	private updatePlatformCore(platformData: IPlatformData, currentVersion: string, newVersion: string, canUpdate: boolean): IFuture<void> {
		return (() => {
			let update = platformData.platformProjectService.updatePlatform(currentVersion, newVersion, canUpdate, this.addPlatform.bind(this), this.removePlatforms.bind(this)).wait();
			if (update) {
				// Remove old framework files
				let oldFrameworkData = this.getFrameworkFiles(platformData, currentVersion).wait();

				_.each(oldFrameworkData.frameworkFiles, file => {
					let fileToDelete = path.join(platformData.projectRoot, file);
					this.$logger.trace("Deleting %s", fileToDelete);
					this.$fs.deleteFile(fileToDelete).wait();
				});

				_.each(oldFrameworkData.frameworkDirectories, dir => {
					let dirToDelete = path.join(platformData.projectRoot, dir);
					this.$logger.trace("Deleting %s", dirToDelete);
					this.$fs.deleteDirectory(dirToDelete).wait();
				});

				// Add new framework files
				let newFrameworkData = this.getFrameworkFiles(platformData, newVersion).wait();
				let cacheDirectoryPath = this.$npmInstallationManager.getCachedPackagePath(platformData.frameworkPackageName, newVersion);

				_.each(newFrameworkData.frameworkFiles, file => {
					let sourceFile = path.join(cacheDirectoryPath, constants.PROJECT_FRAMEWORK_FOLDER_NAME, file);
					let destinationFile = path.join(platformData.projectRoot, file);
					this.$logger.trace("Replacing %s with %s", sourceFile, destinationFile);
					shell.cp("-f", sourceFile, destinationFile);
				});

				_.each(newFrameworkData.frameworkDirectories, dir => {
					let sourceDirectory = path.join(cacheDirectoryPath, constants.PROJECT_FRAMEWORK_FOLDER_NAME, dir);
					let destinationDirectory = path.join(platformData.projectRoot, dir);
					this.$logger.trace("Copying %s to %s", sourceDirectory, destinationDirectory);
					shell.cp("-fR", path.join(sourceDirectory, "*"), destinationDirectory);
				});

				// Update .tnsproject file
				this.$projectDataService.initialize(this.$projectData.projectDir);
				this.$projectDataService.setValue(platformData.frameworkPackageName, { version: newVersion }).wait();

				this.$logger.out("Successfully updated to version ", newVersion);
			}
		}).future<void>()();
	}

	private getFrameworkFiles(platformData: IPlatformData, version: string): IFuture<any> {
		return (() => {
			let cachedPackagePath = this.$npmInstallationManager.getCachedPackagePath(platformData.frameworkPackageName, version);

			let allFiles = this.$fs.enumerateFilesInDirectorySync(cachedPackagePath);
			let filteredFiles = _.filter(allFiles, file => _.contains(platformData.frameworkFilesExtensions, path.extname(file)));

			let allFrameworkDirectories = _.map(this.$fs.readDirectory(path.join(cachedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME)).wait(), dir => path.join(cachedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME, dir));
			let filteredFrameworkDirectories = _.filter(allFrameworkDirectories, dir => this.$fs.getFsStats(dir).wait().isDirectory() && (_.contains(platformData.frameworkFilesExtensions, path.extname(dir)) || _.contains(platformData.frameworkDirectoriesNames, path.basename(dir))));

			return {
				frameworkFiles: this.mapFrameworkFiles(cachedPackagePath, filteredFiles),
				frameworkDirectories: this.mapFrameworkFiles(cachedPackagePath, filteredFrameworkDirectories)
			};

		}).future<any>()();
	}

	private mapFrameworkFiles(npmCacheDirectoryPath: string, files: string[]): string[] {
		return _.map(files, file => file.substr(npmCacheDirectoryPath.length + constants.PROJECT_FRAMEWORK_FOLDER_NAME.length + 1));
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
