import * as path from "path";
import { PROJECT_FRAMEWORK_FOLDER_NAME, TrackActionNames, AnalyticsEventLabelDelimiter } from "../../constants";
import { performanceLog } from "../../common/decorators";
import { IAddPlatformService, IPlatformData, IAddPlatformData } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";//IProjectDataService
import { IFileSystem, IAnalyticsService } from "../../common/declarations";
import { injector } from "../../common/yok";
import { IPackageManager } from "../../declarations";

export class AddPlatformService implements IAddPlatformService {
	constructor(
		private $fs: IFileSystem,
		private $pacoteService: IPacoteService,
    // private $projectDataService: IProjectDataService,
    private $packageManager: IPackageManager,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $analyticsService: IAnalyticsService,
		private $tempService: ITempService
	) { }

	public async addPlatformSafe(projectData: IProjectData, platformData: IPlatformData, packageToInstall: string, addPlatformData: IAddPlatformData): Promise<string> {
		const spinner = this.$terminalSpinnerService.createSpinner();

		try {
      spinner.start();

      let frameworkDirPath: string;
      let frameworkVersion: string;
      if (addPlatformData.frameworkPath) {
        frameworkDirPath = await this.extractPackage(packageToInstall);
  			const frameworkPackageJsonContent = this.$fs.readJson(path.join(frameworkDirPath, "..", "package.json"));
  			frameworkVersion = frameworkPackageJsonContent.version;

  			await this.setPlatformVersion(platformData, projectData, frameworkVersion);
  			await this.trackPlatformVersion(frameworkVersion, platformData);
      } else {
        const [ name, version ] = packageToInstall.split('@');
        frameworkDirPath = path.join(projectData.projectDir, 'node_modules', name, PROJECT_FRAMEWORK_FOLDER_NAME);
        frameworkVersion = version;
        if (!projectData.devDependencies) {
          projectData.devDependencies = {};
        }
        if (!projectData.devDependencies[name]) {
          await this.setPlatformVersion(platformData, projectData, version);
        }
        await this.trackPlatformVersion(version, platformData);
      }
      
			if (!addPlatformData.nativePrepare || !addPlatformData.nativePrepare.skipNativePrepare) {
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

	public async setPlatformVersion(platformData: IPlatformData, projectData: IProjectData, frameworkVersion: string): Promise<void> {
    // TODO: We may want to write the version to nativescript.config.js here
		// const frameworkPackageNameData = { version: frameworkVersion };
    // this.$projectDataService.setNSValue(projectData.projectDir, platformData.frameworkPackageName, frameworkPackageNameData);
    await this.$packageManager.install(`${platformData.frameworkPackageName}@${frameworkVersion}`, projectData.projectDir, {
			'save-dev': true,
      disableNpmInstall: true,
			frameworkPath: null,
			ignoreScripts: false
		});
	}

	private async extractPackage(pkg: string): Promise<string> {
		const downloadedPackagePath = await this.$tempService.mkdirSync("runtimeDir");
		await this.$pacoteService.extractPackage(pkg, downloadedPackagePath);
		const frameworkDir = path.join(downloadedPackagePath, PROJECT_FRAMEWORK_FOLDER_NAME);
		return path.resolve(frameworkDir);
	}

	@performanceLog()
	private async addNativePlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void> {
		const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
		this.$fs.deleteDirectory(platformDir);

		await platformData.platformProjectService.createProject(path.resolve(frameworkDirPath), frameworkVersion, projectData);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await platformData.platformProjectService.interpolateData(projectData);
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);
	}

	private async trackPlatformVersion(frameworkVersion: string, platformData: IPlatformData): Promise<void> {
		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.AddPlatform,
			additionalData: `${platformData.platformNameLowerCase}${AnalyticsEventLabelDelimiter}${frameworkVersion}`
		});
	}
}
injector.register("addPlatformService", AddPlatformService);
