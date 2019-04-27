import * as path from "path";
import * as temp from "temp";
import { PROJECT_FRAMEWORK_FOLDER_NAME } from "../../constants";

export class PlatformAddService implements IPlatformAddService {
	constructor(
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager,
		private $pacoteService: IPacoteService,
		private $platformsData: IPlatformsData,
		private $platformJSService: IPreparePlatformService,
		private $platformNativeService: IPreparePlatformService,
		private $projectDataService: IProjectDataService,
		private $terminalSpinnerService: ITerminalSpinnerService
	) { }

	public async addPlatform(addPlatformData: IAddPlatformData, projectData: IProjectData): Promise<void> {
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

			await this.$platformJSService.addPlatform(platformData, projectData, frameworkDirPath, frameworkVersion);

			if (!nativePrepare || !nativePrepare.skipNativePrepare) {
				await this.$platformNativeService.addPlatform(platformData, projectData, frameworkDirPath, frameworkVersion);
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
}
$injector.register("platformAddService", PlatformAddService);
