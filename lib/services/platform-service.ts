///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import shell = require("shelljs");
import util = require("util");
import constants = require("./../constants");
import helpers = require("./../common/helpers");
import options = require("./../common/options");
import semver = require("semver");

export class PlatformService implements IPlatformService {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npm: INodePackageManager,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $prompter: IPrompter) { }

	public addPlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			var platformsDir = this.$projectData.platformsDir;
			this.$fs.ensureDirectoryExists(platformsDir).wait();

			_.each(platforms, platform => {
				this.addPlatform(platform.toLowerCase()).wait();
			});

		}).future<void>()();
	}

	private addPlatform(platform: string): IFuture<void> {
		return(() => {
			var parts = platform.split("@");
			platform = parts[0];
			var version = parts[1];

			this.validatePlatform(platform);

			var platformPath = path.join(this.$projectData.platformsDir, platform);

			if (this.$fs.exists(platformPath).wait()) {
				this.$errors.fail("Platform %s already added", platform);
			}

			var platformData = this.$platformsData.getPlatformData(platform);

			// Copy platform specific files in platforms dir
			var platformProjectService = platformData.platformProjectService;
			platformProjectService.validate().wait();

			// Log the values for project
			this.$logger.trace("Creating NativeScript project for the %s platform", platform);
			this.$logger.trace("Path: %s", platformData.projectRoot);
			this.$logger.trace("Package: %s", this.$projectData.projectId);
			this.$logger.trace("Name: %s", this.$projectData.projectName);

			this.$logger.out("Copying template files...");

			var packageToInstall = "";
			var npmOptions: IStringDictionary = {
				pathToSave: path.join(this.$projectData.platformsDir, platform)
			};

			if(options.frameworkPath) {
				packageToInstall = options.frameworkPath;
			} else {
				packageToInstall = platformData.frameworkPackageName;
				npmOptions["version"] = version;
			}

			var downloadedPackagePath = this.$npm.install(packageToInstall, npmOptions).wait();
			var frameworkDir = path.join(downloadedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME);
			frameworkDir = path.resolve(frameworkDir);

			try {
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
			platformData.platformProjectService.createProject(platformData.projectRoot, frameworkDir).wait();
			var installedVersion = this.$fs.readJson(path.join(frameworkDir, "../", "package.json")).wait().version;

			if(options.frameworkPath && this.$fs.getFsStats(options.frameworkPath).wait().isFile() && !options.symlink) {
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

			var subDirs = this.$fs.readDirectory(this.$projectData.platformsDir).wait();
			return _.filter(subDirs, p => this.$platformsData.platformsNames.indexOf(p) > -1);
		}).future<string[]>()();
	}

	public getAvailablePlatforms(): IFuture<string[]> {
		return (() => {
			var installedPlatforms = this.getInstalledPlatforms().wait();
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
			platform = platform.toLowerCase();

			var platformData = this.$platformsData.getPlatformData(platform);
			var platformProjectService = platformData.platformProjectService;

			var appFilesLocation = platformProjectService.prepareProject(platformData).wait();

			var appDirectoryPath = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);
			var contents = this.$fs.readDirectory(appDirectoryPath).wait();
			var files: string[] = [];

			_.each(contents, d => {
				var fsStat = this.$fs.getFsStats(path.join(appDirectoryPath, d)).wait();
				if(fsStat.isDirectory() && d !== constants.APP_RESOURCES_FOLDER_NAME) {
					this.processPlatformSpecificFiles(platform, this.$fs.enumerateFilesInDirectorySync(path.join(appFilesLocation, d))).wait();
				} else if(fsStat.isFile()) {
					files.push(path.join(appFilesLocation,d));
				}
			});

			this.processPlatformSpecificFiles(platform, files).wait();

			this.$logger.out("Project successfully prepared");

		}).future<void>()();
	}

	public buildPlatform(platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			this.preparePlatform(platform).wait();

			var platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.buildProject(platformData.projectRoot).wait();
			this.$logger.out("Project successfully built");
		}).future<void>()();
	}

	public runPlatform(platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();

			this.preparePlatform(platform).wait();
			if (options.emulator) {
				this.deployOnEmulator(platform).wait();
			} else {
				this.deployOnDevice(platform).wait();
			}
		}).future<void>()();
	}

	public removePlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			_.each(platforms, platform => {
				this.validatePlatformInstalled(platform);

				var platformDir = path.join(this.$projectData.platformsDir, platform);
				this.$fs.deleteDirectory(platformDir).wait();
			});

		}).future<void>()();
	}

	public updatePlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			_.each(platforms, platform => {
				var parts = platform.split("@");
				platform = parts[0].toLowerCase();
				var version = parts[1];

				this.validatePlatformInstalled(platform);
				this.updatePlatform(platform, version).wait();
			});
		}).future<void>()();
	}

	public deployOnDevice(platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();

			var platformData = this.$platformsData.getPlatformData(platform);

			var cachedDeviceOption = options.forDevice;
			options.forDevice = true;
			this.buildPlatform(platform).wait();
			options.forDevice = cachedDeviceOption;

			// Get latest package that is produced from build
			var packageFile = this.getLatestApplicationPackageForDevice(platformData).wait().packageName;
			this.$logger.out("Using ", packageFile);

			this.$devicesServices.initialize({platform: platform, deviceId: options.device}).wait();
			var action = (device: Mobile.IDevice): IFuture<void> => { return device.deploy(packageFile, this.$projectData.projectId); };
			this.$devicesServices.execute(action).wait();

		}).future<void>()();
	}

	public deployOnEmulator(platform: string): IFuture<void> {
		return (() => {
			this.validatePlatformInstalled(platform);
			platform = platform.toLowerCase();

			var platformData = this.$platformsData.getPlatformData(platform);
			var emulatorServices = platformData.emulatorServices;

			emulatorServices.checkAvailability().wait();
			emulatorServices.checkDependencies().wait();

			if(!options.availableDevices) {
				this.buildPlatform(platform).wait();

				var packageFile = this.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
				this.$logger.out("Using ", packageFile);

				var logFilePath = path.join(platformData.projectRoot, this.$projectData.projectName, "emulator.log");
			}

			emulatorServices.startEmulator(packageFile, { stderrFilePath: logFilePath, stdoutFilePath: logFilePath, appId: this.$projectData.projectId }).wait();
		}).future<void>()();
	}

	public validatePlatform(platform: string): void {
		if(!platform) {
			this.$errors.fail("No platform specified.")
		}

		var parts = platform.split("@");
		platform = parts[0].toLowerCase();

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
				this.$errors.fail("The path %s does not exist", libraryPath);
			} else {
				var platformData = this.$platformsData.getPlatformData(platform);
				platformData.platformProjectService.addLibrary(platformData, libraryPath).wait();
			}
		}).future<void>()();
	}

	private isValidPlatform(platform: string) {
		return this.$platformsData.getPlatformData(platform);
	}

	private isPlatformSupportedForOS(platform: string): boolean {
		var targetedOS = this.$platformsData.getPlatformData(platform).targetedOS;

		if(!targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0) {
			return true;
		}

		return false;
	}

	private isPlatformInstalled(platform: string): IFuture<boolean> {
		return (() => {
			return this.$fs.exists(path.join(this.$projectData.platformsDir, platform)).wait();
		}).future<boolean>()();
	}

	private isPlatformPrepared(platform: string): IFuture<boolean> {
		var platformData = this.$platformsData.getPlatformData(platform);
		return platformData.platformProjectService.isPlatformPrepared(platformData.projectRoot);
	}

	private static parsePlatformSpecificFileName(fileName: string, platforms: string[]): any {
		var regex = util.format("^(.+?)\.(%s)(\..+?)$", platforms.join("|"));
		var parsed = fileName.toLowerCase().match(new RegExp(regex, "i"));
		if (parsed) {
			return {
				platform: parsed[2],
				onDeviceName: parsed[1] + parsed[3]
			};
		}
		return undefined;
	}

	private processPlatformSpecificFiles( platform: string, files: string[]): IFuture<void> {
		// Renames the files that have `platform` as substring and removes the files from other platform
		return (() => {
			_.each(files, fileName => {
				var platformInfo = PlatformService.parsePlatformSpecificFileName(path.basename(fileName), this.$platformsData.platformsNames);
				var shouldExcludeFile = platformInfo && platformInfo.platform !== platform;
				if (shouldExcludeFile) {
					this.$fs.deleteFile(fileName).wait();
				} else if (platformInfo && platformInfo.onDeviceName) {
					this.$fs.rename(fileName, path.join(path.dirname(fileName), platformInfo.onDeviceName)).wait();
				}
			});
		}).future<void>()();
	}

	private getApplicationPackages(buildOutputPath: string, validPackageNames: string[]): IFuture<IApplicationPackage[]> {
		return (() => {
			// Get latest package that is produced from build
			var candidates = this.$fs.readDirectory(buildOutputPath).wait();
			var packages = _.filter(candidates, candidate => {
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
			var packages = this.getApplicationPackages(buildOutputPath, validPackageNames).wait();
			if (packages.length === 0) {
				var packageExtName = path.extname(validPackageNames[0]);
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
			var platformData = this.$platformsData.getPlatformData(platform);

			this.$projectDataService.initialize(this.$projectData.projectDir);
			var data = this.$projectDataService.getValue(platformData.frameworkPackageName).wait();
			var currentVersion = data && data.version ? data.version : "0.2.0";
			var newVersion = version || this.$npm.getLatestVersion(platformData.frameworkPackageName).wait();

			if(platformData.platformProjectService.canUpdatePlatform(currentVersion, newVersion).wait()) {

				if(!semver.valid(newVersion)) {
					this.$errors.fail("The version %s is not valid. The version should consists from 3 parts separated by dot.", newVersion);
				}

				if(semver.gt(currentVersion, newVersion)) { // Downgrade
					var isUpdateConfirmed = this.$prompter.confirm(util.format("You are going to downgrade to android runtime v.%s. Are you sure?", newVersion), () => "n").wait();
					if(isUpdateConfirmed) {
						this.updatePlatformCore(platformData, currentVersion, newVersion).wait();
					}
				} else if(semver.eq(currentVersion, newVersion)) {
					this.$errors.fail("Current and new version are the same.");
				} else {
					this.updatePlatformCore(platformData, currentVersion, newVersion).wait();
				}
			} else {
				var isUpdateConfirmed = this.$prompter.confirm(util.format("We need to override xcodeproj file. The old one will be saved at %s. Are you sure?", options.profileDir), () => "y").wait();
				if(isUpdateConfirmed) {
					platformData.platformProjectService.updatePlatform(currentVersion, newVersion).wait();
					this.updatePlatformCore(platformData, currentVersion, newVersion).wait();
				}
			}

		}).future<void>()();
	}

	private updatePlatformCore(platformData: IPlatformData, currentVersion: string, newVersion: string): IFuture<void> {
		return (() => {
			// Remove old framework files
			var oldFrameworkData =  this.getFrameworkFiles(platformData, currentVersion).wait();

			_.each(oldFrameworkData.frameworkFiles, file => {
				var fileToDelete = path.join(platformData.projectRoot, file);
				this.$logger.trace("Deleting %s", fileToDelete);
				this.$fs.deleteFile(fileToDelete).wait();
			});

			_.each(oldFrameworkData.frameworkDirectories, dir => {
				var dirToDelete = path.join(platformData.projectRoot, dir);
				this.$logger.trace("Deleting %s", dirToDelete);
				this.$fs.deleteDirectory(dirToDelete).wait();
			});

			// Add new framework files
			var newFrameworkData = this.getFrameworkFiles(platformData, newVersion).wait();
			var cacheDirectoryPath = this.$npm.getCachedPackagePath(platformData.frameworkPackageName, newVersion);

			_.each(newFrameworkData.frameworkFiles, file => {
				var sourceFile = path.join(cacheDirectoryPath, constants.PROJECT_FRAMEWORK_FOLDER_NAME, file);
				var destinationFile = path.join(platformData.projectRoot, file);
				this.$logger.trace("Replacing %s with %s", sourceFile, destinationFile);
				shell.cp("-f", sourceFile, destinationFile);
			});

			_.each(newFrameworkData.frameworkDirectories, dir => {
				var sourceDirectory = path.join(cacheDirectoryPath, constants.PROJECT_FRAMEWORK_FOLDER_NAME, dir);
				var destinationDirectory = path.join(platformData.projectRoot, dir);
				this.$logger.trace("Copying %s to %s", sourceDirectory, destinationDirectory);
				shell.cp("-fR", path.join(sourceDirectory, "*"), destinationDirectory);
			});

			// Update .tnsproject file
			this.$projectDataService.initialize(this.$projectData.projectDir);
			this.$projectDataService.setValue(platformData.frameworkPackageName, {version: newVersion}).wait();

			this.$logger.out("Successfully updated to version ", newVersion);

		}).future<void>()();
	}

	private getFrameworkFiles(platformData: IPlatformData, version: string): IFuture<any> {
		return (() => {
			var cachedPackagePath = this.$npm.getCachedPackagePath(platformData.frameworkPackageName, version);
			this.ensurePackageIsCached(cachedPackagePath, platformData.frameworkPackageName, version).wait();

			var allFiles = this.$fs.enumerateFilesInDirectorySync(cachedPackagePath);
			var filteredFiles = _.filter(allFiles, file => _.contains(platformData.frameworkFilesExtensions, path.extname(file)));

			var allFrameworkDirectories = _.map(this.$fs.readDirectory(path.join(cachedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME)).wait(), dir => path.join(cachedPackagePath, constants.PROJECT_FRAMEWORK_FOLDER_NAME, dir));
			var filteredFrameworkDirectories = _.filter(allFrameworkDirectories, dir => this.$fs.getFsStats(dir).wait().isDirectory() && (_.contains(platformData.frameworkFilesExtensions, path.extname(dir)) || _.contains(platformData.frameworkDirectoriesNames, path.basename(dir))));

			return {
				frameworkFiles: this.mapFrameworkFiles(cachedPackagePath, filteredFiles),
				frameworkDirectories: this.mapFrameworkFiles(cachedPackagePath, filteredFrameworkDirectories)
			}

		}).future<any>()();
	}

	private ensurePackageIsCached(cachedPackagePath: string, packageName: string, version: string): IFuture<void> {
		return (() => {
			if(!this.$fs.exists(cachedPackagePath).wait()) {
				this.$npm.addToCache(packageName, version).wait();
			}
		}).future<void>()();
	}

	private mapFrameworkFiles(npmCacheDirectoryPath: string, files: string[]): string[] {
		return _.map(files, file => file.substr(npmCacheDirectoryPath.length + constants.PROJECT_FRAMEWORK_FOLDER_NAME.length + 1))
	}
}
$injector.register("platformService", PlatformService);
