import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import { UpdateControllerBase } from "./update-controller-base";

export class MigrateController extends UpdateControllerBase implements IMigrateController {
	constructor(
		protected $fs: IFileSystem,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $platformsDataService: IPlatformsDataService,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger,
		private $errors: IErrors,
		private $addPlatformService: IAddPlatformService,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService) {
			super($fs, $platformCommandHelper, $platformsDataService, $packageInstallationManager, $packageManager);
	}

	static readonly folders: string[] = [
		constants.LIB_DIR_NAME,
		constants.HOOKS_DIR_NAME,
		constants.WEBPACK_CONFIG_NAME,
		constants.PACKAGE_JSON_FILE_NAME,
		constants.PACKAGE_LOCK_JSON_FILE_NAME,
		constants.TSCCONFIG_TNS_JSON_NAME
	];

	static readonly migrationDependencies : IMigrationDependency[] = [
		{ packageName: constants.TNS_CORE_MODULES_NAME, verifiedVersion: "6.0.0-next-2019-06-10-092158-01"},
		{ packageName: constants.TNS_CORE_MODULES_WIDGETS_NAME, verifiedVersion: "6.0.0-next-2019-06-10-092158-01"},
		{ packageName: "node-sass", isDev: true, verifiedVersion: "4.12.0"},
		{ packageName: "typescript", isDev: true, verifiedVersion: "3.4.1"},
		{ packageName: "less", isDev: true, verifiedVersion: "3.9.0"},
		{ packageName: "nativescript-dev-sass", isDev: true, replaceWith: "node-sass"},
		{ packageName: "nativescript-dev-typescript", isDev: true, replaceWith: "typescript"},
		{ packageName: "nativescript-dev-less", isDev: true, replaceWith: "less"},
		{ packageName: constants.WEBPACK_PLUGIN_NAME, isDev: true, shouldAddIfMissing: true, verifiedVersion: "0.25.0-webpack-2019-06-11-105349-01"},
		{ packageName: "nativescript-camera", verifiedVersion: "4.5.0"},
		{ packageName: "nativescript-geolocation", verifiedVersion: "5.1.0"},
		{ packageName: "nativescript-imagepicker", verifiedVersion: "6.2.0"},
		{ packageName: "nativescript-social-share", verifiedVersion: "1.5.2"},
		{ packageName: "nativescript-ui-chart", verifiedVersion: "5.0.0-androidx-110619"},
		{ packageName: "nativescript-ui-dataform", verifiedVersion: "5.0.0-androidx-110619"},
		{ packageName: "nativescript-ui-gauge", verifiedVersion: "5.0.0-androidx"},
		{ packageName: "nativescript-ui-listview", verifiedVersion: "7.0.0-androidx-110619"},
		{ packageName: "nativescript-ui-sidedrawer", verifiedVersion: "7.0.0-androidx-110619"},
		{ packageName: "nativescript-ui-calendar", verifiedVersion: "5.0.0-androidx-110619-2"},
		{ packageName: "nativescript-ui-autocomplete", verifiedVersion: "5.0.0-androidx-110619"},
		{ packageName: "nativescript-datetimepicker", verifiedVersion: "1.1.0"},
		//TODO update with compatible with webpack only hooks
		{ packageName: "kinvey-nativescript-sdk", verifiedVersion: "4.2.1"},
		//TODO update with compatible with webpack only hooks
		{ packageName: "nativescript-plugin-firebase", verifiedVersion: "9.0.1"},
		//TODO update with no prerelease version compatible with webpack only hooks
		{ packageName: "nativescript-vue", verifiedVersion: "2.3.0-rc.0"},
		{ packageName: "nativescript-permissions", verifiedVersion: "1.3.0"},
		{ packageName: "nativescript-cardview", verifiedVersion: "3.2.0"}
	];

	static readonly backupFolder: string = ".migration_backup";
	static readonly migrateFailMessage: string = "Could not migrate the project!";
	static readonly backupFailMessage: string = "Could not backup project folders!";

	get verifiedPlatformVersions(): IDictionary<string> {
		return {
			[this.$devicePlatformsConstants.Android.toLowerCase()]: "6.0.0-2019-06-11-172137-01",
			[this.$devicePlatformsConstants.iOS.toLowerCase()]: "6.0.0-2019-06-10-154118-03"
		};
	}

	public async migrate({projectDir}: {projectDir: string}): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const backupDir = path.join(projectDir, MigrateController.backupFolder);

		try {
			this.$logger.info("Backup project configuration.");
			this.backup(MigrateController.folders, backupDir, projectData.projectDir);
			this.$logger.info("Backup project configuration complete.");
		} catch (error) {
			this.$logger.error(MigrateController.backupFailMessage);
			this.$fs.deleteDirectory(backupDir);
			return;
		}

		try {
			await this.cleanUpProject(projectData);
			await this.migrateDependencies(projectData);
		} catch (error) {
			this.restoreBackup(MigrateController.folders, backupDir, projectData.projectDir);
			this.$logger.error(MigrateController.migrateFailMessage);
		}
	}

	public async shouldMigrate({projectDir}: IProjectDir): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(projectDir);

		for (let i = 0; i < MigrateController.migrationDependencies.length; i++) {
			const dependency = MigrateController.migrationDependencies[i];
			const hasDependency = this.hasDependency(dependency, projectData);

			if (hasDependency && dependency.replaceWith) {
				return true;
			}

			if (hasDependency && await this.shouldMigrateDependencyVersion(dependency, projectData)) {
				return true;
			}

			if (!hasDependency && dependency.shouldAddIfMissing) {
				return true;
			}
		}

		for (const platform in this.$devicePlatformsConstants) {
			const hasRuntimeDependency = this.hasRuntimeDependency({platform, projectData});
			if (!hasRuntimeDependency || await this.shouldUpdateRuntimeVersion({ targetVersion: this.verifiedPlatformVersions[platform.toLowerCase()], platform, projectData})) {
				return true;
			}
		}
	}

	private async cleanUpProject(projectData: IProjectData) {
		this.$logger.info("Clean old project artefacts.");
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.HOOKS_DIR_NAME));
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.PLATFORMS_DIR_NAME));
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME));
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.WEBPACK_CONFIG_NAME));
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.PACKAGE_LOCK_JSON_FILE_NAME));
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.TSCCONFIG_TNS_JSON_NAME));
		this.$logger.info("Clean old project artefacts complete.");
	}

	private async migrateDependencies(projectData: IProjectData): Promise<void> {
		this.$logger.info("Start dependencies migration.");
		for (let i = 0; i < MigrateController.migrationDependencies.length; i++) {
			const dependency = MigrateController.migrationDependencies[i];
			const hasDependency = this.hasDependency(dependency, projectData);

			if (hasDependency && dependency.replaceWith) {
				this.$pluginsService.removeFromPackageJson(dependency.packageName, dependency.isDev, projectData.projectDir);
				const replacementDep = _.find(MigrateController.migrationDependencies, migrationPackage => migrationPackage.packageName === dependency.replaceWith);
				if (!replacementDep) {
					this.$errors.failWithoutHelp("Failed to find replacement dependency.");
				}
				this.$logger.info(`Replacing '${dependency.packageName}' with '${replacementDep.packageName}'.`, );
				this.$pluginsService.addToPackageJson(replacementDep.packageName, replacementDep.verifiedVersion, replacementDep.isDev, projectData.projectDir);
				continue;
			}

			if (hasDependency && await this.shouldMigrateDependencyVersion(dependency, projectData)) {
				this.$logger.info(`Updating '${dependency.packageName}' to compatible version '${dependency.verifiedVersion}'`);
				this.$pluginsService.addToPackageJson(dependency.packageName, dependency.verifiedVersion, dependency.isDev, projectData.projectDir);
				continue;
			}

			if (!hasDependency && dependency.shouldAddIfMissing) {
				this.$logger.info(`Adding '${dependency.packageName}' with version '${dependency.verifiedVersion}'`);
				this.$pluginsService.addToPackageJson(dependency.packageName, dependency.verifiedVersion, dependency.isDev, projectData.projectDir);
				continue;
			}
		}

		for (const platform in this.$devicePlatformsConstants) {
			const lowercasePlatform = platform.toLowerCase();
			const hasRuntimeDependency = this.hasRuntimeDependency({platform, projectData});
			if (!hasRuntimeDependency || await this.shouldUpdateRuntimeVersion({targetVersion: this.verifiedPlatformVersions[lowercasePlatform], platform, projectData})) {
				const verifiedPlatformVersion = this.verifiedPlatformVersions[lowercasePlatform];
				const platformData = this.$platformsDataService.getPlatformData(lowercasePlatform, projectData);
				this.$logger.info(`Updating ${platform} platform to version '${verifiedPlatformVersion}'.`);
				await this.$addPlatformService.setPlatformVersion(platformData, projectData, verifiedPlatformVersion);
			}
		}

		this.$logger.info("Install packages.");
		await this.$packageManager.install(projectData.projectDir, projectData.projectDir, {
			disableNpmInstall: false,
			frameworkPath: null,
			ignoreScripts: false,
			path: projectData.projectDir
		});

		this.$logger.info("Migration complete.");
	}

	private async shouldMigrateDependencyVersion(dependency: IMigrationDependency, projectData: IProjectData): Promise<boolean> {
		const collection = dependency.isDev ? projectData.devDependencies : projectData.dependencies;
		const maxSatisfyingVersion = await this.getMaxDependencyVersion(dependency.packageName, collection[dependency.packageName]);

		return !(maxSatisfyingVersion && semver.gte(maxSatisfyingVersion, dependency.verifiedVersion));
	}

	protected async shouldUpdateRuntimeVersion({targetVersion, platform, projectData}: {targetVersion: string, platform: string, projectData: IProjectData}): Promise<boolean> {
		const maxRuntimeVersion = await this.getMaxRuntimeVersion({platform, projectData});

		return !(maxRuntimeVersion && semver.gte(maxRuntimeVersion, targetVersion));
	}
}

$injector.register("migrateController", MigrateController);
