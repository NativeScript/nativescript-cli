import * as path from "path";
import * as semver from "semver";
import * as _ from "lodash";
import * as constants from "../constants";
import { PlatformController } from "../controllers/platform-controller";
import { PlatformValidationService } from "../services/platform/platform-validation-service";
import { IProjectData, IProjectDataService } from "../definitions/project";
import {
	IPlatformCommandHelper,
	IPackageInstallationManager,
	IUpdatePlatformOptions,
	IOptions,
} from "../declarations";
import { IPlatformsDataService, IPlatformData } from "../definitions/platform";
import { IFileSystem, IErrors } from "../common/declarations";
import { injector } from "../common/yok";
import { ITempService } from "../definitions/temp-service";

export class PlatformCommandHelper implements IPlatformCommandHelper {
	constructor(
		private $platformController: PlatformController,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $options: IOptions,
		private $mobileHelper: Mobile.IMobileHelper,
		private $packageInstallationManager: IPackageInstallationManager,
		private $pacoteService: IPacoteService,
		private $platformsDataService: IPlatformsDataService,
		private $platformValidationService: PlatformValidationService,
		private $projectChangesService: IProjectChangesService,
		private $projectDataService: IProjectDataService,
		private $tempService: ITempService
	) {}

	public async addPlatforms(
		platforms: string[],
		projectData: IProjectData,
		frameworkPath: string
	): Promise<void> {
		if (this.$options.androidHost) {
			this.$logger.info("Ignoring platform add becuase of --android-host flag");
			return;
		}

		const platformsDir = projectData.platformsDir;
		this.$fs.ensureDirectoryExists(platformsDir);

		for (const platform of platforms) {
			this.$platformValidationService.validatePlatform(platform, projectData);
			const platformPath = path.join(projectData.platformsDir, platform);

			const isPlatformAdded = this.isPlatformAdded(
				platform,
				platformPath,
				projectData
			);
			if (isPlatformAdded) {
				this.$errors.fail(`Platform ${platform} already added`);
			}

			await this.$platformController.addPlatform({
				projectDir: projectData.projectDir,
				platform,
				frameworkPath,
			});
		}
	}

	public async cleanPlatforms(
		platforms: string[],
		projectData: IProjectData,
		framworkPath: string
	): Promise<void> {
		for (const platform of platforms) {
			const version: string = this.getCurrentPlatformVersion(
				platform,
				projectData
			);

			await this.removePlatforms([platform], projectData);

			const platformParam = version ? `${platform}@${version}` : platform;
			await this.addPlatforms([platformParam], projectData, framworkPath);
		}
	}

	public async removePlatforms(
		platforms: string[],
		projectData: IProjectData
	): Promise<void> {
		if (this.$options.androidHost) {
			this.$logger.info(
				"Ignoring platform remove becuase of --android-host flag"
			);
			return;
		}

		for (const platform of platforms) {
			this.$platformValidationService.validatePlatformInstalled(
				platform,
				projectData
			);
			const platformData = this.$platformsDataService.getPlatformData(
				platform,
				projectData
			);
			let errorMessage;

			try {
				await platformData.platformProjectService.stopServices(
					platformData.projectRoot
				);
			} catch (err) {
				errorMessage = err.message;
			}

			try {
				const platformDir = this.$options.androidHost
					? this.$options.androidHost
					: path.join(projectData.platformsDir, platform.toLowerCase());
				this.$fs.deleteDirectory(platformDir);
				await this.$packageInstallationManager.uninstall(
					platformData.frameworkPackageName,
					projectData.projectDir
				);
				// this.$projectDataService.removeNSProperty(
				// 	projectData.projectDir,
				// 	platformData.frameworkPackageName
				// );

				this.$logger.info(`Platform ${platform} successfully removed.`);
			} catch (err) {
				this.$logger.error(
					`Failed to remove ${platform} platform with errors:`
				);
				if (errorMessage) {
					this.$logger.error(errorMessage);
				}
				this.$errors.fail(err.message);
			}
		}
	}

	public async updatePlatforms(
		platforms: string[],
		projectData: IProjectData
	): Promise<void> {
		for (const platformParam of platforms) {
			const data = platformParam.split("@"),
				platform = data[0],
				version = data[1];

			const hasPlatformDirectory = this.$fs.exists(
				path.join(projectData.platformsDir, platform.toLowerCase())
			);
			if (hasPlatformDirectory) {
				await this.updatePlatform(platform, version, projectData);
			} else {
				await this.$platformController.addPlatform({
					projectDir: projectData.projectDir,
					platform: platformParam,
				});
			}
		}
	}

	public getInstalledPlatforms(projectData: IProjectData): string[] {
		if (!this.$fs.exists(projectData.platformsDir)) {
			return [];
		}

		const subDirs = this.$fs.readDirectory(projectData.platformsDir);
		const platforms = this.$mobileHelper.platformNames.map((p) =>
			p.toLowerCase()
		);
		return _.filter(subDirs, (p) => platforms.indexOf(p) > -1);
	}

	public getAvailablePlatforms(projectData: IProjectData): string[] {
		const installedPlatforms = this.getInstalledPlatforms(projectData);
		return _.filter(this.$mobileHelper.platformNames, (p) => {
			return (
				installedPlatforms.indexOf(p) < 0 &&
				this.$platformValidationService.isPlatformSupportedForOS(p, projectData)
			); // Only those not already installed
		});
	}

	public getPreparedPlatforms(projectData: IProjectData): string[] {
		return _.filter(this.$mobileHelper.platformNames, (p) => {
			return this.isPlatformPrepared(p, projectData);
		});
	}

	public getCurrentPlatformVersion(
		platform: string,
		projectData: IProjectData
	): string {
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);
		const currentPlatformData: any = this.$projectDataService.getRuntimePackage(
			projectData.projectDir,
			<constants.PlatformTypes>platformData.platformNameLowerCase
		);
		const version = currentPlatformData && currentPlatformData.version;

		return version;
	}

	private isPlatformAdded(
		platform: string,
		platformPath: string,
		projectData: IProjectData
	): boolean {
		if (!this.$fs.exists(platformPath)) {
			return false;
		}

		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);
		const prepareInfo =
			this.$projectChangesService.getPrepareInfo(platformData);
		if (!prepareInfo) {
			return true;
		}

		return (
			prepareInfo.nativePlatformStatus !==
			constants.NativePlatformStatus.requiresPlatformAdd
		);
	}

	private async updatePlatform(
		platform: string,
		version: string,
		projectData: IProjectData
	): Promise<void> {
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);

		const data = this.$projectDataService.getRuntimePackage(
			projectData.projectDir,
			<constants.PlatformTypes>platformData.platformNameLowerCase
		);
		const currentVersion = data && data.version ? data.version : "0.2.0";

		const installedModuleDir = await this.$tempService.mkdirSync(
			"runtime-to-update"
		);
		let newVersion =
			version === constants.PackageVersion.NEXT
				? await this.$packageInstallationManager.getNextVersion(
						platformData.frameworkPackageName
				  )
				: version ||
				  (await this.$packageInstallationManager.getLatestCompatibleVersion(
						platformData.frameworkPackageName
				  ));
		await this.$pacoteService.extractPackage(
			`${platformData.frameworkPackageName}@${newVersion}`,
			installedModuleDir
		);
		const cachedPackageData = this.$fs.readJson(
			path.join(installedModuleDir, "package.json")
		);
		newVersion = (cachedPackageData && cachedPackageData.version) || newVersion;

		if (!semver.valid(newVersion)) {
			this.$errors.fail(
				"The version %s is not valid. The version should consists from 3 parts separated by dot.",
				newVersion
			);
		}

		if (!semver.gt(currentVersion, newVersion)) {
			await this.updatePlatformCore(
				platformData,
				{ currentVersion, newVersion },
				projectData
			);
		} else if (semver.eq(currentVersion, newVersion)) {
			this.$errors.fail("Current and new version are the same.");
		} else {
			this.$errors.fail(
				`Your current version: ${currentVersion} is higher than the one you're trying to install ${newVersion}.`
			);
		}
	}

	private async updatePlatformCore(
		platformData: IPlatformData,
		updateOptions: IUpdatePlatformOptions,
		projectData: IProjectData
	): Promise<void> {
		let packageName = platformData.normalizedPlatformName.toLowerCase();
		await this.removePlatforms([packageName], projectData);
		packageName = updateOptions.newVersion
			? `${packageName}@${updateOptions.newVersion}`
			: packageName;
		await this.$platformController.addPlatform({
			projectDir: projectData.projectDir,
			platform: packageName,
		});
		this.$logger.info(
			"Successfully updated to version ",
			updateOptions.newVersion
		);
	}

	private isPlatformPrepared(
		platform: string,
		projectData: IProjectData
	): boolean {
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);
		return platformData.platformProjectService.isPlatformPrepared(
			platformData.projectRoot,
			projectData
		);
	}
}
injector.register("platformCommandHelper", PlatformCommandHelper);
