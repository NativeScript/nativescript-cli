import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import { BaseUpdateController } from "./base-update-controller";

export class MigrateController extends BaseUpdateController implements IMigrateController {
	constructor(
		protected $fs: IFileSystem,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $platformsDataService: IPlatformsDataService,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger,
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
		{ packageName: constants.TNS_CORE_MODULES_NAME, isDev: false, verifiedVersion: "6.0.0-next-2019-06-10-092158-01"},
		{ packageName: constants.TNS_CORE_MODULES_WIDGETS_NAME, isDev: false, verifiedVersion: "6.0.0-next-2019-06-10-092158-01"},
		{ packageName: "node-sass", isDev: true, verifiedVersion: "4.12.0"},
		{ packageName: "typescript", isDev: true, verifiedVersion: "3.4.1"},
		{ packageName: "less", isDev: true, verifiedVersion: "3.9.0"},
		{ packageName: "nativescript-dev-sass", isDev: true, replaceWith: "node-sass"},
		{ packageName: "nativescript-dev-typescript", isDev: true, replaceWith: "typescript"},
		{ packageName: "nativescript-dev-less", isDev: true, replaceWith: "less"},
		{ packageName: constants.WEBPACK_PLUGIN_NAME, isDev: true, shouldAdd: true, verifiedVersion: "0.25.0-webpack-2019-06-11-105349-01"},
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
		{ packageName: "kinvey-nativescript-sdk", verifiedVersion: "4.1.0"},
		//TODO update with compatible with webpack only hooks
		{ packageName: "nativescript-plugin-firebase", verifiedVersion: "8.3.2"},
		//TODO update with no prerelease version compatible with webpack only hooks
		{ packageName: "nativescript-vue", verifiedVersion: "2.3.0-rc.0"},
		{ packageName: "nativescript-permissions", verifiedVersion: "1.3.0"},
		{ packageName: "nativescript-cardview", verifiedVersion: "3.2.0"}
	];

	static readonly tempFolder: string = ".migration_backup";
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
		const tmpDir = path.join(projectDir, MigrateController.tempFolder);

		try {
			this.$logger.info("Backup project configuration.");
			this.backup(MigrateController.folders, tmpDir, projectData);
			this.$logger.info("Backup project configuration complete.");
		} catch (error) {
			this.$logger.error(MigrateController.backupFailMessage);
			this.$fs.deleteDirectory(tmpDir);
			return;
		}

		try {
			await this.cleanUpProject(projectData);
			await this.migrateDependencies(projectData);
		} catch (error) {
			this.restoreBackup(MigrateController.folders, tmpDir, projectData);
			this.$logger.error(MigrateController.migrateFailMessage);
		}
	}

	public async shouldMigrate({projectDir}: IProjectDir): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		for (let i = 0; i < MigrateController.migrationDependencies.length; i++) {
			const dependency = MigrateController.migrationDependencies[i];
			const collection = dependency.isDev ? projectData.devDependencies : projectData.dependencies;
			if (dependency.replaceWith && collection && collection[dependency.packageName]) {
				return true;
			}

			if (!this.shouldSkipMigrationDependency(dependency, projectData) && await this.shouldMigrateDependencyVersion(dependency, projectData)) {
				return true;
			}
		}
		for (const platform in this.$devicePlatformsConstants) {
			if (await this.shouldUpdateRuntimeVersion({ targetVersion: this.verifiedPlatformVersions[platform.toLowerCase()], platform, projectData, shouldAdd: true})) {
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
		this.$logger.info("Start migrating dependencies.");
		for (let i = 0; i < MigrateController.migrationDependencies.length; i++) {
			const dependency = MigrateController.migrationDependencies[i];
			if (this.shouldSkipMigrationDependency(dependency, projectData)) {
				continue;
			}

			if (dependency.replaceWith) {
				this.$pluginsService.removeFromPackageJson(dependency.packageName, dependency.isDev, projectData.projectDir);
				const replacementDep = _.find(MigrateController.migrationDependencies, migrationPackage => migrationPackage.packageName === dependency.replaceWith);
				this.$logger.info(`Replacing '${dependency.packageName}' with '${replacementDep.packageName}'.`, );
				this.$pluginsService.addToPackageJson(replacementDep.packageName, replacementDep.verifiedVersion, replacementDep.isDev, projectData.projectDir);
			} else if (await this.shouldMigrateDependencyVersion(dependency, projectData)) {
				this.$logger.info(`Updating '${dependency.packageName}' to compatible version '${dependency.verifiedVersion}'`);
				this.$pluginsService.addToPackageJson(dependency.packageName, dependency.verifiedVersion, dependency.isDev, projectData.projectDir);
			}
		}

		for (const platform in this.$devicePlatformsConstants) {
			const lowercasePlatform = platform.toLowerCase();
			if (await this.shouldUpdateRuntimeVersion({targetVersion: this.verifiedPlatformVersions[lowercasePlatform], platform, projectData, shouldAdd: true})) {
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
		if (
			collection &&
			collection[dependency.packageName]
		) {
			const maxSatisfyingVersion = await this.getMaxDependencyVersion(dependency.packageName, collection[dependency.packageName]);
			if (maxSatisfyingVersion) {
				const isPrereleaseVersion = semver.prerelease(maxSatisfyingVersion);
				const coerceMaxSatisfying = semver.coerce(maxSatisfyingVersion).version;
				const coerceVerifiedVersion = semver.coerce(dependency.verifiedVersion).version;
				//This makes sure that if the user has a prerelease 6.0.0-next-2019-06-10-092158-01 version we will update it to 6.0.0
				if (isPrereleaseVersion) {
					if (semver.gt(coerceMaxSatisfying, coerceVerifiedVersion)) {
						return false;
					}

					//TODO This should be removed once we update the verified versions to no prerelease versions
					if (semver.eq(maxSatisfyingVersion, dependency.verifiedVersion)) {
						return false;
					}
				} else if (semver.gte(coerceMaxSatisfying, coerceVerifiedVersion)) {
					return false;
				}
			}
		}

		return true;
	}

	private shouldSkipMigrationDependency(dependency: IMigrationDependency, projectData: IProjectData) {
		if (!dependency.shouldAdd) {
			return this.shouldSkipDependency(dependency, projectData);
		}
	}
}

$injector.register("migrateController", MigrateController);
