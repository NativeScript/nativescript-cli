import * as helpers from "../../common/helpers";
import * as path from "path";

export class PlatformValidationService implements IPlatformValidationService {

	constructor(
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsDataService: IPlatformsDataService
	) { }

	public validatePlatform(platform: string, projectData: IProjectData): void {
		if (!platform) {
			this.$errors.fail("No platform specified.");
		}

		platform = platform.split("@")[0].toLowerCase();

		if (!this.$platformsDataService.getPlatformData(platform, projectData)) {
			const platformNames = helpers.formatListOfNames(this.$platformsDataService.platformsNames);
			this.$errors.fail(`Invalid platform ${platform}. Valid platforms are ${platformNames}.`);
		}
	}

	public validatePlatformInstalled(platform: string, projectData: IProjectData): void {
		this.validatePlatform(platform, projectData);

		const hasPlatformDirectory = this.$fs.exists(path.join(projectData.platformsDir, platform.toLowerCase()));
		if (!hasPlatformDirectory) {
			this.$errors.fail("The platform %s is not added to this project. Please use 'tns platform add <platform>'", platform);
		}
	}

	public async validateOptions(provision: true | string, teamId: true | string, projectData: IProjectData, platform?: string, aab?: boolean): Promise<boolean> {
		if (platform && !this.$mobileHelper.isAndroidPlatform(platform) && aab) {
			this.$errors.failWithoutHelp("The --aab option is supported only for the Android platform.");
		}

		if (platform) {
			platform = this.$mobileHelper.normalizePlatformName(platform);
			this.$logger.trace("Validate options for platform: " + platform);
			const platformData = this.$platformsDataService.getPlatformData(platform, projectData);

			const result = await platformData.platformProjectService.validateOptions(
				projectData.projectIdentifiers[platform.toLowerCase()],
				provision,
				teamId
			);

			return result;
		} else {
			let valid = true;
			for (const availablePlatform in this.$platformsDataService.availablePlatforms) {
				this.$logger.trace("Validate options for platform: " + availablePlatform);
				const platformData = this.$platformsDataService.getPlatformData(availablePlatform, projectData);
				valid = valid && await platformData.platformProjectService.validateOptions(
					projectData.projectIdentifiers[availablePlatform.toLowerCase()],
					provision,
					teamId
				);
			}

			return valid;
		}
	}

	public isPlatformSupportedForOS(platform: string, projectData: IProjectData): boolean {
		const targetedOS = this.$platformsDataService.getPlatformData(platform, projectData).targetedOS;
		const res = !targetedOS || targetedOS.indexOf("*") >= 0 || targetedOS.indexOf(process.platform) >= 0;
		return res;
	}
}
$injector.register("platformValidationService", PlatformValidationService);
