import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import { globSync, GlobOptions } from "glob";
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
} from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IPluginsService } from "../definitions/plugins";
import {
	IChildProcess,
	IErrors,
	IFileSystem,
	IResourceLoader,
	ISettingsService,
} from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { IJsonFileSettingsService } from "../common/definitions/json-file-settings-service";
import { SupportedConfigValues } from "../tools/config-manipulation/config-transformer";
import * as fs from "fs";
import { tmpdir } from "os";
import { color } from "../color";
import {
	ITerminalSpinner,
	ITerminalSpinnerService,
} from "../definitions/terminal-spinner-service";

// const wait: (ms: number) => Promise<void> = (ms: number = 1000) =>
// 	new Promise((resolve) => setTimeout(resolve, ms));

export class MigrateController
	extends UpdateControllerBase
	implements IMigrateController
{
	constructor(
		protected $fs: IFileSystem,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $platformsDataService: IPlatformsDataService,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		protected $pacoteService: IPacoteService,
		// private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $logger: ILogger,
		private $errors: IErrors,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $projectConfigService: IProjectConfigService,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $resources: IResourceLoader,
		private $injector: IInjector,
		private $settingsService: ISettingsService,
		private $staticConfig: Config.IStaticConfig,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $projectCleanupService: IProjectCleanupService,
		private $projectBackupService: IProjectBackupService,
		private $childProcess: IChildProcess,
	) {
		super(
			$fs,
			$platformCommandHelper,
			$platformsDataService,
			$packageInstallationManager,
			$packageManager,
			$pacoteService,
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
			`should-migrate-cache-${cliVersion}.json`,
		);
		this.$logger.trace(
			`Migration cache path is: ${shouldMigrateCacheFilePath}`,
		);
		return this.$injector.resolve("jsonFileSettingsService", {
			jsonFileSettingsPath: shouldMigrateCacheFilePath,
		});
	}

	private migrationDependencies: IMigrationDependency[] = [
		{
			packageName: "@nativescript/core",
			minVersion: "6.5.0",
			desiredVersion: "~8.9.0",
			shouldAddIfMissing: true,
		},
		{
			packageName: "tns-core-modules",
			shouldRemove: true,
		},
		{
			packageName: "@nativescript/types",
			minVersion: "7.0.0",
			desiredVersion: "~8.9.0",
			isDev: true,
		},
		{
			packageName: "tns-platform-declarations",
			replaceWith: "@nativescript/types",
			minVersion: "6.5.0",
			isDev: true,
		},
		{
			packageName: "tns-core-modules-widgets",
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
			desiredVersion: "~5.0.0",
			shouldAddIfMissing: true,
			isDev: true,
		},
		{
			packageName: "nativescript-vue",
			minVersion: "2.7.0",
			desiredVersion: "~2.9.3",
			async shouldMigrateAction(
				dependency: IMigrationDependency,
				projectData: IProjectData,
				loose: boolean,
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}

				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose,
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
			desiredVersion: "^19.0.0",
			async shouldMigrateAction(
				dependency: IMigrationDependency,
				projectData: IProjectData,
				loose: boolean,
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}

				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose,
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
				loose: boolean,
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}
				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose,
				);
			},
			migrateAction: this.migrateNativeScriptSvelte.bind(this),
		},
		{
			packageName: "nativescript-unit-test-runner",
			replaceWith: "@nativescript/unit-test-runner",
			shouldRemove: true,
			isDev: true,
			async shouldMigrateAction() {
				return true;
			},
			migrateAction: this.migrateUnitTestRunner.bind(this),
		},
		{
			packageName: "@nativescript/unit-test-runner",
			minVersion: "1.0.0",
			desiredVersion: "~3.0.0",
			async shouldMigrateAction(
				dependency: IMigrationDependency,
				projectData: IProjectData,
				loose: boolean,
			) {
				if (!this.hasDependency(dependency, projectData)) {
					return false;
				}
				return await this.shouldMigrateDependencyVersion(
					dependency,
					projectData,
					loose,
				);
			},
			migrateAction: this.migrateUnitTestRunner.bind(this),
		},
		{
			packageName: "typescript",
			isDev: true,
			minVersion: "3.7.0",
			desiredVersion: "~5.7.0",
		},
		{
			packageName: "node-sass",
			replaceWith: "sass",
			minVersion: "0.0.0", // ignore
			isDev: true,
			// shouldRemove: true,
		},
		{
			packageName: "sass",
			minVersion: "0.0.0", // ignore
			desiredVersion: "^1.49.9",
			isDev: true,
			// shouldRemove: true,
		},

		// runtimes
		{
			packageName: "tns-ios",
			minVersion: "6.5.3",
			replaceWith: "@nativescript/ios",
			isDev: true,
		},
		{
			packageName: "tns-android",
			minVersion: "6.5.4",
			replaceWith: "@nativescript/android",
			isDev: true,
		},
		{
			packageName: "@nativescript/ios",
			minVersion: "6.5.3",
			desiredVersion: "~8.9.0",
			isDev: true,
		},
		{
			packageName: "@nativescript/android",
			minVersion: "7.0.0",
			desiredVersion: "~8.9.0",
			isDev: true,
		},
	];

	public async shouldMigrate({
		projectDir,
		platforms,
		loose = false,
	}: IMigrationData): Promise<boolean> {
		const remainingPlatforms = [];

		let shouldMigrate = false;

		for (const platform of platforms) {
			if (!loose) {
				remainingPlatforms.push(platform);
				continue;
			}

			// should only run in loose mode...
			const cachedResult = await this.getCachedShouldMigrate(
				projectDir,
				platform,
			);
			this.$logger.trace(
				`Got cached result for shouldMigrate for platform: ${platform}: ${cachedResult}`,
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
				loose,
			});
			this.$logger.trace(
				`Executed shouldMigrate for platforms: ${remainingPlatforms}. Result is: ${shouldMigrate}`,
			);

			// only cache results if running in loose mode
			if (!shouldMigrate && loose) {
				for (const remainingPlatform of remainingPlatforms) {
					await this.setCachedShouldMigrate(projectDir, remainingPlatform);
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
				`The current application is not compatible with NativeScript CLI ${this.$staticConfig.version}.\n\nRun 'ns migrate' to migrate your project to the latest NativeScript version.\n\nAlternatively you may try running it with '--force' to skip this check.`,
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
		this.spinner.info("Backing up project files before migration");

		const backup = await this.backupProject(projectDir);

		this.spinner.succeed("Project files have been backed up");

		// clean up project files
		this.spinner.info("Cleaning up project files before migration");

		await this.cleanUpProject(projectData);

		this.spinner.succeed("Project files have been cleaned up");

		// clean up artifacts
		this.spinner.info("Cleaning up old artifacts");

		await this.handleAutoGeneratedFiles(backup, projectData);

		this.spinner.succeed("Cleaned old artifacts");

		const newConfigPath = path.resolve(projectDir, "nativescript.config.ts");
		if (!this.$fs.exists(newConfigPath)) {
			// migrate configs
			this.spinner.info(
				`Migrating project to use ${color.green("nativescript.config.ts")}`,
			);

			await this.migrateConfigs(projectDir);

			this.spinner.succeed(
				`Project has been migrated to use ${color.green(
					"nativescript.config.ts",
				)}`,
			);
		}

		// update dependencies
		this.spinner.info("Updating project dependencies");

		await this.migrateDependencies(projectData, platforms, loose);

		this.spinner.succeed("Project dependencies have been updated");

		const isAngular = this.hasDependency(
			{
				packageName: "@nativescript/angular",
			},
			projectData,
		);

		// ensure polyfills.ts exists in angular projects
		let polyfillsPath;
		if (isAngular) {
			polyfillsPath = await this.checkOrCreatePolyfillsTS(projectData);
		}

		// update tsconfig
		const tsConfigPath = path.resolve(projectDir, "tsconfig.json");
		if (this.$fs.exists(tsConfigPath)) {
			this.spinner.info(`Updating ${color.yellow("tsconfig.json")}`);

			await this.migrateTSConfig({
				tsConfigPath,
				isAngular,
				polyfillsPath,
			});

			this.spinner.succeed(`Updated ${color.yellow("tsconfig.json")}`);
		}

		await this.migrateWebpack5(projectDir, projectData);

		// run @nativescript/eslint over codebase
		await this.runESLint(projectDir);

		this.spinner.succeed("Migration complete.");

		this.$logger.info("");
		this.$logger.printMarkdown(
			"Project has been successfully migrated. The next step is to run `ns run <platform>` to ensure everything is working properly." +
				"\n\nPlease note that you may need additional changes to complete the migration.",
			// + "\n\nYou may restore your project with `ns migrate restore`"
		);

		// print markdown for next steps:
		// if no runtime has been added, print a message that it will be added when they run ns run <platform>
		// if all is good, run ns migrate clean to clean up backup folders

		// in case of failure, print diagnostic data: what failed and why
		// restore all files - or perhaps let the user sort it out
		// or ns migrate restore - to restore from pre-migration backup
		// for some known cases, print suggestions perhaps
	}

	private async _shouldMigrate({
		projectDir,
		platforms,
		loose,
	}: IMigrationData): Promise<boolean> {
		const isMigrate = _.get(this.$options, "argv._[0]") === "migrate";
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const projectInfo = this.$projectConfigService.detectProjectConfigs(
			projectData.projectDir,
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
						`${shouldMigrateCommonMessage}'${dependency.packageName}' is missing.`,
					);

					if (loose) {
						// in loose mode we ignore missing dependencies
						continue;
					}

					return true;
				}

				continue;
			}

			if (dependency.shouldMigrateAction) {
				const shouldMigrate = await dependency.shouldMigrateAction.bind(this)(
					dependency,
					projectData,
					loose,
				);

				if (shouldMigrate) {
					this.$logger.trace(
						`${shouldMigrateCommonMessage}'${dependency.packageName}' requires an update.`,
					);
					return true;
				}
			}

			if (dependency.replaceWith || dependency.shouldRemove) {
				this.$logger.trace(
					`${shouldMigrateCommonMessage}'${dependency.packageName}' is deprecated.`,
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
				loose,
			);

			if (shouldUpdate) {
				this.$logger.trace(
					`${shouldMigrateCommonMessage}'${dependency.packageName}' should be updated.`,
				);

				return true;
			}
		}

		return false;
	}

	private async shouldMigrateDependencyVersion(
		dependency: IMigrationDependency,
		projectData: IProjectData,
		loose: boolean,
	): Promise<boolean> {
		const installedVersion =
			await this.$packageInstallationManager.getInstalledDependencyVersion(
				dependency.packageName,
				projectData.projectDir,
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
			loose,
		);
	}

	private async getCachedShouldMigrate(
		projectDir: string,
		platform: string,
	): Promise<boolean> {
		let cachedShouldMigrateValue = null;

		const cachedHash = await this.$jsonFileSettingsService.getSettingValue(
			getHash(`${projectDir}${platform.toLowerCase()}`),
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
	): Promise<void> {
		this.$logger.trace(
			`Caching shouldMigrate result for platform ${platform}.`,
		);
		const packageJsonHash = await this.getPackageJsonHash(projectDir);
		await this.$jsonFileSettingsService.saveSetting(
			getHash(`${projectDir}${platform.toLowerCase()}`),
			packageJsonHash,
		);
	}

	private async getPackageJsonHash(projectDir: string) {
		const projectPackageJsonFilePath = path.join(
			projectDir,
			constants.PACKAGE_JSON_FILE_NAME,
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
					`Running \`ns migrate\` in a non-git project is not recommended. If you want to skip this check run \`ns migrate --force\`.`,
				);
				this.$errors.fail("Not in Git repo.");
				return false;
			}
			this.spinner.warn(`Not in Git repo, but using ${color.red("--force")}`);
			return true;
		}

		const isClean = (await git.status()).isClean();
		if (!isClean) {
			if (!isForce) {
				this.$logger.printMarkdown(
					`Current git branch has uncommitted changes. Please commit the changes and try again. Alternatively run \`ns migrate --force\` to skip this check.`,
				);
				this.$errors.fail("Git branch not clean.");
				return false;
			}
			this.spinner.warn(
				`Git branch not clean, but using ${color.red("--force")}`,
			);
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
			this.$projectData.getBuildRelativeDirectoryPath(),
			constants.NODE_MODULES_FOLDER_NAME,
			constants.PACKAGE_LOCK_JSON_FILE_NAME,
		]);

		const { dependencies, devDependencies } =
			await this.$pluginsService.getDependenciesFromPackageJson(
				projectData.projectDir,
			);
		const hasSchematics = [...dependencies, ...devDependencies].find(
			(p) => p.name === "@nativescript/schematics",
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
		projectData: IProjectData,
	): Promise<void> {
		const globOptions: GlobOptions = {
			nocase: true,
			matchBase: true,
			nodir: true,
			absolute: false,
			cwd: projectData.appDirectoryPath,
			withFileTypes: false,
		};

		const jsFiles = globSync("*.@(js|ts|js.map)", globOptions) as string[];
		const autoGeneratedJsFiles = this.getGeneratedFiles(
			jsFiles,
			[".js"],
			[".ts"],
		);
		const autoGeneratedJsMapFiles = this.getGeneratedFiles(
			jsFiles,
			[".map"],
			[""],
		);
		const cssFiles = globSync(
			"*.@(less|sass|scss|css)",
			globOptions,
		) as string[];
		const autoGeneratedCssFiles = this.getGeneratedFiles(
			cssFiles,
			[".css"],
			[".scss", ".sass", ".less"],
		);

		const allGeneratedFiles = autoGeneratedJsFiles
			.concat(autoGeneratedJsMapFiles)
			.concat(autoGeneratedCssFiles);

		const pathsToBackup = allGeneratedFiles.map((generatedFile) =>
			path.join(projectData.appDirectoryPath, generatedFile),
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
		sourceFileExts: string[],
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
		loose: boolean,
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
			this.$fs.exists(possiblePath),
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
				constants.APP_RESOURCES_FOLDER_NAME,
			),
			path.resolve(projectDir, constants.APP_RESOURCES_FOLDER_NAME),
		];

		const appResourcesPath = possibleAppResourcesPaths.find((possiblePath) =>
			this.$fs.exists(possiblePath),
		);
		if (appResourcesPath) {
			const relativeAppResourcesPath = path
				.relative(projectDir, appResourcesPath)
				.replace(path.sep, "/");
			this.$logger.trace(`Found App_Resources at '${appResourcesPath}'.`);
			return relativeAppResourcesPath.toString();
		}
	}

	private async runMigrateActionIfAny(
		dependency: IMigrationDependency,
		projectData: IProjectData,
		loose: boolean,
		force: boolean = false,
	): Promise<void> {
		if (dependency.migrateAction) {
			const shouldMigrate =
				force ||
				(await dependency.shouldMigrateAction.bind(this)(
					dependency,
					projectData,
					loose,
				));

			if (shouldMigrate) {
				const newDependencies = await dependency.migrateAction(
					projectData,
					path.join(projectData.projectDir, MigrateController.backupFolderName),
				);
				for (const newDependency of newDependencies) {
					await this.migrateDependency(newDependency, projectData, loose);
				}
			}
		}
	}

	private async migrateDependencies(
		projectData: IProjectData,
		platforms: string[],
		loose: boolean,
	): Promise<void> {
		for (let i = 0; i < this.migrationDependencies.length; i++) {
			const dependency = this.migrationDependencies[i];
			const hasDependency = this.hasDependency(dependency, projectData);

			if (!hasDependency && !dependency.shouldAddIfMissing) {
				continue;
			}

			await this.runMigrateActionIfAny(dependency, projectData, loose);

			await this.migrateDependency(dependency, projectData, loose);
		}
	}

	private async migrateDependency(
		dependency: IMigrationDependency,
		projectData: IProjectData,
		loose: boolean,
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
				projectData.projectDir,
			);

			this.spinner.clear();
			this.$logger.info(
				`  - ${color.yellow(dependency.packageName)} ${color.green(
					version,
				)} has been added`,
			);
			this.spinner.render();

			return;
		}

		if (dependency.replaceWith || dependency.shouldRemove) {
			// remove
			this.$pluginsService.removeFromPackageJson(
				dependency.packageName,
				projectData.projectDir,
			);

			// no replacement required - we're done
			if (!dependency.replaceWith) {
				return;
			}

			const replacementDep = _.find(
				this.migrationDependencies,
				(migrationPackage) =>
					migrationPackage.packageName === dependency.replaceWith,
			);

			if (!replacementDep) {
				this.$errors.fail("Failed to find replacement dependency.");
			}

			const version =
				replacementDep.desiredVersion ??
				replacementDep.minVersion ??
				dependency.desiredVersion ??
				dependency.minVersion;

			// add replacement dependency
			this.$pluginsService.addToPackageJson(
				replacementDep.packageName,
				version,
				replacementDep.isDev,
				projectData.projectDir,
			);

			this.spinner.clear();
			this.$logger.info(
				`  - ${color.yellow(
					dependency.packageName,
				)} has been replaced with ${color.cyan(
					replacementDep.packageName,
				)} ${color.green(version)}`,
			);
			this.spinner.render();

			await this.runMigrateActionIfAny(
				replacementDep,
				projectData,
				loose,
				true,
			);

			return;
		}

		const shouldMigrateVersion = await this.shouldMigrateDependencyVersion(
			dependency,
			projectData,
			loose,
		);

		if (!shouldMigrateVersion) {
			return;
		}

		const version = dependency.desiredVersion ?? dependency.minVersion;

		this.$pluginsService.addToPackageJson(
			dependency.packageName,
			version,
			dependency.isDev,
			projectData.projectDir,
		);

		this.spinner.clear();
		this.$logger.info(
			`  - ${color.yellow(
				dependency.packageName,
			)} has been updated to ${color.green(version)}`,
		);
		this.spinner.render();
	}

	private async migrateConfigs(projectDir: string): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(projectDir);

		// package.json
		const rootPackageJsonPath: any = path.resolve(
			projectDir,
			constants.PACKAGE_JSON_FILE_NAME,
		);
		// nested package.json
		const embeddedPackageJsonPath = path.resolve(
			projectData.projectDir,
			projectData.getAppDirectoryRelativePath(),
			constants.PACKAGE_JSON_FILE_NAME,
		);
		// nsconfig.json
		const legacyNsConfigPath = path.resolve(
			projectData.projectDir,
			constants.CONFIG_NS_FILE_NAME,
		);

		let rootPackageJsonData: any = {};
		if (this.$fs.exists(rootPackageJsonPath)) {
			rootPackageJsonData = this.$fs.readJson(rootPackageJsonPath);
		}

		// write the default config unless it already exists
		const newConfigPath = this.$projectConfigService.writeDefaultConfig(
			projectData.projectDir,
		);

		// force legacy config mode
		this.$projectConfigService.setForceUsingLegacyConfig(true);

		// all different sources are combined into configData (nested package.json, nsconfig and root package.json[nativescript])
		const configData = this.$projectConfigService.readConfig(
			projectData.projectDir,
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
			configData,
		);

		// delete nativescript key from root package.json
		if (rootPackageJsonData.nativescript) {
			delete rootPackageJsonData.nativescript;
		}

		// force the config service to use nativescript.config.ts
		this.$projectConfigService.setForceUsingNewConfig(true);
		// migrate data into nativescript.config.ts
		const hasUpdatedConfigSuccessfully =
			await this.$projectConfigService.setValue(
				"", // root
				configData as { [key: string]: SupportedConfigValues },
			);

		if (!hasUpdatedConfigSuccessfully) {
			if (typeof newConfigPath === "string") {
				// only clean the config if it was created by the migration script
				await this.$projectCleanupService.cleanPath(newConfigPath);
			}

			this.$errors.fail(
				`Failed to migrate project to use ${constants.CONFIG_FILE_NAME_TS}. One or more values could not be updated.`,
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
		migrationBackupDirPath: string,
	): Promise<IMigrationDependency[]> {
		// Migrate karma.conf.js
		const pathToKarmaConfig = path.join(
			migrationBackupDirPath,
			constants.KARMA_CONFIG_NAME,
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
				relativeTestsDir,
			)}/**/*.*'`;

			const karmaConfTemplate = this.$resources.readText("test/karma.conf.js");
			const karmaConf = _.template(karmaConfTemplate)({
				frameworks,
				testFiles,
				basePath: projectData.getAppDirectoryRelativePath(),
			});
			this.$fs.writeFile(
				path.join(projectData.projectDir, constants.KARMA_CONFIG_NAME),
				karmaConf,
			);
		}

		// Dependencies to migrate
		const dependencies: IMigrationDependency[] = [
			{
				packageName: "karma-webpack",
				shouldRemove: true,
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
				desiredVersion: "~6.3.4",
				isDev: true,
			},
		];

		return dependencies;
	}

	private async migrateTSConfig({
		tsConfigPath,
		isAngular,
		polyfillsPath,
	}: {
		tsConfigPath: string;
		isAngular: boolean;
		polyfillsPath?: string;
	}): Promise<boolean> {
		try {
			const configContents = this.$fs.readJson(tsConfigPath);

			// update
			configContents.compilerOptions = configContents.compilerOptions || {};
			configContents.compilerOptions.target = "es2020";
			configContents.compilerOptions.module = "esnext";
			configContents.compilerOptions.moduleResolution = "node";
			configContents.compilerOptions.experimentalDecorators = true;
			configContents.compilerOptions.removeComments = false;

			configContents.compilerOptions.lib = [
				...new Set([...(configContents.compilerOptions.lib || []), "ESNext"]),
			];

			if (isAngular) {
				// make sure polyfills.ts is in files
				if (configContents.files) {
					configContents.files = [
						...new Set([
							...(configContents.files || []),
							polyfillsPath ?? "./src/polyfills.ts",
						]),
					];
				}
			}

			this.$fs.writeJson(tsConfigPath, configContents);

			return true;
		} catch (error) {
			this.$logger.trace("Failed to migrate tsconfig.json. Error is: ", error);
			return false;
		}
	}

	private async checkOrCreatePolyfillsTS(
		projectData: IProjectData,
	): Promise<string> {
		const { projectDir, appDirectoryPath } = projectData;

		const possiblePaths = [
			`${appDirectoryPath}/polyfills.ts`,
			`./src/polyfills.ts`,
			`./app/polyfills.ts`,
		].map((possiblePath) => path.resolve(projectDir, possiblePath));

		let polyfillsPath = possiblePaths.find((possiblePath) => {
			return this.$fs.exists(possiblePath);
		});

		if (polyfillsPath) {
			return "./" + path.relative(projectDir, polyfillsPath);
		}

		const tempDir = fs.mkdtempSync(
			path.join(tmpdir(), "migrate-angular-polyfills-"),
		);

		// get from default angular template
		await this.$pacoteService.extractPackage(
			constants.RESERVED_TEMPLATE_NAMES["angular"],
			tempDir,
		);

		this.$fs.copyFile(
			path.resolve(tempDir, "src/polyfills.ts"),
			possiblePaths[0],
		);

		// clean up temp project
		this.$fs.deleteDirectory(tempDir);

		this.spinner.succeed(`Created fresh ${color.cyan("polyfills.ts")}`);

		return "./" + path.relative(projectDir, possiblePaths[0]);
	}

	private async migrateNativeScriptAngular(): Promise<IMigrationDependency[]> {
		const minVersion = "10.0.0";
		const desiredVersion = "~19.1.0";

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
				desiredVersion: "~7.8.0",
				shouldAddIfMissing: true,
			},
			{
				packageName: "zone.js",
				minVersion: "0.11.1",
				desiredVersion: "~0.15.0",
				shouldAddIfMissing: true,
			},

			// devDependencies
			{
				packageName: "@angular/cli",
				minVersion,
				desiredVersion,
				isDev: true,
			},
			{
				packageName: "@angular/compiler-cli",
				minVersion,
				desiredVersion,
				isDev: true,
			},
			{
				packageName: "@ngtools/webpack",
				minVersion,
				desiredVersion,
				isDev: true,
			},
			{
				packageName: "@angular-devkit/build-angular",
				minVersion,
				desiredVersion,
				isDev: true,
			},
		];

		return dependencies;
	}

	private async migrateNativeScriptVue(): Promise<IMigrationDependency[]> {
		const dependencies: IMigrationDependency[] = [
			{
				packageName: "nativescript-vue-template-compiler",
				minVersion: "2.7.0",
				desiredVersion: "~2.9.3",
				isDev: true,
				shouldAddIfMissing: true,
			},
			{
				packageName: "nativescript-vue-devtools",
				minVersion: "1.4.0",
				desiredVersion: "~1.5.1",
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
				packageName: "babel-traverse",
				shouldRemove: true,
			},
			{
				packageName: "babel-types",
				shouldRemove: true,
			},
			{
				packageName: "babylon",
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
		const webpackConfigPath = path.resolve(projectDir, "webpack.config.js");
		if (this.$fs.exists(webpackConfigPath)) {
			const webpackConfigContent = this.$fs.readText(webpackConfigPath);

			if (webpackConfigContent.includes("webpack.init(")) {
				this.spinner.succeed(
					`Project already using new ${color.yellow("webpack.config.js")}`,
				);
				return;
			}
		}
		// clean old config before generating new one
		await this.$projectCleanupService.clean(["webpack.config.js"]);

		this.spinner.info(`Initializing new ${color.yellow("webpack.config.js")}`);
		const { desiredVersion: webpackVersion } = this.migrationDependencies.find(
			(dep) => dep.packageName === constants.WEBPACK_PLUGIN_NAME,
		);

		try {
			const scopedWebpackPackage = constants.WEBPACK_PLUGIN_NAME;
			const resolvedVersion =
				await this.$packageInstallationManager.getMaxSatisfyingVersion(
					scopedWebpackPackage,
					webpackVersion,
				);
			await this.runNPX([
				"--package",
				`${scopedWebpackPackage}@${resolvedVersion}`,
				"nativescript-webpack",
				"init",
			]);
			this.spinner.succeed(
				`Initialized new ${color.yellow("webpack.config.js")}`,
			);
		} catch (err) {
			this.spinner.fail(
				`Failed to initialize ${color.yellow("webpack.config.js")}`,
			);
			this.$logger.trace(
				"Failed to initialize webpack.config.js. Error is: ",
				err,
			);
			this.$logger.printMarkdown(
				`You can try again by running \`npm install\` (or yarn, pnpm) and then \`npx @nativescript/webpack init\`.`,
			);
		}

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
		].map((possibleMain) => path.resolve(projectDir, possibleMain));

		let replacedMain = possibleMains.find((possibleMain) => {
			return this.$fs.exists(possibleMain);
		});

		if (replacedMain) {
			replacedMain = `./${path.relative(projectDir, replacedMain)}`.replace(
				/\\/g,
				"/",
			);
			packageJSON.main = replacedMain;
			this.$fs.writeJson(projectData.projectFilePath, packageJSON);

			this.spinner.info(
				`Updated ${color.yellow("package.json")} main field to ${color.green(
					replacedMain,
				)}`,
			);
		} else {
			this.$logger.warn();
			this.$logger.warn("Note:\n-----");
			this.$logger.printMarkdown(
				`Could not determine the correct \`main\` field for \`package.json\`. Make sure to update it manually, pointing to the actual entry file relative to the \`package.json\`.\n`,
			);
		}
	}

	private async runESLint(projectDir: string) {
		this.spinner.start(`Running ESLint fixes`);
		try {
			await this.runNPX(["@nativescript/eslint-plugin", projectDir]);
			this.spinner.succeed(`Applied ESLint fixes`);
		} catch (err) {
			this.spinner.fail(`Failed to apply ESLint fixes`);
			this.$logger.trace("Failed to apply ESLint fixes. Error is:", err);
		}
	}

	private async runNPX(args: string[] = []) {
		const npxVersion = await this.$childProcess.exec("npx -v");
		const npxFlags = [];

		if (semver.gt(semver.coerce(npxVersion), "7.0.0")) {
			npxFlags.push("-y");
		}

		const args_ = ["npx", ...npxFlags, ...args];
		await this.$childProcess.exec(args_.join(" "));
	}
}

injector.register("migrateController", MigrateController);
