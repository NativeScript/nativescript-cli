import * as path from "path";
import * as temp from "temp";
import { PROJECT_FRAMEWORK_FOLDER_NAME, NativePlatformStatus } from "../../constants";
import { performanceLog } from "../../common/decorators";

export class AddPlatformService {
	constructor(
		private $fs: IFileSystem,
		private $pacoteService: IPacoteService,
		private $projectChangesService: IProjectChangesService,
		private $projectDataService: IProjectDataService,
		private $terminalSpinnerService: ITerminalSpinnerService
	) { }

	public async addPlatformSafe(projectData: IProjectData, platformData: IPlatformData, packageToInstall: string, nativePrepare: INativePrepare): Promise<string> {
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

	private async addJSPlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void> {
		const frameworkPackageNameData = { version: frameworkVersion };
		this.$projectDataService.setNSValue(projectData.projectDir, platformData.frameworkPackageName, frameworkPackageNameData);
	}

	@performanceLog()
	private async addNativePlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void> {
		const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
		this.$fs.deleteDirectory(platformDir);

		await platformData.platformProjectService.createProject(path.resolve(frameworkDirPath), frameworkVersion, projectData);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await platformData.platformProjectService.interpolateData(projectData);
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);
		this.$projectChangesService.setNativePlatformStatus(platformData, { nativePlatformStatus: NativePlatformStatus.requiresPrepare });
	}
}
$injector.register("addPlatformService", AddPlatformService);
