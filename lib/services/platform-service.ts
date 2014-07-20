///<reference path="../.d.ts"/>

import path = require("path");
import util = require("util");
import helpers = require("./../common/helpers");

class PlatformsData implements IPlatformsData {
	private platformsData: { [key: string]: IPlatformData } = {
		ios: {
			frameworkPackageName: "tns-ios",
			platformProjectService: $injector.resolve("iOSProjectService"),
			projectRoot: "",
			targetedOS: ['darwin']
		},
		android: {
			frameworkPackageName: "tns-android",
			platformProjectService: $injector.resolve("androidProjectService"),
			projectRoot: ""
		}
	};

	constructor($projectData: IProjectData) {
		this.platformsData["ios"].projectRoot = "";
		this.platformsData["android"].projectRoot = path.join($projectData.platformsDir, "android");
	}

	public get platformsNames() {
		return Object.keys(this.platformsData);
	}

	public getPlatformData(platform): IPlatformData {
		return this.platformsData[platform];
	}
}
$injector.register("platformsData", PlatformsData);

export class PlatformService implements IPlatformService {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $projectService: IProjectService,
		private $platformProjectService: IPlatformProjectService,
		private $projectData: IProjectData,
		private $platformsData: IPlatformsData) {
	}

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
			platform = platform.split("@")[0];

			this.validatePlatform(platform, true);

			var platformPath = path.join(this.$projectData.platformsDir, platform);

			// TODO: Check for version compatability if the platform is in format platform@version. This should be done in PR for semanting versioning

			if (this.$fs.exists(platformPath).wait()) {
				this.$errors.fail("Platform %s already added", platform);
			}

			// Copy platform specific files in platforms dir
			this.$platformProjectService.createProject(platform).wait();

		}).future<void>()();
	}

	public getInstalledPlatforms(): IFuture<string[]> {
		return(() => {
			if(!this.$fs.exists(this.$projectData.platformsDir).wait()) {
				return [];
			}

			var subDirs = this.$fs.readDirectory(this.$projectData.platformsDir).wait();
			return _.filter(subDirs, p => { return this.$platformsData.platformsNames.indexOf(p) > -1; });
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

	public runPlatform(platform: string): IFuture<void> {
		return (() => {

		}).future<void>()();
	}

	public preparePlatform(platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();

			this.validatePlatform(platform);

			var normalizedPlatformName = this.normalizePlatformName(platform);

			this.$platformProjectService.prepareProject(normalizedPlatformName, this.$platformsData.platformsNames).wait();
		}).future<void>()();
	}

	public buildPlatform(platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			this.validatePlatform(platform);

			this.$platformProjectService.buildProject(platform).wait();
		}).future<void>()();
	}

	private validatePlatform(platform: string, skipIsPlatformInstalledCheck?: boolean): void {
		if (!this.isValidPlatform(platform)) {
			this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(this.$platformsData.platformsNames));
		}

		if (!this.isPlatformSupportedForOS(platform)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", platform, process.platform);
		}

		if(!skipIsPlatformInstalledCheck) {
			if (!this.isPlatformInstalled(platform).wait()) {
				this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
			}
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

	private normalizePlatformName(platform: string): string {
		switch(platform) {
			case "android":
				return "Android";
			case "ios":
				return "iOS";
		}

		return undefined;
	}
}
$injector.register("platformService", PlatformService);
