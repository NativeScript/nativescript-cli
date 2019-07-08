import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import * as glob from "glob";
import { UpdateControllerBase } from "./update-controller-base";
import { fromWindowsRelativePathToUnix } from "../common/helpers";

export class MigrateController extends UpdateControllerBase implements IMigrateController {
	constructor(
		protected $fs: IFileSystem,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $platformsDataService: IPlatformsDataService,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger,
		private $errors: IErrors,
		private $addPlatformService: IAddPlatformService,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $resources: IResourceLoader) {
		super($fs, $platformCommandHelper, $platformsDataService, $packageInstallationManager, $packageManager);
	}

	static readonly backupFolder: string = ".migration_backup";
	static readonly migrateFailMessage: string = "Could not migrate the project!";
	static readonly backupFailMessage: string = "Could not backup project folders!";

	static readonly folders: string[] = [
		constants.LIB_DIR_NAME,
		constants.HOOKS_DIR_NAME,
		constants.WEBPACK_CONFIG_NAME,
		constants.PACKAGE_JSON_FILE_NAME,
		constants.PACKAGE_LOCK_JSON_FILE_NAME,
		constants.TSCCONFIG_TNS_JSON_NAME,
		constants.KARMA_CONFIG_NAME
	];

	private migrationDependencies: IMigrationDependency[] = [
		{ packageName: constants.TNS_CORE_MODULES_NAME, verifiedVersion: "6.0.0-rc-2019-06-28-175837-02" },
		{ packageName: constants.TNS_CORE_MODULES_WIDGETS_NAME, verifiedVersion: "6.0.0" },
		{ packageName: "tns-platform-declarations", isDev: true, verifiedVersion: "6.0.0-rc-2019-06-28-175837-02" },
		{ packageName: "node-sass", isDev: true, verifiedVersion: "4.12.0" },
		{ packageName: "typescript", isDev: true, verifiedVersion: "3.4.1" },
		{ packageName: "less", isDev: true, verifiedVersion: "3.9.0" },
		{ packageName: "nativescript-dev-sass", isDev: true, replaceWith: "node-sass" },
		{ packageName: "nativescript-dev-typescript", isDev: true, replaceWith: "typescript" },
		{ packageName: "nativescript-dev-less", isDev: true, replaceWith: "less" },
		{ packageName: constants.WEBPACK_PLUGIN_NAME, isDev: true, shouldAddIfMissing: true, verifiedVersion: "1.0.0-rc-2019-07-02-161545-02" },
		{ packageName: "nativescript-camera", verifiedVersion: "4.5.0" },
		{ packageName: "nativescript-geolocation", verifiedVersion: "5.1.0" },
		{ packageName: "nativescript-imagepicker", verifiedVersion: "6.2.0" },
		{ packageName: "nativescript-social-share", verifiedVersion: "1.5.2" },
		{ packageName: "nativescript-ui-chart", verifiedVersion: "5.0.0-androidx-110619" },
		{ packageName: "nativescript-ui-dataform", verifiedVersion: "5.0.0-androidx-110619" },
		{ packageName: "nativescript-ui-gauge", verifiedVersion: "5.0.0-androidx" },
		{ packageName: "nativescript-ui-listview", verifiedVersion: "7.0.0-androidx-110619" },
		{ packageName: "nativescript-ui-sidedrawer", verifiedVersion: "7.0.0-androidx-110619" },
		{ packageName: "nativescript-ui-calendar", verifiedVersion: "5.0.0-androidx-110619-2" },
		{ packageName: "nativescript-ui-autocomplete", verifiedVersion: "5.0.0-androidx-110619" },
		{ packageName: "nativescript-datetimepicker", verifiedVersion: "1.1.0" },
		//TODO update with compatible with webpack only hooks
		{ packageName: "kinvey-nativescript-sdk", verifiedVersion: "4.2.1" },
		//TODO update with compatible with webpack only hooks
		{ packageName: "nativescript-plugin-firebase", verifiedVersion: "9.0.1" },
		//TODO update with no prerelease version compatible with webpack only hooks
		{ packageName: "nativescript-vue", verifiedVersion: "2.3.0-rc.1" },
		{ packageName: "nativescript-permissions", verifiedVersion: "1.3.0" },
		{ packageName: "nativescript-cardview", verifiedVersion: "3.2.0" },
		{
			packageName: "nativescript-unit-test-runner", verifiedVersion: "0.6.3",
			shouldMigrateAction: (projectData: IProjectData) => this.hasDependency({ packageName: "nativescript-unit-test-runner", isDev: false }, projectData),
			migrateAction: this.migrateUnitTestRunner.bind(this)
		}
	];

	get verifiedPlatformVersions(): IDictionary<string> {
		return {
			[this.$devicePlatformsConstants.Android.toLowerCase()]: "6.0.0-rc-2019-06-27-172817-03",
			[this.$devicePlatformsConstants.iOS.toLowerCase()]: "6.0.0-rc-2019-06-28-105002-01"
		};
	}

	public async migrate({ projectDir }: { projectDir: string }): Promise<void> {
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
			this.$logger.info("Backup auto-generated files.");
			this.handleAutoGeneratedFiles(backupDir, projectData);
			this.$logger.info("Backup auto-generated files complete.");
		} catch (error) {
			this.$logger.trace(`Error during auto-generated files handling. ${(error && error.message) || error}`);
		}

		await this.migrateOldAndroidAppResources(projectData);

		try {
			await this.cleanUpProject(projectData);
			await this.migrateDependencies(projectData);
		} catch (error) {
			this.restoreBackup(MigrateController.folders, backupDir, projectData.projectDir);
			this.$errors.failWithoutHelp(`${MigrateController.migrateFailMessage} The error is: ${error}`);
		}
	}

	private async migrateOldAndroidAppResources(projectData: IProjectData) {
		const appResourcesPath = projectData.getAppResourcesDirectoryPath();
		if (!this.$androidResourcesMigrationService.hasMigrated(appResourcesPath)) {
			this.$logger.info("Migrate old Android App_Resources structure.");
			await this.$androidResourcesMigrationService.migrate(appResourcesPath);
		}
	}

	public async shouldMigrate({ projectDir }: IProjectDir): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(projectDir);

		for (let i = 0; i < this.migrationDependencies.length; i++) {
			const dependency = this.migrationDependencies[i];
			const hasDependency = this.hasDependency(dependency, projectData);

			if (hasDependency && dependency.shouldMigrateAction && dependency.shouldMigrateAction(projectData)) {
				return true;
			}

			if (hasDependency && dependency.replaceWith) {
				return true;
			}

			if (hasDependency && await this.shouldMigrateDependencyVersion(dependency, projectData)) {
				return true;
			}

			if (!hasDependency && dependency.shouldAddIfMissing) {
				return true;
			}

			if (!this.$androidResourcesMigrationService.hasMigrated(projectData.getAppResourcesDirectoryPath())) {
				return true;
			}
		}

		for (const platform in this.$devicePlatformsConstants) {
			const hasRuntimeDependency = this.hasRuntimeDependency({ platform, projectData });
			if (!hasRuntimeDependency || await this.shouldUpdateRuntimeVersion({ targetVersion: this.verifiedPlatformVersions[platform.toLowerCase()], platform, projectData })) {
				return true;
			}
		}
	}

	private async cleanUpProject(projectData: IProjectData): Promise<void> {
		this.$logger.info("Clean old project artefacts.");
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.HOOKS_DIR_NAME));
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.PLATFORMS_DIR_NAME));
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME));
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.WEBPACK_CONFIG_NAME));
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.PACKAGE_LOCK_JSON_FILE_NAME));
		if (!projectData.isShared) {
			this.$fs.deleteFile(path.join(projectData.projectDir, constants.TSCCONFIG_TNS_JSON_NAME));
		}

		this.$logger.info("Clean old project artefacts complete.");
	}

	private handleAutoGeneratedFiles(backupDir: string, projectData: IProjectData): void {
		const globOptions: glob.IOptions = {
			silent: true,
			nocase: true,
			matchBase: true,
			nodir: true,
			absolute: false,
			cwd: projectData.appDirectoryPath
		};

		const jsFiles = glob.sync("*.@(js|ts|js.map)", globOptions);
		const autoGeneratedJsFiles = this.getGeneratedFiles(jsFiles, [".js"], [".ts"]);
		const autoGeneratedJsMapFiles = this.getGeneratedFiles(jsFiles, [".map"], [""]);
		const cssFiles = glob.sync("*.@(le|sa|sc|c)ss", globOptions);
		const autoGeneratedCssFiles = this.getGeneratedFiles(cssFiles, [".css"], [".scss", ".sass", ".less"]);

		const allGeneratedFiles = autoGeneratedJsFiles.concat(autoGeneratedJsMapFiles).concat(autoGeneratedCssFiles);
		for (const generatedFile of allGeneratedFiles) {
			const sourceFile = path.join(projectData.appDirectoryPath, generatedFile);
			const destinationFile = path.join(backupDir, generatedFile);
			const destinationFileDir = path.dirname(destinationFile);
			this.$fs.ensureDirectoryExists(destinationFileDir);
			this.$fs.rename(sourceFile, destinationFile);
		}
	}

	private getGeneratedFiles(allFiles: string[], generatedFileExts: string[], sourceFileExts: string[]): string[] {
		const autoGeneratedFiles = allFiles.filter(file => {
			let isGenerated = false;
			const { dir, name, ext } = path.parse(file);
			if (generatedFileExts.indexOf(ext) > -1) {
				for (const sourceExt of sourceFileExts) {
					const possibleSourceFile = path.format({ dir, name, ext: sourceExt });
					isGenerated = allFiles.indexOf(possibleSourceFile) > -1;
					if (isGenerated) {
						break;
					}
				}
			}

			return isGenerated;
		});

		return autoGeneratedFiles;
	}

	private async migrateDependencies(projectData: IProjectData): Promise<void> {
		this.$logger.info("Start dependencies migration.");
		for (let i = 0; i < this.migrationDependencies.length; i++) {
			const dependency = this.migrationDependencies[i];
			const hasDependency = this.hasDependency(dependency, projectData);

			if (hasDependency && dependency.migrateAction && dependency.shouldMigrateAction(projectData)) {
				const newDependencies = await dependency.migrateAction(projectData, path.join(projectData.projectDir, MigrateController.backupFolder));
				for (const newDependency of newDependencies) {
					await this.migrateDependency(newDependency, projectData);
				}
			}

			await this.migrateDependency(dependency, projectData);
		}

		for (const platform in this.$devicePlatformsConstants) {
			const lowercasePlatform = platform.toLowerCase();
			const hasRuntimeDependency = this.hasRuntimeDependency({ platform, projectData });
			if (!hasRuntimeDependency || await this.shouldUpdateRuntimeVersion({ targetVersion: this.verifiedPlatformVersions[lowercasePlatform], platform, projectData })) {
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

	private async migrateDependency(dependency: IMigrationDependency, projectData: IProjectData): Promise<void> {
		const hasDependency = this.hasDependency(dependency, projectData);

		if (hasDependency && dependency.replaceWith) {
			this.$pluginsService.removeFromPackageJson(dependency.packageName, projectData.projectDir);
			const replacementDep = _.find(this.migrationDependencies, migrationPackage => migrationPackage.packageName === dependency.replaceWith);
			if (!replacementDep) {
				this.$errors.failWithoutHelp("Failed to find replacement dependency.");
			}
			this.$logger.info(`Replacing '${dependency.packageName}' with '${replacementDep.packageName}'.`);
			this.$pluginsService.addToPackageJson(replacementDep.packageName, replacementDep.verifiedVersion, replacementDep.isDev, projectData.projectDir);
			return;
		}

		if (hasDependency && await this.shouldMigrateDependencyVersion(dependency, projectData)) {
			this.$logger.info(`Updating '${dependency.packageName}' to compatible version '${dependency.verifiedVersion}'`);
			this.$pluginsService.addToPackageJson(dependency.packageName, dependency.verifiedVersion, dependency.isDev, projectData.projectDir);
			return;
		}

		if (!hasDependency && dependency.shouldAddIfMissing) {
			this.$logger.info(`Adding '${dependency.packageName}' with version '${dependency.verifiedVersion}'`);
			this.$pluginsService.addToPackageJson(dependency.packageName, dependency.verifiedVersion, dependency.isDev, projectData.projectDir);
		}
	}

	private async shouldMigrateDependencyVersion(dependency: IMigrationDependency, projectData: IProjectData): Promise<boolean> {
		const devDependencies = projectData.devDependencies || {};
		const dependencies = projectData.dependencies || {};
		const packageName = dependency.packageName;
		const version = dependencies[packageName] || devDependencies[packageName];
		const maxSatisfyingVersion = await this.getMaxDependencyVersion(dependency.packageName, version);

		return !(maxSatisfyingVersion && semver.gte(maxSatisfyingVersion, dependency.verifiedVersion));
	}

	protected async shouldUpdateRuntimeVersion({ targetVersion, platform, projectData }: { targetVersion: string, platform: string, projectData: IProjectData }): Promise<boolean> {
		const maxRuntimeVersion = await this.getMaxRuntimeVersion({ platform, projectData });

		return !(maxRuntimeVersion && semver.gte(maxRuntimeVersion, targetVersion));
	}

	private async migrateUnitTestRunner(projectData: IProjectData, migrationBackupDirPath: string): Promise<IMigrationDependency[]> {
		// Migrate karma.conf.js
		const pathToKarmaConfig = path.join(migrationBackupDirPath, constants.KARMA_CONFIG_NAME);
		if (this.$fs.exists(pathToKarmaConfig)) {
			const oldKarmaContent = this.$fs.readText(pathToKarmaConfig);

			const regExp = /frameworks:\s+\[([\S\s]*?)\]/g;
			const matches = regExp.exec(oldKarmaContent);
			const frameworks = (matches && matches[1] && matches[1].trim()) || '["jasmine"]';

			const testsDir = path.join(projectData.appDirectoryPath, 'tests');
			const relativeTestsDir = path.relative(projectData.projectDir, testsDir);
			const testFiles = `'${fromWindowsRelativePathToUnix(relativeTestsDir)}/**/*.*'`;

			const karmaConfTemplate = this.$resources.readText('test/karma.conf.js');
			const karmaConf = _.template(karmaConfTemplate)({ frameworks, testFiles });
			this.$fs.writeFile(path.join(projectData.projectDir, constants.KARMA_CONFIG_NAME), karmaConf);
		}

		// Dependencies to migrate
		const dependencies = [
			{ packageName: "karma-webpack", verifiedVersion: "3.0.5", isDev: true, shouldAddIfMissing: true },
			{ packageName: "karma-jasmine", verifiedVersion: "2.0.1", isDev: true },
			{ packageName: "karma-mocha", verifiedVersion: "1.3.0", isDev: true },
			{ packageName: "karma-chai", verifiedVersion: "0.1.0", isDev: true },
			{ packageName: "karma-qunit", verifiedVersion: "3.1.2", isDev: true },
			{ packageName: "karma", verifiedVersion: "4.1.0", isDev: true },
		];

		return dependencies;
	}
}

$injector.register("migrateController", MigrateController);
