import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import * as glob from "glob";
import * as _ from "lodash";
import simpleGit, { SimpleGit } from "simple-git";
import { UpdateControllerBase } from "./update-controller-base";
import { fromWindowsRelativePathToUnix, getHash } from "../common/helpers";
import {
	IBackup,
	INsConfig,
	IProjectBackupService,
	IProjectCleanupService,
	IProjectConfigService,
	IProjectData,
	IProjectDataService,
} from "../definitions/project";
import {
	IDependencyVersion,
	IMigrateController,
	IMigrationData,
	IMigrationDependency,
} from "../definitions/migrate";
import {
	IOptions,
	IPackageInstallationManager,
	IPackageManager,
	IPlatformCommandHelper,
	IPlatformValidationService,
} from "../declarations";
import {
	IAddPlatformService,
	IPlatformsDataService,
} from "../definitions/platform";
import { IPluginsService } from "../definitions/plugins";
import {
	IChildProcess,
	IDictionary,
	IErrors,
	IFileSystem,
	IResourceLoader,
	ISettingsService,
} from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { IJsonFileSettingsService } from "../common/definitions/json-file-settings-service";
import { SupportedConfigValues } from "../tools/config-manipulation/config-transformer";

// const wait: (ms: number) => Promise<void> = (ms: number = 1000) =>
// 	new Promise((resolve) => setTimeout(resolve, ms));

export class MigrateController
	extends UpdateControllerBase
	implements IMigrateController {
	// 	private static COMMON_MIGRATE_MESSAGE =
	// 		"not affect the codebase of the application and you might need to do additional changes manually – for more information, refer to the instructions in the following blog post: https://www.nativescript.org/blog/nativescript-6.0-application-migration";
	// 	private static UNABLE_TO_MIGRATE_APP_ERROR = `The current application is not compatible with NativeScript CLI 7.0.
	// Use the \`ns migrate\` command to migrate the app dependencies to a form compatible with NativeScript 7.0.
	// Running this command will ${MigrateController.COMMON_MIGRATE_MESSAGE}`;
	// 	private static MIGRATE_FINISH_MESSAGE = `The \`tns migrate\` command does ${MigrateController.COMMON_MIGRATE_MESSAGE}`;

	constructor(
		protected $fs: IFileSystem,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $platformsDataService: IPlatformsDataService,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		protected $pacoteService: IPacoteService,
		// private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger,
		private $errors: IErrors,
		private $addPlatformService: IAddPlatformService,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $projectConfigService: IProjectConfigService,
		private $options: IOptions,
		private $platformValidationService: IPlatformValidationService,
		private $resources: IResourceLoader,
		private $injector: IInjector,
		private $settingsService: ISettingsService,
		private $staticConfig: Config.IStaticConfig,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $projectCleanupService: IProjectCleanupService,
		private $projectBackupService: IProjectBackupService,
		private $childProcess: IChildProcess
	) {
		super(
			$fs,
			$platformCommandHelper,
			$platformsDataService,
			$packageInstallationManager,
			$packageManager,
			$pacoteService
		);
	}

	// static readonly typescriptPackageName: string = "typescript";

	static readonly backupFolderName: string = ".migration_backup";
	static readonly pathsToBackup: string[] = [
		constants.LIB_DIR_NAME,
		constants.HOOKS_DIR_NAME,
		constants.WEBPACK_CONFIG_NAME,
		constants.PACKAGE_JSON_FILE_NAME,
		constants.PACKAGE_LOCK_JSON_FILE_NAME,
		constants.TSCCONFIG_TNS_JSON_NAME,
		constants.KARMA_CONFIG_NAME,
		constants.CONFIG_NS_FILE_NAME,
	];

	private spinner: ITerminalSpinner;

	private get $jsonFileSettingsService(): IJsonFileSettingsService {
		const cliVersion = semver.coerce(this.$staticConfig.version);
		const shouldMigrateCacheFilePath = path.join(
			this.$settingsService.getProfileDir(),
			`should-migrate-cache-${cliVersion}.json`
		);
		this.$logger.trace(
			`Migration cache path is: ${shouldMigrateCacheFilePath}`
		);
		return this.$injector.resolve("jsonFileSettingsService", {
			jsonFileSettingsPath: shouldMigrateCacheFilePath,
		});
	}

	private migrationDependencies: IMigrationDependency[] = [
		{
			packageName: constants.SCOPED_TNS_CORE_MODULES,
			minVersion: "6.5.0",
			desiredVersion: "~8.0.0",
			shouldAddIfMissing: true,
		},
		{
			packageName: constants.TNS_CORE_MODULES_NAME,
			shouldRemove: true,
		},
		{
			packageName: "@nativescript/types",
			minVersion: "7.0.0",
			desiredVersion: "~8.0.0",
			isDev: true,
		},
		{
			packageName: "tns-platform-declarations",
			replaceWith: "@nativescript/types",
			minVersion: "6.5.0",
			isDev: true,
		},
		{
			packageName: constants.TNS_CORE_MODULES_WIDGETS_NAME,
			shouldRemove: true,
		},
		{
			packageName: "nativescript-dev-webpack",
			replaceWith: constants.WEBPACK_PLUGIN_NAME,
			shouldRemove: true,
			isDev: true,
			async shouldMigrateAction() {
				return true;
			},
			migrateAction: this.migrateWebpack.bind(this),
		},
		{
			packageName: constants.WEBPACK_PLUGIN_NAME,
			minVersion: "3.0.0",
			desiredVersion: "~5.0.0-beta.0",
			shouldAddIfMissing: true,
			isDev: true,
		},
		{
			packageName: "nativescript-vue",
			minVersion: "2.7.0",
			desiredVersion: "~2.9.0",
			async shouldMigrateAction(
				dependency: IMigrationDependency,
				projectData: IProjectData,
				loose: boolean
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}

				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose
				);
			},
			migrateAction: this.migrateNativeScriptVue.bind(this),
		},
		{
			packageName: "nativescript-angular",
			replaceWith: "@nativescript/angular",
			minVersion: "10.0.0",
		},
		{
			packageName: "@nativescript/angular",
			minVersion: "10.0.0",
			desiredVersion: "~11.8.0",
			async shouldMigrateAction(
				dependency: IMigrationDependency,
				projectData: IProjectData,
				loose: boolean
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}

				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose
				);
			},
			migrateAction: this.migrateNativeScriptAngular.bind(this),
		},
		{
			packageName: "svelte-native",
			minVersion: "0.9.0",
			desiredVersion: "~0.9.4",
			async shouldMigrateAction(
				dependency: IMigrationDependency,
				projectData: IProjectData,
				loose: boolean
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}
				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose
				);
			},
			migrateAction: this.migrateNativeScriptSvelte.bind(this),
		},
		{
			packageName: "@nativescript/unit-test-runner",
			minVersion: "1.0.0",
			async shouldMigrateAction(
				dependency: IMigrationDependency,
				projectData: IProjectData,
				loose: boolean
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}
				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose
				);
			},
			migrateAction: this.migrateUnitTestRunner.bind(this),
		},
		{
			packageName: "typescript",
			isDev: true,
			minVersion: "3.7.0",
			desiredVersion: "~4.0.0",
		},
	];

	get verifiedPlatformVersions(): IDictionary<IDependencyVersion> {
		return {
			[this.$devicePlatformsConstants.Android.toLowerCase()]: {
				minVersion: "6.5.3",
				desiredVersion: "8.0.0",
			},
			[this.$devicePlatformsConstants.iOS.toLowerCase()]: {
				minVersion: "6.5.4",
				desiredVersion: "8.0.0",
			},
		};
	}

	public async shouldMigrate({
		projectDir,
		platforms,
		loose = false,
	}: IMigrationData): Promise<boolean> {
		const remainingPlatforms = [];

		let shouldMigrate = false;

		for (const platform of platforms) {
			const cachedResult = await this.getCachedShouldMigrate(
				projectDir,
				platform,
				loose
			);
			this.$logger.trace(
				`Got cached result for shouldMigrate for platform: ${platform}: ${cachedResult}`
			);

			// the cached result is only used if it's false, otherwise we need to check again
			if (cachedResult !== false) {
				remainingPlatforms.push(platform);
			}
		}

		if (remainingPlatforms.length > 0) {
			shouldMigrate = await this._shouldMigrate({
				projectDir,
				platforms: remainingPlatforms,
				loose: loose,
			});
			this.$logger.trace(
				`Executed shouldMigrate for platforms: ${remainingPlatforms}. Result is: ${shouldMigrate}`
			);

			if (!shouldMigrate) {
				for (const remainingPlatform of remainingPlatforms) {
					await this.setCachedShouldMigrate(
						projectDir,
						remainingPlatform,
						loose
					);
				}
			}
		}

		return shouldMigrate;
	}

	public async validate({
		projectDir,
		platforms,
		loose = true,
	}: IMigrationData): Promise<void> {
		const shouldMigrate = await this.shouldMigrate({
			projectDir,
			platforms,
			loose,
		});
		if (shouldMigrate) {
			this.$errors.fail(
				`The current application is not compatible with NativeScript CLI ${this.$staticConfig.version}.\n\nRun 'ns migrate' to migrate your project to the latest NativeScript version.\n\nAlternatively you may try running it with '--force' to skip this check.`
			);
		}
	}

	public async migrate({
		projectDir,
		platforms,
		loose = false,
	}: IMigrationData): Promise<void> {
		this.spinner = this.$terminalSpinnerService.createSpinner();
		const projectData = this.$projectDataService.getProjectData(projectDir);

		this.$logger.trace("MigrationController.migrate called with", {
			projectDir,
			platforms,
			loose: loose,
		});

		// ensure in git repo and require --force if not (for safety)
		// ensure git branch is clean
		const canMigrate = await this.ensureGitCleanOrForce(projectDir);

		if (!canMigrate) {
			this.spinner.fail("Pre-Migration verification failed");
			return;
		}

		this.spinner.succeed("Pre-Migration verification complete");

		// back up project files and folders
		this.spinner.start("Backing up project files before migration");

		const backup = await this.backupProject(projectDir);

		this.spinner.text = "Project files have been backed up";
		this.spinner.succeed();

		// clean up project files
		this.spinner.info("Cleaning up project files before migration");

		await this.cleanUpProject(projectData);

		this.spinner.text = "Project files have been cleaned up";
		this.spinner.succeed();

		// clean up artifacts
		this.spinner.start("Cleaning up old artifacts");

		await this.handleAutoGeneratedFiles(backup, projectData);

		this.spinner.text = "Cleaned old artifacts";
		this.spinner.succeed();

		const newConfigPath = path.resolve(projectDir, "nativescript.config.ts");
		if (!this.$fs.exists(newConfigPath)) {
			// migrate configs
			this.spinner.start(
				`Migrating project to use ${"nativescript.config.ts".green}`
			);

			await this.migrateConfigs(projectDir);

			this.spinner.text = `Project has been migrated to use ${
				"nativescript.config.ts".green
			}`;
			this.spinner.succeed();
		}

		// update dependencies
		this.spinner.start("Updating project dependencies");

		await this.migrateDependencies(projectData, platforms, loose);

		this.spinner.text = "Project dependencies have been updated";
		this.spinner.succeed();

		// update tsconfig
		const tsConfigPath = path.resolve(projectDir, "tsconfig.json");
		if (this.$fs.exists(tsConfigPath)) {
			this.spinner.start(`Updating ${"tsconfig.json".yellow}`);

			await this.migrateTSConfig(tsConfigPath);

			this.spinner.succeed(`Updated ${"tsconfig.json".yellow}`);
		}

		await this.migrateWebpack5(projectDir, projectData);

		// npx -p @nativescript/webpack@alpha nativescript-webpack init

		// run @nativescript/eslint over codebase
		// this.spinner.start("Checking project code...");

		await this.runESLint(projectDir);

		// this.spinner.succeed("Updated tsconfig.json");

		// add latest runtimes (if they were specified in the nativescript key)
		// this.spinner.start("Updating runtimes");
		//
		// await wait(2000);
		// this.spinner.clear();
		// this.$logger.info(
		// 	`  - ${"@nativescript/android".yellow} ${"v7.0.0".green} has been added`
		// );
		// this.spinner.render();
		//
		// this.spinner.text = "Runtimes have been updated";
		// this.spinner.succeed();

		this.spinner.succeed("Migration complete.");

		this.$logger.info("");
		this.$logger.printMarkdown(
			"Project has been successfully migrated. The next step is to run `ns run <platform>` to ensure everything is working properly." +
				"\n\nPlease note that you may need additional changes to complete the migration."
			// + "\n\nYou may restore your project with `ns migrate restore`"
		);

		// print markdown for next steps:
		// if no runtime has been added, print a message that it will be added when they run ns run <platform>
		// if all is good, run ns migrate clean to clean up backup folders

		// in case of failure, print diagnostic data: what failed and why
		// restore all files - or perhaps let the user sort it out
		// or ns migrate restore - to restore from pre-migration backup
		// for some known cases, print suggestions perhaps
		//
		// return;
		//
		// this.spinner = this.$terminalSpinnerService.createSpinner();
		//
		// this.spinner.start("Migrating project...");
		// // const projectData = this.$projectDataService.getProjectData(projectDir);
		// const backupDir = path.join(projectDir, MigrateController.backupFolderName);
		//
		// try {
		// 	this.spinner.start("Backup project configuration.");
		// 	this.backup(
		// 		[
		// 			...MigrateController.pathsToBackup,
		// 			path.join(projectData.getAppDirectoryRelativePath(), "package.json"),
		// 		],
		// 		backupDir,
		// 		projectData.projectDir
		// 	);
		// 	this.spinner.text = "Backup project configuration complete.";
		// 	this.spinner.succeed();
		// } catch (error) {
		// 	// this.spinner.text = MigrateController.backupFailMessage;
		// 	this.spinner.fail();
		// 	// this.$logger.error(MigrateController.backupFailMessage);
		// 	await this.$projectCleanupService.cleanPath(backupDir);
		// 	// this.$fs.deleteDirectory(backupDir);
		// 	return;
		// }
		//
		// try {
		// 	this.spinner.start("Clean auto-generated files.");
		// 	this.handleAutoGeneratedFiles(backupDir, projectData);
		// 	this.spinner.text = "Clean auto-generated files complete.";
		// 	this.spinner.succeed();
		// } catch (error) {
		// 	this.$logger.trace(
		// 		`Error during auto-generated files handling. ${
		// 			(error && error.message) || error
		// 		}`
		// 	);
		// }
		//
		// // await this.migrateOldAndroidAppResources(projectData, backupDir);
		//
		// try {
		// 	await this.cleanUpProject(projectData);
		// 	// await this.migrateConfigs(projectData);
		// 	await this.migrateDependencies(
		// 		projectData,
		// 		platforms,
		// 		loose
		// 	);
		// } catch (error) {
		// 	const backupFolders = MigrateController.pathsToBackup;
		// 	const embeddedPackagePath = path.join(
		// 		projectData.getAppDirectoryRelativePath(),
		// 		"package.json"
		// 	);
		// 	backupFolders.push(embeddedPackagePath);
		// 	this.restoreBackup(backupFolders, backupDir, projectData.projectDir);
		// 	this.spinner.fail();
		// 	// this.$errors.fail(
		// 	// 	`${MigrateController.migrateFailMessage} The error is: ${error}`
		// 	// );
		// }
		//
		// this.spinner.stop();
		// // this.spinner.info(MigrateController.MIGRATE_FINISH_MESSAGE);
	}

	private async _shouldMigrate({
		projectDir,
		platforms,
		loose,
	}: IMigrationData): Promise<boolean> {
		const isMigrate = _.get(this.$options, "argv._[0]") === "migrate";
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const projectInfo = this.$projectConfigService.detectProjectConfigs(
			projectData.projectDir
		);
		if (!isMigrate && projectInfo.hasNSConfig) {
			return;
		}

		const shouldMigrateCommonMessage =
			"The app is not compatible with this CLI version and it should be migrated. Reason: ";

		for (let i = 0; i < this.migrationDependencies.length; i++) {
			const dependency = this.migrationDependencies[i];
			const hasDependency = this.hasDependency(dependency, projectData);

			if (!hasDependency) {
				if (dependency.shouldAddIfMissing) {
					this.$logger.trace(
						`${shouldMigrateCommonMessage}'${dependency.packageName}' is missing.`
					);
					return true;
				}

				continue;
			}

			if (dependency.shouldMigrateAction) {
				const shouldMigrate = await dependency.shouldMigrateAction.bind(this)(
					dependency,
					projectData,
					loose
				);

				if (shouldMigrate) {
					this.$logger.trace(
						`${shouldMigrateCommonMessage}'${dependency.packageName}' requires an update.`
					);
					return true;
				}
			}

			if (dependency.replaceWith || dependency.shouldRemove) {
				this.$logger.trace(
					`${shouldMigrateCommonMessage}'${dependency.packageName}' is deprecated.`
				);

				// in loose mode we ignore deprecated dependencies
				if (loose) {
					continue;
				}

				return true;
			}

			const shouldUpdate = await this.shouldMigrateDependencyVersion(
				dependency,
				projectData,
				loose
			);

			if (shouldUpdate) {
				this.$logger.trace(
					`${shouldMigrateCommonMessage}'${dependency.packageName}' should be updated.`
				);

				return true;
			}
		}

		for (let platform of platforms) {
			platform = platform?.toLowerCase();

			if (
				!this.$platformValidationService.isValidPlatform(platform, projectData)
			) {
				continue;
			}

			const hasRuntimeDependency = this.hasRuntimeDependency({
				platform,
				projectData,
			});

			if (!hasRuntimeDependency) {
				continue;
			}

			const verifiedPlatformVersion = this.verifiedPlatformVersions[
				platform.toLowerCase()
			];
			const shouldUpdateRuntime = await this.shouldUpdateRuntimeVersion(
				verifiedPlatformVersion,
				platform,
				projectData,
				loose
			);

			if (!shouldUpdateRuntime) {
				continue;
			}

			this.$logger.trace(
				`${shouldMigrateCommonMessage}Platform '${platform}' should be updated.`
			);
			if (loose) {
				this.$logger.warn(
					`Platform '${platform}' should be updated. The minimum version supported is ${verifiedPlatformVersion.minVersion}`
				);
				continue;
			}

			return true;
		}

		return false;
	}

	private async shouldMigrateDependencyVersion(
		dependency: IMigrationDependency,
		projectData: IProjectData,
		loose: boolean
	): Promise<boolean> {
		const installedVersion = await this.$packageInstallationManager.getInstalledDependencyVersion(
			dependency.packageName,
			projectData.projectDir
		);

		const desiredVersion = dependency.desiredVersion ?? dependency.minVersion;
		const minVersion = dependency.minVersion ?? dependency.desiredVersion;

		if (
			dependency.shouldUseExactVersion &&
			installedVersion !== desiredVersion
		) {
			return true;
		}

		return this.isOutdatedVersion(
			installedVersion,
			{ minVersion, desiredVersion },
			loose
		);
	}

	private async shouldUpdateRuntimeVersion(
		version: IDependencyVersion,
		platform: string,
		projectData: IProjectData,
		loose: boolean
	): Promise<boolean> {
		const installedVersion = await this.getMaxRuntimeVersion({
			platform,
			projectData,
		});

		return this.isOutdatedVersion(installedVersion, version, loose);
	}

	private async getCachedShouldMigrate(
		projectDir: string,
		platform: string,
		loose: boolean = false
	): Promise<boolean> {
		let cachedShouldMigrateValue = null;

		const cachedHash = await this.$jsonFileSettingsService.getSettingValue(
			getHash(`${projectDir}${platform.toLowerCase()}`) + loose ? "-loose" : ""
		);
		const packageJsonHash = await this.getPackageJsonHash(projectDir);
		if (cachedHash === packageJsonHash) {
			cachedShouldMigrateValue = false;
		}

		return cachedShouldMigrateValue;
	}

	private async setCachedShouldMigrate(
		projectDir: string,
		platform: string,
		loose: boolean = false
	): Promise<void> {
		this.$logger.trace(
			`Caching shouldMigrate result for platform ${platform} (loose = ${loose}).`
		);
		const packageJsonHash = await this.getPackageJsonHash(projectDir);
		await this.$jsonFileSettingsService.saveSetting(
			getHash(`${projectDir}${platform.toLowerCase()}`) + loose ? "-loose" : "",
			packageJsonHash
		);
	}

	private async getPackageJsonHash(projectDir: string) {
		const projectPackageJsonFilePath = path.join(
			projectDir,
			constants.PACKAGE_JSON_FILE_NAME
		);
		return await this.$fs.getFileShasum(projectPackageJsonFilePath);
	}

	// private async migrateOldAndroidAppResources(
	// 	projectData: IProjectData,
	// 	backupDir: string
	// ) {
	// 	const appResourcesPath = projectData.getAppResourcesDirectoryPath();
	// 	if (!this.$androidResourcesMigrationService.hasMigrated(appResourcesPath)) {
	// 		this.spinner.info("Migrate old Android App_Resources structure.");
	// 		try {
	// 			await this.$androidResourcesMigrationService.migrate(
	// 				appResourcesPath,
	// 				backupDir
	// 			);
	// 		} catch (error) {
	// 			this.$logger.warn(
	// 				"Migrate old Android App_Resources structure failed: ",
	// 				error.message
	// 			);
	// 		}
	// 	}
	// }

	private async ensureGitCleanOrForce(projectDir: string): Promise<boolean> {
		const git: SimpleGit = simpleGit(projectDir);
		const isGit = await git.checkIsRepo();
		const isForce = this.$options.force;
		if (!isGit) {
			// not a git repo and no --force
			if (!isForce) {
				this.$logger.printMarkdown(
					`Running \`ns migrate\` in a non-git project is not recommended. If you want to skip this check run \`ns migrate --force\`.`
				);
				this.$errors.fail("Not in Git repo.");
				return false;
			}
			this.spinner.warn(`Not in Git repo, but using ${"--force".red}`);
			return true;
		}

		const isClean = (await git.status()).isClean();
		if (!isClean) {
			if (!isForce) {
				this.$logger.printMarkdown(
					`Current git branch has uncommitted changes. Please commit the changes and try again. Alternatively run \`ns migrate --force\` to skip this check.`
				);
				this.$errors.fail("Git branch not clean.");
				return false;
			}
			this.spinner.warn(`Git branch not clean, but using ${"--force".red}`);
			return true;
		}

		return true;
	}

	private async backupProject(projectDir: string): Promise<IBackup> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const backup = this.$projectBackupService.getBackup("migration");
		backup.addPaths([
			...MigrateController.pathsToBackup,
			path.join(projectData.getAppDirectoryRelativePath(), "package.json"),
		]);

		try {
			return backup.create();
		} catch (error) {
			this.spinner.fail(`Project backup failed.`);
			backup.remove();
			this.$errors.fail(`Project backup failed. Error is: ${error.message}`);
		}
	}

	private async cleanUpProject(projectData: IProjectData): Promise<void> {
		await this.$projectCleanupService.clean([
			constants.HOOKS_DIR_NAME,
			constants.PLATFORMS_DIR_NAME,
			constants.NODE_MODULES_FOLDER_NAME,
			constants.WEBPACK_CONFIG_NAME,
			constants.PACKAGE_LOCK_JSON_FILE_NAME,
		]);

		const {
			dependencies,
			devDependencies,
		} = await this.$pluginsService.getDependenciesFromPackageJson(
			projectData.projectDir
		);
		const hasSchematics = [...dependencies, ...devDependencies].find(
			(p) => p.name === "@nativescript/schematics"
		);

		if (!hasSchematics) {
			// clean tsconfig.tns.json if not in a shared project
			await this.$projectCleanupService.clean([
				constants.TSCCONFIG_TNS_JSON_NAME,
			]);
		}
	}

	private async handleAutoGeneratedFiles(
		backup: IBackup,
		projectData: IProjectData
	): Promise<void> {
		const globOptions: glob.IOptions = {
			silent: true,
			nocase: true,
			matchBase: true,
			nodir: true,
			absolute: false,
			cwd: projectData.appDirectoryPath,
		};

		const jsFiles = glob.sync("*.@(js|ts|js.map)", globOptions);
		const autoGeneratedJsFiles = this.getGeneratedFiles(
			jsFiles,
			[".js"],
			[".ts"]
		);
		const autoGeneratedJsMapFiles = this.getGeneratedFiles(
			jsFiles,
			[".map"],
			[""]
		);
		const cssFiles = glob.sync("*.@(less|sass|scss|css)", globOptions);
		const autoGeneratedCssFiles = this.getGeneratedFiles(
			cssFiles,
			[".css"],
			[".scss", ".sass", ".less"]
		);

		const allGeneratedFiles = autoGeneratedJsFiles
			.concat(autoGeneratedJsMapFiles)
			.concat(autoGeneratedCssFiles);

		const pathsToBackup = allGeneratedFiles.map((generatedFile) =>
			path.join(projectData.appDirectoryPath, generatedFile)
		);
		backup.addPaths(pathsToBackup);
		backup.create();

		if (backup.isUpToDate()) {
			await this.$projectCleanupService.clean(pathsToBackup);
		}
	}

	private getGeneratedFiles(
		allFiles: string[],
		generatedFileExts: string[],
		sourceFileExts: string[]
	): string[] {
		return allFiles.filter((file) => {
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
	}

	private isOutdatedVersion(
		current: string,
		target: IDependencyVersion,
		loose: boolean
	): boolean {
		// in loose mode, a falsy version is not considered outdated
		if (!current && loose) {
			return false;
		}

		const installed = semver.coerce(current);
		const min = semver.coerce(target.minVersion);
		const desired = semver.coerce(target.desiredVersion);

		// in loose mode we check if we satisfy the min version
		if (loose) {
			if (!installed || !min) {
				return false;
			}
			return semver.lt(installed, min);
		}

		if (!installed || !desired) {
			return true;
		}
		// otherwise we compare with the desired version
		return semver.lt(installed, desired);
	}

	private detectAppPath(projectDir: string, configData: INsConfig) {
		if (configData.appPath) {
			return configData.appPath;
		}

		const possibleAppPaths = [
			path.resolve(projectDir, constants.SRC_DIR),
			path.resolve(projectDir, constants.APP_FOLDER_NAME),
		];

		const appPath = possibleAppPaths.find((possiblePath) =>
			this.$fs.exists(possiblePath)
		);
		if (appPath) {
			const relativeAppPath = path
				.relative(projectDir, appPath)
				.replace(path.sep, "/");
			this.$logger.trace(`Found app source at '${appPath}'.`);
			return relativeAppPath.toString();
		}
	}

	private detectAppResourcesPath(projectDir: string, configData: INsConfig) {
		if (configData.appResourcesPath) {
			return configData.appResourcesPath;
		}

		const possibleAppResourcesPaths = [
			path.resolve(
				projectDir,
				configData.appPath,
				constants.APP_RESOURCES_FOLDER_NAME
			),
			path.resolve(projectDir, constants.APP_RESOURCES_FOLDER_NAME),
		];

		const appResourcesPath = possibleAppResourcesPaths.find((possiblePath) =>
			this.$fs.exists(possiblePath)
		);
		if (appResourcesPath) {
			const relativeAppResourcesPath = path
				.relative(projectDir, appResourcesPath)
				.replace(path.sep, "/");
			this.$logger.trace(`Found App_Resources at '${appResourcesPath}'.`);
			return relativeAppResourcesPath.toString();
		}
	}

	private async migrateDependencies(
		projectData: IProjectData,
		platforms: string[],
		loose: boolean
	): Promise<void> {
		for (let i = 0; i < this.migrationDependencies.length; i++) {
			const dependency = this.migrationDependencies[i];
			const hasDependency = this.hasDependency(dependency, projectData);

			if (!hasDependency && !dependency.shouldAddIfMissing) {
				continue;
			}

			if (dependency.migrateAction) {
				const shouldMigrate = await dependency.shouldMigrateAction.bind(this)(
					dependency,
					projectData,
					loose
				);

				if (shouldMigrate) {
					const newDependencies = await dependency.migrateAction(
						projectData,
						path.join(
							projectData.projectDir,
							MigrateController.backupFolderName
						)
					);
					for (const newDependency of newDependencies) {
						await this.migrateDependency(newDependency, projectData, loose);
					}
				}
			}

			await this.migrateDependency(dependency, projectData, loose);
		}

		for (const platform of platforms) {
			const lowercasePlatform = platform.toLowerCase();
			const hasRuntimeDependency = this.hasRuntimeDependency({
				platform,
				projectData,
			});

			if (!hasRuntimeDependency) {
				continue;
			}

			const shouldUpdate = await this.shouldUpdateRuntimeVersion(
				this.verifiedPlatformVersions[lowercasePlatform],
				platform,
				projectData,
				loose
			);

			if (!shouldUpdate) {
				continue;
			}

			const verifiedPlatformVersion = this.verifiedPlatformVersions[
				lowercasePlatform
			];
			const platformData = this.$platformsDataService.getPlatformData(
				lowercasePlatform,
				projectData
			);

			this.spinner.info(
				`Updating ${platform} platform to version ${verifiedPlatformVersion.desiredVersion.green}.`
			);

			await this.$addPlatformService.setPlatformVersion(
				platformData,
				projectData,
				verifiedPlatformVersion.desiredVersion
			);

			this.spinner.succeed();
		}
	}

	private async migrateDependency(
		dependency: IMigrationDependency,
		projectData: IProjectData,
		loose: boolean
	): Promise<void> {
		const hasDependency = this.hasDependency(dependency, projectData);

		// show warning if needed
		if (hasDependency && dependency.warning) {
			this.$logger.warn(dependency.warning);
		}

		if (!hasDependency) {
			if (!dependency.shouldAddIfMissing) {
				return;
			}
			const version = dependency.desiredVersion ?? dependency.minVersion;

			this.$pluginsService.addToPackageJson(
				dependency.packageName,
				version,
				dependency.isDev,
				projectData.projectDir
			);

			this.spinner.clear();
			this.$logger.info(
				`  - ${dependency.packageName.yellow} ${
					`${version}`.green
				} has been added`
			);
			this.spinner.render();

			return;
		}

		if (dependency.replaceWith || dependency.shouldRemove) {
			// remove
			this.$pluginsService.removeFromPackageJson(
				dependency.packageName,
				projectData.projectDir
			);

			// no replacement required - we're done
			if (!dependency.replaceWith) {
				return;
			}

			const replacementDep = _.find(
				this.migrationDependencies,
				(migrationPackage) =>
					migrationPackage.packageName === dependency.replaceWith
			);

			if (!replacementDep) {
				this.$errors.fail("Failed to find replacement dependency.");
			}

			const version = dependency.desiredVersion ?? dependency.minVersion;

			// add replacement dependency
			this.$pluginsService.addToPackageJson(
				replacementDep.packageName,
				version,
				replacementDep.isDev,
				projectData.projectDir
			);

			this.spinner.clear();
			this.$logger.info(
				`  - ${dependency.packageName.yellow} has been replaced with ${
					replacementDep.packageName.cyan
				} ${`${version}`.green}`
			);
			this.spinner.render();

			return;
		}

		const shouldMigrateVersion = await this.shouldMigrateDependencyVersion(
			dependency,
			projectData,
			loose
		);

		if (!shouldMigrateVersion) {
			return;
		}

		const version = dependency.desiredVersion ?? dependency.minVersion;

		this.$pluginsService.addToPackageJson(
			dependency.packageName,
			version,
			dependency.isDev,
			projectData.projectDir
		);

		this.spinner.clear();
		this.$logger.info(
			`  - ${dependency.packageName.yellow} has been updated to ${
				`${version}`.green
			}`
		);
		this.spinner.render();
	}

	private async migrateConfigs(projectDir: string): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(projectDir);

		// package.json
		const rootPackageJsonPath: any = path.resolve(
			projectDir,
			constants.PACKAGE_JSON_FILE_NAME
		);
		// nested package.json
		const embeddedPackageJsonPath = path.resolve(
			projectData.projectDir,
			projectData.getAppDirectoryRelativePath(),
			constants.PACKAGE_JSON_FILE_NAME
		);
		// nsconfig.json
		const legacyNsConfigPath = path.resolve(
			projectData.projectDir,
			constants.CONFIG_NS_FILE_NAME
		);

		let rootPackageJsonData: any = {};
		if (this.$fs.exists(rootPackageJsonPath)) {
			rootPackageJsonData = this.$fs.readJson(rootPackageJsonPath);
		}

		// write the default config unless it already exists
		const newConfigPath = this.$projectConfigService.writeDefaultConfig(
			projectData.projectDir
		);

		// force legacy config mode
		this.$projectConfigService.setForceUsingLegacyConfig(true);

		// all different sources are combined into configData (nested package.json, nsconfig and root package.json[nativescript])
		const configData = this.$projectConfigService.readConfig(
			projectData.projectDir
		);

		// we no longer want to force legacy config mode
		this.$projectConfigService.setForceUsingLegacyConfig(false);

		// move main key into root package.json
		if (configData.main) {
			rootPackageJsonData.main = configData.main;
			delete configData.main;
		}

		// detect appPath and App_Resources path
		configData.appPath = this.detectAppPath(projectDir, configData);
		configData.appResourcesPath = this.detectAppResourcesPath(
			projectDir,
			configData
		);

		// delete nativescript key from root package.json
		if (rootPackageJsonData.nativescript) {
			delete rootPackageJsonData.nativescript;
		}

		// force the config service to use nativescript.config.ts
		this.$projectConfigService.setForceUsingNewConfig(true);
		// migrate data into nativescript.config.ts
		const hasUpdatedConfigSuccessfully = await this.$projectConfigService.setValue(
			"", // root
			configData as { [key: string]: SupportedConfigValues }
		);

		if (!hasUpdatedConfigSuccessfully) {
			if (typeof newConfigPath === "string") {
				// only clean the config if it was created by the migration script
				await this.$projectCleanupService.cleanPath(newConfigPath);
			}

			this.$errors.fail(
				`Failed to migrate project to use ${constants.CONFIG_FILE_NAME_TS}. One or more values could not be updated.`
			);
		}

		// save root package.json
		this.$fs.writeJson(rootPackageJsonPath, rootPackageJsonData);

		// delete migrated files
		await this.$projectCleanupService.cleanPath(embeddedPackageJsonPath);
		await this.$projectCleanupService.cleanPath(legacyNsConfigPath);

		return true;
	}

	private async migrateUnitTestRunner(
		projectData: IProjectData,
		migrationBackupDirPath: string
	): Promise<IMigrationDependency[]> {
		// Migrate karma.conf.js
		const pathToKarmaConfig = path.join(
			migrationBackupDirPath,
			constants.KARMA_CONFIG_NAME
		);
		if (this.$fs.exists(pathToKarmaConfig)) {
			const oldKarmaContent = this.$fs.readText(pathToKarmaConfig);

			const regExp = /frameworks:\s+\[([\S\s]*?)\]/g;
			const matches = regExp.exec(oldKarmaContent);
			const frameworks =
				(matches && matches[1] && matches[1].trim()) || '["jasmine"]';

			const testsDir = path.join(projectData.appDirectoryPath, "tests");
			const relativeTestsDir = path.relative(projectData.projectDir, testsDir);
			const testFiles = `'${fromWindowsRelativePathToUnix(
				relativeTestsDir
			)}/**/*.*'`;

			const karmaConfTemplate = this.$resources.readText("test/karma.conf.js");
			const karmaConf = _.template(karmaConfTemplate)({
				frameworks,
				testFiles,
			});
			this.$fs.writeFile(
				path.join(projectData.projectDir, constants.KARMA_CONFIG_NAME),
				karmaConf
			);
		}

		// Dependencies to migrate
		const dependencies: IMigrationDependency[] = [
			{
				packageName: "karma-webpack",
				minVersion: "3.0.5",
				desiredVersion: "~5.0.0",
				isDev: true,
				shouldAddIfMissing: true,
			},
			{
				packageName: "karma-jasmine",
				minVersion: "2.0.1",
				desiredVersion: "~4.0.1",
				isDev: true,
			},
			{
				packageName: "karma-mocha",
				minVersion: "1.3.0",
				desiredVersion: "~2.0.1",
				isDev: true,
			},
			{
				packageName: "karma-chai",
				minVersion: "0.1.0",
				desiredVersion: "~0.1.0",
				isDev: true,
			},
			{
				packageName: "karma-qunit",
				minVersion: "3.1.2",
				desiredVersion: "~4.1.2",
				isDev: true,
			},
			{
				packageName: "karma",
				minVersion: "4.1.0",
				desiredVersion: "~6.3.2",
				isDev: true,
			},
		];

		return dependencies;
	}

	private async migrateTSConfig(tsConfigPath: string): Promise<boolean> {
		try {
			const configContents = this.$fs.readJson(tsConfigPath);

			// update
			configContents.compilerOptions = configContents.compilerOptions || {};
			configContents.compilerOptions.target = "es2017";
			configContents.compilerOptions.module = "esnext";
			configContents.compilerOptions.moduleResolution = "node";
			configContents.compilerOptions.experimentalDecorators = true;
			configContents.compilerOptions.removeComments = false;

			configContents.compilerOptions.lib = [
				...new Set([...(configContents.compilerOptions.lib || []), "es2017"]),
			];

			this.$fs.writeJson(tsConfigPath, configContents);

			return true;
		} catch (error) {
			this.$logger.trace("Failed to migrate tsconfig.json. Error is: ", error);
			return false;
		}
	}

	private async migrateNativeScriptAngular(): Promise<IMigrationDependency[]> {
		const minVersion = "10.0.0";
		const desiredVersion = "~11.2.7";

		/*
    "@angular/router": "~11.2.7",
     */

		const dependencies: IMigrationDependency[] = [
			{
				packageName: "@angular/animations",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "@angular/common",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "@angular/compiler",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "@angular/core",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "@angular/forms",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "@angular/platform-browser",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "@angular/platform-browser-dynamic",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "@angular/router",
				minVersion,
				desiredVersion,
				shouldAddIfMissing: true,
			},
			{
				packageName: "rxjs",
				minVersion: "6.6.0",
				desiredVersion: "~6.6.7",
				shouldAddIfMissing: true,
			},
			{
				packageName: "zone.js",
				minVersion: "0.11.1",
				desiredVersion: "~0.11.1",
				shouldAddIfMissing: true,
			},

			// devDependencies
			{
				packageName: "@angular/compiler-cli",
				minVersion,
				desiredVersion,
				isDev: true,
			},
			{
				packageName: "@ngtools/webpack",
				minVersion,
				desiredVersion: "~11.2.6",
				isDev: true,
			},

			// obsolete
			{
				packageName: "@angular-devkit/build-angular",
				shouldRemove: true,
			},
		];

		return dependencies;
	}

	private async migrateNativeScriptVue(): Promise<IMigrationDependency[]> {
		const dependencies: IMigrationDependency[] = [
			{
				packageName: "nativescript-vue-template-compiler",
				minVersion: "2.7.0",
				desiredVersion: "~2.8.4",
				isDev: true,
				shouldAddIfMissing: true,
			},
			{
				packageName: "nativescript-vue-devtools",
				minVersion: "1.4.0",
				desiredVersion: "~1.5.0",
				isDev: true,
			},
			{
				packageName: "vue-loader",
				shouldRemove: true,
			},
			{
				packageName: "babel-loader",
				shouldRemove: true,
			},
			{
				packageName: "@babel/core",
				shouldRemove: true,
			},
			{
				packageName: "@babel/preset-env",
				shouldRemove: true,
			},
			// remove any version of vue
			{
				packageName: "vue",
				shouldRemove: true,
			},
			// add latest
			{
				packageName: "vue",
				desiredVersion: "2.6.12",
				isDev: true,
			},
		];

		return dependencies;
	}

	private async migrateNativeScriptSvelte(): Promise<IMigrationDependency[]> {
		const dependencies: IMigrationDependency[] = [
			{
				packageName: "svelte-native-nativescript-ui",
				minVersion: "0.9.0",
				desiredVersion: "~0.9.0",
				isDev: true,
				shouldAddIfMissing: true,
			},
			{
				packageName: "svelte-native-preprocessor",
				minVersion: "0.2.0",
				desiredVersion: "~0.2.0",
				isDev: true,
				shouldAddIfMissing: true,
			},
			{
				packageName: "svelte-loader",
				shouldRemove: true,
			},
			{
				packageName: "svelte-loader-hot",
				shouldRemove: true,
			},
			{
				packageName: "svelte",
				shouldRemove: true,
			},
			{
				packageName: "svelte",
				minVersion: "3.24.1",
				desiredVersion: "3.24.1",
				shouldUseExactVersion: true,
				isDev: true,
			},
		];

		return dependencies;
	}

	private async migrateWebpack(): Promise<IMigrationDependency[]> {
		const webpackDependencies = [
			"@angular-devkit/core",
			"clean-webpack-plugin",
			"copy-webpack-plugin",
			"css",
			"css-loader",
			"escape-string-regexp",
			"fork-ts-checker-webpack-plugin",
			"global-modules-path",
			"loader-utils",
			"minimatch",
			"@nativescript/hook",
			"nativescript-worker-loader",
			"properties-reader",
			"proxy-lib",
			"raw-loader",
			"resolve-url-loader",
			"sass-loader",
			"sax",
			"schema-utils",
			"semver",
			"shelljs",
			"tapable",
			"terser",
			"terser-webpack-plugin",
			"ts-loader",
			"webpack",
			"webpack-bundle-analyzer",
			"webpack-cli",
			"webpack-sources",
		];

		return webpackDependencies.map((dep) => {
			return {
				packageName: dep,
				shouldRemove: true,
			};
		});
	}

	private async migrateWebpack5(projectDir: string, projectData: IProjectData) {
		this.spinner.start(`Initializing new ${"webpack.config.js".yellow}`);
		const { desiredVersion: webpackVersion } = this.migrationDependencies.find(
			(dep) => dep.packageName === constants.WEBPACK_PLUGIN_NAME
		);

		try {
			await this.$childProcess.spawnFromEvent(
				"npx",
				[
					"--package",
					`@nativescript/webpack@${webpackVersion}`,
					"nativescript-webpack",
					"init",
				],
				"close",
				{
					cwd: projectDir,
					stdio: "ignore",
				}
			);
		} catch (err) {
			this.$logger.trace(
				"Failed to initialize webpack.config.js. Error is: ",
				err
			);
			this.$logger.printMarkdown(
				`Failed to initialize \`webpack.config.js\`, you can try again by running \`npm install\` (or yarn, pnpm) and then \`npx @nativescript/webpack init\`.`
			);
		}
		this.spinner.succeed(`Initialized new ${"webpack.config.js".yellow}`);

		const packageJSON = this.$fs.readJson(projectData.projectFilePath);
		const currentMain = packageJSON.main ?? "app.js";
		const currentMainTS = currentMain.replace(/.js$/, ".ts");

		const appPath = projectData.appDirectoryPath;

		const possibleMains = [
			`./${appPath}/${currentMain}`,
			`./${appPath}/${currentMainTS}`,
			`./${appPath}/main.js`,
			`./${appPath}/main.ts`,
			`./app/${currentMain}`,
			`./app/${currentMainTS}`,
			`./src/${currentMain}`,
			`./src/${currentMainTS}`,
			`./app/main.js`,
			`./app/main.ts`,
			`./src/main.js`,
			`./src/main.ts`,
		];
		const replacedMain = possibleMains.find((possibleMain) => {
			return this.$fs.exists(path.resolve(projectDir, possibleMain));
		});

		if (replacedMain) {
			packageJSON.main = replacedMain;
			this.$fs.writeJson(projectData.projectFilePath, packageJSON);

			this.spinner.info(
				`Updated ${"package.json".yellow} main field to ${replacedMain.green}`
			);
		} else {
			this.$logger.warn();
			this.$logger.warn("Note:\n-----");
			this.$logger.printMarkdown(
				`Could not determine the correct \`main\` field for \`package.json\`. Make sure to update it manually, pointing to the actual entry file relative to the \`package.json\`.\n`
			);
		}
	}

	private async runESLint(projectDir: string) {
		this.spinner.start(`Running ESLint fixes`);
		try {
			const childProcess = injector.resolve("childProcess") as IChildProcess;
			const npxVersion = await childProcess.exec("npx -v");

			const npxFlags = [];

			if (semver.gt(semver.coerce(npxVersion), "7.0.0")) {
				npxFlags.push("-y");
			}

			const args = [
				"npx",
				...npxFlags,
				"@nativescript/eslint-plugin",
				projectDir,
			];
			await childProcess.exec(args.join(" "));
			this.spinner.succeed(`Applied ESLint fixes`);
		} catch (err) {
			this.spinner.fail(`Failed to apply ESLint fixes`);
			this.$logger.trace("Failed to apply ESLint fixes. Error is:", err);
		}
	}
}

injector.register("migrateController", MigrateController);
