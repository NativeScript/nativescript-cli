///<reference path="../.d.ts"/>

import path = require("path");
import shell = require("shelljs");
import util = require("util");
import constants = require("./../constants");
import helpers = require("./../common/helpers");
import options = require("./../options");

class PlatformsData implements IPlatformsData {
	private platformsData : { [index: string]: any } = {};

	constructor($androidProjectService: IPlatformProjectService,
		$iOSProjectService: IPlatformProjectService) {

		this.platformsData = {
			ios: $iOSProjectService.platformData,
			android: $androidProjectService.platformData
		}
	}

	public get platformsNames() {
		return Object.keys(this.platformsData);
	}

	public getPlatformData(platform: string): IPlatformData {
		return this.platformsData[platform];
	}
}
$injector.register("platformsData", PlatformsData);

export class PlatformService implements IPlatformService {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $npm: INodePackageManager,
		private $projectData: IProjectData,
		private $platformsData: IPlatformsData,
		private $devicesServices: Mobile.IDevicesServices) { }

	public addPlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			if(!platforms || platforms.length === 0) {
				this.$errors.fail("No platform specified. Please specify a platform to add");
			}

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

			// get path to downloaded framework package
			var frameworkDir = this.$npm.install(platformData.frameworkPackageName,
				path.join(this.$projectData.platformsDir, platform), version).wait();
			frameworkDir = path.join(frameworkDir, constants.PROJECT_FRAMEWORK_FOLDER_NAME);

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

			// Need to remove unneeded node_modules folder
			// One level up is the runtime module and one above is the node_modules folder.
			this.$fs.deleteDirectory(path.join(frameworkDir, "../../")).wait();

			platformData.platformProjectService.interpolateData(platformData.projectRoot).wait();
			platformData.platformProjectService.afterCreateProject(platformData.projectRoot).wait();
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

	public preparePlatform(platform: string): IFuture<void> {
		return (() => {
			this.validatePlatformInstalled(platform);
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
					this.processPlatformSpecificFiles(platform, helpers.enumerateFilesInDirectorySync(path.join(appFilesLocation, d))).wait();
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
			this.validatePlatformInstalled(platform);
			platform = platform.toLowerCase();

			var platformData = this.$platformsData.getPlatformData(platform);
			platformData.platformProjectService.buildProject(platformData.projectRoot).wait();
			this.$logger.out("Project successfully built");
		}).future<void>()();
	}

	public runPlatform(platform: string): IFuture<void> {
		return (() => {
			this.validatePlatformInstalled(platform);
			platform = platform.toLowerCase();

			this.preparePlatform(platform).wait();
			if(options.emulator) {
				this.deployOnEmulator(platform).wait();
			} else {
				this.deployOnDevice(platform).wait();
			}
		}).future<void>()();
	}

	public removePlatforms(platforms: string[]): IFuture<void> {
		return (() => {
			if(!platforms || platforms.length === 0) {
				this.$errors.fail("No platform specified. Please specify a platform to remove");
			}

			_.each(platforms, platform => {
				this.validatePlatformInstalled(platform);

				var platformDir = path.join(this.$projectData.platformsDir, platform);
				this.$fs.deleteDirectory(platformDir).wait();
			});

		}).future<void>()();
	}

	public deployOnDevice(platform: string): IFuture<void> {
		return (() => {
			this.validatePlatformInstalled(platform);
			platform = platform.toLowerCase();

			var platformData = this.$platformsData.getPlatformData(platform);

			// We need to build for device
			var cachedDeviceOption = options.device;
			options.device = true;
			this.buildPlatform(platform).wait();
			options.device = cachedDeviceOption;

			// Get latest package that is produced from build
			var packageFile = this.getLatestApplicationPackageForDevice(platformData).wait().packageName;
			this.$logger.out("Using ", packageFile);

			this.$devicesServices.initialize(platform, options.device).wait();
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

			this.buildPlatform(platform).wait();

			var packageFile = this.getLatestApplicationPackageForEmulator(platformData).wait().packageName;
			this.$logger.out("Using ", packageFile);

			var logFilePath = path.join(platformData.projectRoot, this.$projectData.projectName, "emulator.log");

			emulatorServices.startEmulator(packageFile, {image: options.emulator, stderrFilePath: logFilePath, stdoutFilePath: logFilePath }).wait();
		}).future<void>()();
	}

	private validatePlatform(platform: string): void {
		if(!platform) {
			this.$errors.fail("No platform specified.")
		}

		platform = platform.toLowerCase();

		if (!this.isValidPlatform(platform)) {
			this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(this.$platformsData.platformsNames));
		}

		if (!this.isPlatformSupportedForOS(platform)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", platform, process.platform);
		}
	}

	private validatePlatformInstalled(platform: string): void {
		this.validatePlatform(platform);

		if (!this.isPlatformInstalled(platform).wait()) {
			this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
		}
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

	private getLatestApplicationPackageForDevice(platformData: IPlatformData) {
		return this.getLatestApplicationPackage(platformData.deviceBuildOutputPath, platformData.validPackageNamesForDevice);
	}

	private getLatestApplicationPackageForEmulator(platformData: IPlatformData) {
		return this.getLatestApplicationPackage(platformData.emulatorBuildOutputPath || platformData.deviceBuildOutputPath, platformData.validPackageNamesForEmulator || platformData.validPackageNamesForDevice);
	}
}
$injector.register("platformService", PlatformService);
