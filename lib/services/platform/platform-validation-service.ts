import * as helpers from "../../common/helpers";
import * as path from "path";
import { IPlatformValidationService } from "../../declarations";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import { IErrors, IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";

export class PlatformValidationService implements IPlatformValidationService {
	constructor(
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsDataService: IPlatformsDataService
	) {}

	public isValidPlatform(platform: string, projectData: IProjectData): boolean {
		if (!platform) {
			return false;
		}

		platform = platform.split("@")[0].toLowerCase();
		if (!this.$platformsDataService.getPlatformData(platform, projectData)) {
			return false;
		}

		return true;
	}

	public validatePlatform(platform: string, projectData: IProjectData): void {
		if (!platform) {
			this.$errors.failWithHelp("No platform specified.");
		}

		if (!this.isValidPlatform(platform, projectData)) {
			const platformNames = helpers.formatListOfNames(
				this.$mobileHelper.platformNames
			);
			this.$errors.fail(
				`Invalid platform ${platform}. Valid platforms are ${platformNames}.`
			);
		}
	}

	public validatePlatformInstalled(
		platform: string,
		projectData: IProjectData
	): void {
		this.validatePlatform(platform, projectData);

		const hasPlatformDirectory = this.$fs.exists(
			path.join(projectData.platformsDir, platform.toLowerCase())
		);
		if (!hasPlatformDirectory) {
			this.$errors.fail(
				"The platform %s is not added to this project. Please use 'ns platform add <platform>'",
				platform
			);
		}
	}

	public async validateOptions(
		provision: true | string,
		teamId: true | string,
		projectData: IProjectData,
		platform?: string,
		aab?: boolean
	): Promise<boolean> {
		if (platform && !this.$mobileHelper.isAndroidPlatform(platform) && aab) {
			this.$errors.fail(
				"The --aab option is supported only for the Android platform."
			);
		}

		if (platform) {
			platform = this.$mobileHelper.normalizePlatformName(platform);
			this.$logger.trace("Validate options for platform: " + platform);
			const platformData = this.$platformsDataService.getPlatformData(
				platform,
				projectData
			);

			const result = await platformData.platformProjectService.validateOptions(
				projectData.projectIdentifiers[platform.toLowerCase()],
				provision,
				teamId
			);

			return result;
		} else {
			let valid = true;
			const platforms = this.$mobileHelper.platformNames.map((p) =>
				p.toLowerCase()
			);
			for (const availablePlatform of platforms) {
				this.$logger.trace(
					"Validate options for platform: " + availablePlatform
				);
				const platformData = this.$platformsDataService.getPlatformData(
					availablePlatform,
					projectData
				);
				valid =
					valid &&
					(await platformData.platformProjectService.validateOptions(
						projectData.projectIdentifiers[availablePlatform.toLowerCase()],
						provision,
						teamId
					));
			}

			return valid;
		}
	}

	public isPlatformSupportedForOS(
		platform: string,
		projectData: IProjectData
	): boolean {
		const targetedOS = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		).targetedOS;
		const res =
			!targetedOS ||
			targetedOS.indexOf("*") >= 0 ||
			targetedOS.indexOf(process.platform) >= 0;
		return res;
	}
}
injector.register("platformValidationService", PlatformValidationService);
