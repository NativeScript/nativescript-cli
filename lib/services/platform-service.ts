///<reference path="../.d.ts"/>

import path = require("path");
import helpers = require("./../common/helpers");

export class PlatformService implements IPlatformService {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $projectService: IProjectService) { }

	private platformCapabilities: { [key: string]: IPlatformCapabilities } = {
		ios: {
			targetedOS: ['darwin'],
			frameworkUrl: ""
		},
		android: {
			frameworkUrl: ""
		}
	};

	public getCapabilities(platform: string): IPlatformCapabilities {
		return this.platformCapabilities[platform];
	}

	public addPlatforms(platforms: string[]): IFuture<any> {
		return (() => {
			this.$projectService.ensureProject();

			if(!platforms || platforms.length === 0) {
				this.$errors.fail("No platform specified. Please specify a platform to add");
			}

			var platformsDir = this.$projectService.projectData.platformsDir;
			if(!this.$fs.exists(platformsDir).wait()) {
				this.$fs.createDirectory(platformsDir).wait();
			}

			_.each(platforms, platform => {
				this.addPlatform(platform.toLowerCase()).wait();
			});

		}).future<any>()();
	}

	public getInstalledPlatforms(): IFuture<string[]> {
		return(() => {
			if(!this.$fs.exists(this.$projectService.projectData.platformsDir).wait()) {
				return [];
			}

			var subDirs = this.$fs.readDirectory(this.$projectService.projectData.platformsDir).wait();
			return _.filter(subDirs, p => { return Object.keys(this.platformCapabilities).indexOf(p) > -1; });
		}).future<string[]>()();
	}

	public getAvailablePlatforms(): IFuture<string[]> {
		return (() => {
			var installedPlatforms = this.getInstalledPlatforms().wait();
			return _.filter(_.keys(this.platformCapabilities), p => {
				return installedPlatforms.indexOf(p) < 0 && this.isPlatformSupportedForOS(p); // Only those not already installed
			});
		}).future<string[]>()();
	}

	private addPlatform(platform: string): IFuture<void> {
		return(() => {
			platform = platform.split("@")[0];
			var platformPath = path.join(this.$projectService.projectData.platformsDir, platform);

			// TODO: Check for version compatability if the platform is in format platform@version. This should be done in PR for semanting versioning

			if (!this.isValidPlatform(platform)) {
				this.$errors.fail("Invalid platform %s. Valid platforms are %s.", platform, helpers.formatListOfNames(_.keys(this.platformCapabilities)));
			}

			if (!this.isPlatformSupportedForOS(platform)) {
				this.$errors.fail("Applications for platform %s can not be built on this OS - %s", platform, process.platform);
			}

			if (this.$fs.exists(platformPath).wait()) {
				this.$errors.fail("Platform %s already added", platform);
			}

			// Copy platform specific files in platforms dir
			this.$projectService.createPlatformSpecificProject(platform).wait();

		}).future<void>()();
	}

	private isValidPlatform(platform: string) {
		return this.platformCapabilities[platform];
	}

	private isPlatformSupportedForOS(platform: string): boolean {
		var platformCapabilities = this.getCapabilities(platform);
		var targetedOS = platformCapabilities.targetedOS;

		if(!targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0) {
			return true;
		}

		return false;
	}
}
$injector.register("platformService", PlatformService);