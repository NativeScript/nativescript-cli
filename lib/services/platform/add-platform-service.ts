import * as path from "path";
import * as temp from "temp";
import { PROJECT_FRAMEWORK_FOLDER_NAME, NativePlatformStatus } from "../../constants";
import { AddPlatformData } from "../workflow/workflow-data-service";
import { performanceLog } from "../../common/decorators";

export class AddPlatformService {
	constructor(
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager,
		private $pacoteService: IPacoteService,
		private $platformsData: IPlatformsData,
		private $projectChangesService: IProjectChangesService,
		private $projectDataService: IProjectDataService,
		private $terminalSpinnerService: ITerminalSpinnerService
	) { }

	public async addPlatform(projectData: IProjectData, addPlatformData: AddPlatformData): Promise<void> {
		const { platformParam, frameworkPath, nativePrepare } = addPlatformData;
		const [ platform, version ] = platformParam.toLowerCase().split("@");
		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		this.$logger.trace(`Creating NativeScript project for the ${platformData.platformNameLowerCase} platform`);
		this.$logger.trace(`Path: ${platformData.projectRoot}`);
		this.$logger.trace(`Package: ${projectData.projectIdentifiers[platformData.platformNameLowerCase]}`);
		this.$logger.trace(`Name: ${projectData.projectName}`);

		this.$logger.out("Copying template files...");

		const packageToInstall = await this.getPackageToInstall(platformData, projectData, frameworkPath, version);

		const installedPlatformVersion = await this.addPlatformSafe(platformData, projectData, packageToInstall, nativePrepare);

		this.$fs.ensureDirectoryExists(path.join(projectData.platformsDir, platform));
		this.$logger.out(`Platform ${platform} successfully added. v${installedPlatformVersion}`);
	}

	public async addPlatformIfNeeded(platformData: IPlatformData, projectData: IProjectData, addPlatformData: AddPlatformData): Promise<void> {
		const shouldAddPlatform = this.shouldAddPlatform(platformData, projectData, addPlatformData.nativePrepare);
		if (shouldAddPlatform) {
			await this.addPlatform(projectData, addPlatformData);
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
				version = this.getCurrentPlatformVersion(platformData.platformNameLowerCase, projectData) ||
					await this.$packageInstallationManager.getLatestCompatibleVersion(platformData.frameworkPackageName);
			}

			result = `${platformData.frameworkPackageName}@${version}`;
		}

		return result;
	}

	private async addPlatformSafe(platformData: IPlatformData, projectData: IProjectData, packageToInstall: string, nativePrepare: INativePrepare): Promise<string> {
		const spinner = this.$terminalSpinnerService.createSpinner();

		try {
			spinner.start();

			const frameworkDirPath = await this.extractPackage(packageToInstall);
			const frameworkPackageJsonContent = this.$fs.readJson(path.join(frameworkDirPath, "..", "package.json"));
			const frameworkVersion = frameworkPackageJsonContent.version;

			await this.addJSPlatform(platformData, projectData, frameworkDirPath, frameworkVersion);

			if (!nativePrepare || !nativePrepare.skipNativePrepare) {
				await this.addNativePlatform(platformData, projectData, frameworkDirPath, frameworkVersion);
			}

			return frameworkVersion;
		} catch (err) {
			const platformPath = path.join(projectData.platformsDir, platformData.platformNameLowerCase);
			this.$fs.deleteDirectory(platformPath);
			throw err;
		} finally {
			spinner.stop();
		}
	}

	private async extractPackage(pkg: string): Promise<string> {
		temp.track();
		const downloadedPackagePath = temp.mkdirSync("runtimeDir");
		await this.$pacoteService.extractPackage(pkg, downloadedPackagePath);
		const frameworkDir = path.join(downloadedPackagePath, PROJECT_FRAMEWORK_FOLDER_NAME);

		return path.resolve(frameworkDir);
	}

	// TODO: There is the same method in platformService. Consider to reuse it
	private getCurrentPlatformVersion(platform: string, projectData: IProjectData): string {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const currentPlatformData: any = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);
		const version = currentPlatformData && currentPlatformData.version;

		return version;
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

	private async addJSPlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void> {
		const frameworkPackageNameData = { version: frameworkVersion };
		this.$projectDataService.setNSValue(projectData.projectDir, platformData.frameworkPackageName, frameworkPackageNameData);
	}

	@performanceLog()
	private async addNativePlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void> {
		const config = <any>{};

		const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
		this.$fs.deleteDirectory(platformDir);

		await platformData.platformProjectService.createProject(path.resolve(frameworkDirPath), frameworkVersion, projectData, config);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await platformData.platformProjectService.interpolateData(projectData, config);
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);
		this.$projectChangesService.setNativePlatformStatus(platformData, { nativePlatformStatus: NativePlatformStatus.requiresPrepare });
	}
}
$injector.register("addPlatformService", AddPlatformService);
