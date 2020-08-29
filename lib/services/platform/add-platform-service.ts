import * as path from "path";
import {
	AnalyticsEventLabelDelimiter,
	PROJECT_FRAMEWORK_FOLDER_NAME,
	TrackActionNames,
} from "../../constants";
import { performanceLog } from "../../common/decorators";
import {
	IAddPlatformData,
	IAddPlatformService,
	IPlatformData,
} from "../../definitions/platform";
import { IProjectData } from "../../definitions/project"; //IProjectDataService
import { IAnalyticsService, IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import { IPackageManager } from "../../declarations";

export class AddPlatformService implements IAddPlatformService {
	constructor(
		private $fs: IFileSystem,
		// private $pacoteService: IPacoteService,
		// private $projectDataService: IProjectDataService,
		private $packageManager: IPackageManager,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $analyticsService: IAnalyticsService // private $tempService: ITempService
	) {}

	public async addPlatformSafe(
		projectData: IProjectData,
		platformData: IPlatformData,
		packageToInstall: string,
		addPlatformData: IAddPlatformData
	): Promise<string> {
		const spinner = this.$terminalSpinnerService.createSpinner();

		try {
			spinner.start();

			// const frameworkDirPath = addPlatformData.frameworkPath ?
			// 	await this.extractPackage(packageToInstall)
			// 	: await this.installPackage(projectData.projectDir, packageToInstall);
			const frameworkDirPath = await this.installPackage(
				projectData.projectDir,
				packageToInstall
			);
			const frameworkPackageJsonContent = this.$fs.readJson(
				path.join(frameworkDirPath, "..", "package.json")
			);
			const frameworkVersion = frameworkPackageJsonContent.version;

			// await this.setPlatformVersion(platformData, projectData, frameworkVersion);
			await this.trackPlatformVersion(frameworkVersion, platformData);

			if (
				!addPlatformData.nativePrepare ||
				!addPlatformData.nativePrepare.skipNativePrepare
			) {
				await this.addNativePlatform(
					platformData,
					projectData,
					frameworkDirPath,
					frameworkVersion
				);
			}

			return frameworkVersion;
		} catch (err) {
			const platformPath = path.join(
				projectData.platformsDir,
				platformData.platformNameLowerCase
			);
			this.$fs.deleteDirectory(platformPath);
			throw err;
		} finally {
			spinner.stop();
		}
	}

	public async setPlatformVersion(
		platformData: IPlatformData,
		projectData: IProjectData,
		frameworkVersion: string
	): Promise<void> {
		await this.installPackage(
			projectData.projectDir,
			`${platformData.frameworkPackageName}@${frameworkVersion}`
		);
	}

	// private async extractPackage(pkg: string): Promise<string> {
	// 	const downloadedPackagePath = await this.$tempService.mkdirSync(
	// 		"runtimeDir"
	// 	);
	// 	await this.$pacoteService.extractPackage(pkg, downloadedPackagePath);
	// 	const frameworkDir = path.join(
	// 		downloadedPackagePath,
	// 		PROJECT_FRAMEWORK_FOLDER_NAME
	// 	);
	// 	return path.resolve(frameworkDir);
	// }

	private async installPackage(
		projectDir: string,
		pkg: string
	): Promise<string> {
		const installedPackage = await this.$packageManager.install(
			pkg,
			projectDir,
			{
				silent: true,
				dev: true,
				"save-dev": true,
				"save-exact": true,
			} as any
		);

		if (!installedPackage.name) {
			return "";
		}

		const frameworkDir = require
			.resolve(`${installedPackage.name}/package.json`, {
				paths: [projectDir],
			})
			.replace("package.json", PROJECT_FRAMEWORK_FOLDER_NAME);

		return path.resolve(frameworkDir);
	}

	@performanceLog()
	private async addNativePlatform(
		platformData: IPlatformData,
		projectData: IProjectData,
		frameworkDirPath: string,
		frameworkVersion: string
	): Promise<void> {
		const platformDir = path.join(
			projectData.platformsDir,
			platformData.normalizedPlatformName.toLowerCase()
		);
		this.$fs.deleteDirectory(platformDir);

		await platformData.platformProjectService.createProject(
			path.resolve(frameworkDirPath),
			frameworkVersion,
			projectData
		);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(
			projectData
		);
		await platformData.platformProjectService.interpolateData(projectData);
		platformData.platformProjectService.afterCreateProject(
			platformData.projectRoot,
			projectData
		);
	}

	private async trackPlatformVersion(
		frameworkVersion: string,
		platformData: IPlatformData
	): Promise<void> {
		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.AddPlatform,
			additionalData: `${platformData.platformNameLowerCase}${AnalyticsEventLabelDelimiter}${frameworkVersion}`,
		});
	}
}

injector.register("addPlatformService", AddPlatformService);
