///<reference path="../.d.ts"/>
"use strict";

import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as helpers from "../common/helpers";
import * as semver from "semver";

export class PlatformService implements IPlatformService {
	private static TNS_MODULES_FOLDER_NAME = "tns_modules";

	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npmInstallationManager: INpmInstallationManager,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter,
		private $commandsService: ICommandsService,
		private $options: IOptions,
		private $broccoliBuilder: IBroccoliBuilder,
		private $pluginsService: IPluginsService,
		private $projectFilesManager: IProjectFilesManager) { }

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
		return(() => {
			let [platform, version] = platformParam.split("@");

			this.validatePlatform(platform);

			let platformPath = path.join(this.$projectData.platformsDir, platform);

			if (this.$fs.exists(platformPath).wait()) {
				this.$errors.fail("Platform %s already added", platform);
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

			if(this.$options.frameworkPath) {
				packageToInstall = this.$options.frameworkPath;
			} else {
				packageToInstall = platformData.frameworkPackageName;
				npmOptions["version"] = version;
			}

			try {
				let downloadedPackagePath = this.$npmInstallationManager.install(packageToInstall, npmOptions).wait();
				let frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
				frameworkDir = path.resolve(frameworkDir);

				this.addPlatformCore(platformData, frameworkDir).wait();
			} catch(err) {
				this.$fs.deleteDirectory(platformPath).wait();
				throw err;
			}

			this.$logger.out("Project successfully created.");

		}).future<void>()();
	}

	private addPlatformCore(platformData: IPlatformData, frameworkDir: string): IFuture<void> {
		return (() => {
			let installedVersion = this.$fs.readJson(path.join(frameworkDir, "../", "package.json")).wait().version;
			platformData.platformProjectService.createProject(frameworkDir, installedVersion).wait();

			if(this.$options.frameworkPath && this.$fs.getFsStats(this.$options.frameworkPath).wait().isFile() && !this.$options.symlink) {
				// Need to remove unneeded node_modules folder
				// One level up is the runtime module and one above is the node_modules folder.
				this.$fs.deleteDirectory(path.join(frameworkDir, "../../")).wait();
			}

			platformData.platformProjectService.interpolateData(platformData.projectRoot).wait();
			platformData.platformProjectService.afterCreateProject(platformData.projectRoot).wait();

			this.$projectDataService.initialize(this.$projectData.projectDir);
			this.$projectDataService.setValue(platformData.frameworkPackageName, {version: installedVersion}).wait();

		}).future<void>()();
	}

	public getInstalledPlatforms(): IFuture<string[]> {
		return(() => {
			if(!this.$fs.exists(this.$projectData.platformsDir).wait()) {
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

	public preparePlatform(platform: string): IFuture<void> {
		return (() => {
			this.validatePlatform(platform);

			platform = platform.toLowerCase();
			this.ensurePlatformInstalled(platform).wait();

			let platformData = this.$platformsData.getPlatformData(platform);
			let appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			let lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath).wait() ?
				this.$fs.getFsStats(appDestinationDirectoryPath).wait().mtime : null;

			// Copy app folder to native project
			this.$fs.ensureDirectoryExists(appDestinationDirectoryPath).wait();
			let appSourceDirectoryPath = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);

			// Delete the destination app in order to prevent EEXIST errors when symlinks are used.
			let contents = this.$fs.readDirectory(appDestinationDirectoryPath).wait();

			_(contents)
				.filter(directoryName => directoryName !== "tns_modules")
				.each(directoryName => this.$fs.deleteDirectory(path.join(appDestinationDirectoryPath, directoryName)).wait())
				.value();

			// Copy all files from app dir, but make sure to exclude tns_modules
			let sourceFiles = this.$fs.readDirectory(appSourceDirectoryPath).wait();
			if(_.contains(sourceFiles, "tns_modules")) {
				this.$logger.warn("You have tns_modules dir in your app folder. It will not be used and you can safely remove it.");
			}

			sourceFiles.filter(source => source !== "tns_modules")
				.map(source => path.join(appSourceDirectoryPath, source))
				.forEach(source => shell.cp("-Rf", source, appDestinationDirectoryPath));

			// Copy App_Resources to project root folder
			this.$fs.ensureDirectoryExists(platformData.platformProjectService.getAppResourcesDestinationDirectoryPath().wait()).wait(); // Should be deleted
			let appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath).wait()) {
				platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath).wait();
				shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), platformData.platformProjectService.getAppResourcesDestinationDirectoryPath().wait());
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			platformData.platformProjectService.prepareProject().wait();

			// Process node_modules folder
			try {
				this.$pluginsService.ensureAllDependenciesAreInstalled().wait();
				let tnsModulesDestinationPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME, PlatformService.TNS_MODULES_FOLDER_NAME);
				this.$broccoliBuilder.prepareNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime).wait();
			} catch(error) {
				this.$logger.debug(error);
				shell.rm("-rf", appResourcesDirectoryPath);
				this.$errors.fail(`Processing node_modules failed. Error:${error}`);
			}

			// Process platform specific files
			let directoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			let excludedDirs = [constants.APP_RESOURCES_FOLDER_NAME];
			this.$projectFilesManager.processPlatformSpecificFiles(directoryPath, platform, excludedDirs).wait();

			this.$logger.out("Project successfully prepared");
		}).future<void>()();
	}

	public buildPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			this.preparePlatform(platform).wait();

			let platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.buildProject(platformData.projectRoot, buildConfig).wait();
			this.$logger.out("Project successfully built");
		}).future<void>()();
	}

	public runPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();

			if (this.$options.emulator) {
				this.deployOnEmulator(platform, buildConfig).wait();
			} else {
				this.deployOnDevice(platform, buildConfig).wait();
			}
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
				if(this.isPlatformInstalled(platform).wait()) {
					this.updatePlatform(platform, version).wait();
				} else {
					this.addPlatform(platformParam).wait();
				}
			});
		}).future<void>()();
	}

	public deployOnDevice(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			this.ensurePlatformInstalled(platform).wait();
			let platformData = this.$platformsData.getPlatformData(platform);

			let cachedDeviceOption = this.$options.forDevice;
			this.$options.forDevice = true;
			this.buildPlatform(platform, buildConfig).wait();
			this.$options.forDevice = !!cachedDeviceOption;

			// Get latest package that is produced from build
			let packageFile = this.getLatestApplicationPackageForDevice(platformData).wait().packageName;
			this.$logger.out("Using ", packageFile);

			this.$devicesServices.initialize({platform: platform, deviceId: this.$options.device}).wait();
			let action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					device.deploy(packageFile, this.$projectData.projectId).wait();

					if (!this.$options.justlaunch) {
						device.openDeviceLogStream();
					}
				}).future<void>()();
			};
			this.$devicesServices.execute(action).wait();
			this.$commandsService.tryExecuteCommand("device", ["run", this.$projectData.projectId]).wait();
		}).future<void>()();
	}

	public deployOnEmulator(platform: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			let packageFile: string, logFilePath: string;
			this.ensurePlatformInstalled(platform).wait();
			platform = platform.toLowerCase();

			let platformData = this.$platformsData.getPlatformData(platform);
			let emulatorServices = platformData.emulatorServices;

			emulatorServices.checkAvailability().wait();
			emulatorServices.checkDependencies().wait();

			if(!this.$options.availableDevices) {
				this.buildPlatform(platform, buildConfig).wait();

				packageFile = this.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
				this.$logger.out("Using ", packageFile);

				logFilePath = path.join(platformData.projectRoot, this.$projectData.projectName, "emulator.log");
			}

			emulatorServices.startEmulator(packageFile, { stderrFilePath: logFilePath, stdoutFilePath: logFilePath, appId: this.$projectData.projectId }).wait();
		}).future<void>()();
	}

	public validatePlatform(platform: string): void {
		if(!platform) {
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

	public addLibrary(platform: string, libraryPath: string): IFuture<void> {
		return (() => {
			if (!this.$fs.exists(libraryPath).wait()) {
				this.$errors.failWithoutHelp("The path %s does not exist", libraryPath);
			} else {
				let platformData = this.$platformsData.getPlatformData(platform);
				platformData.platformProjectService.addLibrary(libraryPath).wait();
			}
		}).future<void>()();
	}

	private ensurePlatformInstalled(platform: string): IFuture<void> {
		return (() => {
			if(!this.isPlatformInstalled(platform).wait()) {
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

			this.ensurePackageIsCached(platformData.frameworkPackageName, newVersion).wait();

			let canUpdate = platformData.platformProjectService.canUpdatePlatform(currentVersion, newVersion).wait();
			if(canUpdate) {
				if(!semver.valid(newVersion)) {
					this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
				}

				if(semver.gt(currentVersion, newVersion)) { // Downgrade
					let isUpdateConfirmed = this.$prompter.confirm(`You are going to downgrade to runtime v.${newVersion}. Are you sure?`, () => false).wait();
					if(isUpdateConfirmed) {
						this.updatePlatformCore(platformData, currentVersion, newVersion, canUpdate).wait();
					}
				} else if(semver.eq(currentVersion, newVersion)) {
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
			if(update) {
				// Remove old framework files
				let oldFrameworkData =  this.getFrameworkFiles(platformData, currentVersion).wait();

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
				this.$projectDataService.setValue(platformData.frameworkPackageName, {version: newVersion}).wait();

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

	private ensurePackageIsCached(packageName: string, version: string): IFuture<void> {
		return (() => {
			this.$npmInstallationManager.addToCache(packageName, version).wait();
			let cachedPackagePath = this.$npmInstallationManager.getCachedPackagePath(packageName, version);
			if(!this.$fs.exists(path.join(cachedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME)).wait()) {
				// In some cases the package is not fully downloaded and the framework directory is missing
				// Try removing the old package and add the real one to cache again
				this.$npmInstallationManager.addCleanCopyToCache(packageName, version).wait();
			}
		}).future<void>()();
	}

	private mapFrameworkFiles(npmCacheDirectoryPath: string, files: string[]): string[] {
		return _.map(files, file => file.substr(npmCacheDirectoryPath.length + constants.PROJECT_FRAMEWORK_FOLDER_NAME.length + 1));
	}
}
$injector.register("platformService", PlatformService);
