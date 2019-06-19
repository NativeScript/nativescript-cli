import { NativePlatformStatus } from "../constants";
import * as path from "path";

export class PlatformController implements IPlatformController {
	constructor(
		private $addPlatformService: IAddPlatformService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager,
		private $projectDataService: IProjectDataService,
		private $platformsDataService: IPlatformsDataService,
		private $projectChangesService: IProjectChangesService,
	) { }

	public async addPlatform(addPlatformData: IAddPlatformData): Promise<void> {
		const [ platform, version ] = addPlatformData.platform.toLowerCase().split("@");
		const projectData = this.$projectDataService.getProjectData(addPlatformData.projectDir);
		const platformData = this.$platformsDataService.getPlatformData(platform, projectData);

		this.$logger.trace(`Creating NativeScript project for the ${platform} platform`);
		this.$logger.trace(`Path: ${platformData.projectRoot}`);
		this.$logger.trace(`Package: ${projectData.projectIdentifiers[platform]}`);
		this.$logger.trace(`Name: ${projectData.projectName}`);

		this.$logger.info("Copying template files...");

		const packageToInstall = await this.getPackageToInstall(platformData, projectData, addPlatformData.frameworkPath, version);

		const installedPlatformVersion = await this.$addPlatformService.addPlatformSafe(projectData, platformData, packageToInstall, addPlatformData.nativePrepare);

		this.$fs.ensureDirectoryExists(path.join(projectData.platformsDir, platform));
		this.$logger.info(`Platform ${platform} successfully added. v${installedPlatformVersion}`);
	}

	public async addPlatformIfNeeded(addPlatformData: IAddPlatformData): Promise<void> {
		const [ platform ] = addPlatformData.platform.toLowerCase().split("@");
		const projectData = this.$projectDataService.getProjectData(addPlatformData.projectDir);
		const platformData = this.$platformsDataService.getPlatformData(platform, projectData);

		const shouldAddPlatform = this.shouldAddPlatform(platformData, projectData, addPlatformData.nativePrepare);
		if (shouldAddPlatform) {
			await this.addPlatform(addPlatformData);
		}
	}

	private async getPackageToInstall(platformData: IPlatformData, projectData: IProjectData, frameworkPath?: string, version?: string): Promise<string> {
		let result = null;
		if (frameworkPath) {
			if (!this.$fs.exists(frameworkPath)) {
				this.$errors.fail(`Invalid frameworkPath: ${frameworkPath}. Please ensure the specified frameworkPath exists.`);
			}
			result = path.resolve(frameworkPath);
		} else {
			if (!version) {
				const currentPlatformData = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
				version = (currentPlatformData && currentPlatformData.version) ||
					await this.$packageInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
			}

			result = `${platformData.frameworkPackageName}@${version}`;
		}

		return result;
	}

	private shouldAddPlatform(platformData: IPlatformData, projectData: IProjectData, nativePrepare: INativePrepare): boolean {
		const platformName = platformData.platformNameLowerCase;
		const hasPlatformDirectory = this.$fs.exists(path.join(projectData.platformsDir, platformName));
		const shouldAddNativePlatform = !nativePrepare || !nativePrepare.skipNativePrepare;
		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformData);
		const requiresNativePlatformAdd = prepareInfo && prepareInfo.nativePlatformStatus === NativePlatformStatus.requiresPlatformAdd;
		const result = !hasPlatformDirectory || (shouldAddNativePlatform && requiresNativePlatformAdd);

		return !!result;
	}
}
$injector.register("platformController", PlatformController);
