import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as semver from "semver";
import * as projectServiceBaseLib from "./platform-project-service-base";
import { DeviceAndroidDebugBridge } from "../common/mobile/android/device-android-debug-bridge";
import { attachAwaitDetach, isRecommendedAarFile } from "../common/helpers";
import { Configurations, LiveSyncPaths } from "../common/constants";
import { SpawnOptions } from "child_process";

export class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";
	private static ANDROID_PLATFORM_NAME = "android";
	private static MIN_RUNTIME_VERSION_WITH_GRADLE = "1.5.0";
	private static MIN_RUNTIME_VERSION_WITHOUT_DEPS = "4.2.0-2018-06-29-02";

	private isAndroidStudioTemplate: boolean;

	constructor(private $androidToolsInfo: IAndroidToolsInfo,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		$projectDataService: IProjectDataService,
		private $injector: IInjector,
		private $pluginVariablesService: IPluginVariablesService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $npm: INodePackageManager,
		private $androidPluginBuildService: IAndroidPluginBuildService,
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService) {
		super($fs, $projectDataService);
		this.isAndroidStudioTemplate = false;
	}

	private _platformData: IPlatformData = null;
	public getPlatformData(projectData: IProjectData): IPlatformData {
		if (!projectData && !this._platformData) {
			throw new Error("First call of getPlatformData without providing projectData.");
		}
		if (projectData && projectData.platformsDir) {
			const projectRoot = path.join(projectData.platformsDir, AndroidProjectService.ANDROID_PLATFORM_NAME);
			if (this.isAndroidStudioCompatibleTemplate(projectData)) {
				this.isAndroidStudioTemplate = true;
			}

			const appDestinationDirectoryArr = [projectRoot];
			if (this.isAndroidStudioTemplate) {
				appDestinationDirectoryArr.push(constants.APP_FOLDER_NAME);
			}
			appDestinationDirectoryArr.push(constants.SRC_DIR, constants.MAIN_DIR, constants.ASSETS_DIR);

			const configurationsDirectoryArr = [projectRoot];
			if (this.isAndroidStudioTemplate) {
				configurationsDirectoryArr.push(constants.APP_FOLDER_NAME);
			}
			configurationsDirectoryArr.push(constants.SRC_DIR, constants.MAIN_DIR, constants.MANIFEST_FILE_NAME);

			const deviceBuildOutputArr = [projectRoot];
			if (this.isAndroidStudioTemplate) {
				deviceBuildOutputArr.push(constants.APP_FOLDER_NAME);
			}
			deviceBuildOutputArr.push(constants.BUILD_DIR, constants.OUTPUTS_DIR, constants.APK_DIR);

			const packageName = this.getProjectNameFromId(projectData);

			this._platformData = {
				frameworkPackageName: constants.TNS_ANDROID_RUNTIME_NAME,
				normalizedPlatformName: "Android",
				appDestinationDirectoryPath: path.join(...appDestinationDirectoryArr),
				platformProjectService: this,
				projectRoot: projectRoot,
				deviceBuildOutputPath: path.join(...deviceBuildOutputArr),
				getValidBuildOutputData: (buildOptions: IBuildOutputOptions): IValidBuildOutputData => {
					const buildMode = buildOptions.isReleaseBuild ? Configurations.Release.toLowerCase() : Configurations.Debug.toLowerCase();

					return {
						packageNames: [
							`${packageName}-${buildMode}${constants.APK_EXTENSION_NAME}`,
							`${projectData.projectName}-${buildMode}${constants.APK_EXTENSION_NAME}`,
							`${projectData.projectName}${constants.APK_EXTENSION_NAME}`,
							`${constants.APP_FOLDER_NAME}-${buildMode}${constants.APK_EXTENSION_NAME}`
						],
						regexes: [new RegExp(`${constants.APP_FOLDER_NAME}-.*-(${Configurations.Debug}|${Configurations.Release})${constants.APK_EXTENSION_NAME}`, "i"), new RegExp(`${packageName}-.*-(${Configurations.Debug}|${Configurations.Release})${constants.APK_EXTENSION_NAME}`, "i")]
					};
				},
				frameworkFilesExtensions: [".jar", ".dat", ".so"],
				configurationFileName: constants.MANIFEST_FILE_NAME,
				configurationFilePath: path.join(...configurationsDirectoryArr),
				relativeToFrameworkConfigurationFilePath: path.join(constants.SRC_DIR, constants.MAIN_DIR, constants.MANIFEST_FILE_NAME),
				fastLivesyncFileExtensions: [".jpg", ".gif", ".png", ".bmp", ".webp"] // http://developer.android.com/guide/appendix/media-formats.html
			};

		}

		return this._platformData;
	}

	public getCurrentPlatformVersion(platformData: IPlatformData, projectData: IProjectData): string {
		const currentPlatformData: IDictionary<any> = this.$projectDataService.getNSValue(projectData.projectDir, platformData.frameworkPackageName);

		return currentPlatformData && currentPlatformData[constants.VERSION_STRING];
	}

	public validateOptions(): Promise<boolean> {
		return Promise.resolve(true);
	}

	public getAppResourcesDestinationDirectoryPath(projectData: IProjectData): string {
		const appResourcesDirStructureHasMigrated = this.$androidResourcesMigrationService.hasMigrated(projectData.getAppResourcesDirectoryPath());

		if (appResourcesDirStructureHasMigrated) {
			return this.getUpdatedAppResourcesDestinationDirPath(projectData);
		} else {
			return this.getLegacyAppResourcesDestinationDirPath(projectData);
		}
	}

	public async validate(projectData: IProjectData): Promise<IValidateOutput> {
		this.validatePackageName(projectData.projectId);
		this.validateProjectName(projectData.projectName);

		const checkEnvironmentRequirementsOutput = await this.$platformEnvironmentRequirements.checkEnvironmentRequirements(this.getPlatformData(projectData).normalizedPlatformName, projectData.projectDir);
		this.$androidToolsInfo.validateTargetSdk({ showWarningsAsErrors: true });

		return {
			checkEnvironmentRequirementsOutput
		};
	}

	public async validatePlugins(): Promise<void> { /* */ }

	public async createProject(frameworkDir: string, frameworkVersion: string, projectData: IProjectData, config: ICreateProjectOptions): Promise<void> {
		if (semver.lt(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
			this.$errors.failWithoutHelp(`The NativeScript CLI requires Android runtime ${AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE} or later to work properly.`);
		}

		this.$fs.ensureDirectoryExists(this.getPlatformData(projectData).projectRoot);
		const androidToolsInfo = this.$androidToolsInfo.getToolsInfo();
		const targetSdkVersion = androidToolsInfo && androidToolsInfo.targetSdkVersion;
		this.$logger.trace(`Using Android SDK '${targetSdkVersion}'.`);

		this.isAndroidStudioTemplate = this.isAndroidStudioCompatibleTemplate(projectData, frameworkVersion);
		if (this.isAndroidStudioTemplate) {
			this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "*", "-R");
		} else {
			this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "libs", "-R");

			if (config.pathToTemplate) {
				const mainPath = path.join(this.getPlatformData(projectData).projectRoot, constants.SRC_DIR, constants.MAIN_DIR);
				this.$fs.createDirectory(mainPath);
				shell.cp("-R", path.join(path.resolve(config.pathToTemplate), "*"), mainPath);
			} else {
				this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, constants.SRC_DIR, "-R");
			}
			this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "build.gradle settings.gradle build-tools", "-Rf");

			try {
				this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradle.properties", "-Rf");
			} catch (e) {
				this.$logger.warn(`\n${e}\nIt's possible, the final .apk file will contain all architectures instead of the ones described in the abiFilters!\nYou can fix this by using the latest android platform.`);
			}

			this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradle", "-R");
			this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradlew gradlew.bat", "-f");
		}

		this.cleanResValues(targetSdkVersion, projectData);

		if (semver.lt(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITHOUT_DEPS)) {
			await this.installRuntimeDeps(projectData, config);
		}
	}

	private async installRuntimeDeps(projectData: IProjectData, config: ICreateProjectOptions) {
		const requiredDevDependencies = [
			{ name: "babel-traverse", version: "^6.4.5" },
			{ name: "babel-types", version: "^6.4.5" },
			{ name: "babylon", version: "^6.4.5" },
			{ name: "lazy", version: "^1.0.11" }
		];

		const npmConfig: INodePackageManagerInstallOptions = {
			save: true,
			"save-dev": true,
			"save-exact": true,
			silent: true,
			disableNpmInstall: false,
			frameworkPath: config.frameworkPath,
			ignoreScripts: config.ignoreScripts
		};

		const projectPackageJson: any = this.$fs.readJson(projectData.projectFilePath);

		for (const dependency of requiredDevDependencies) {
			let dependencyVersionInProject = (projectPackageJson.dependencies && projectPackageJson.dependencies[dependency.name]) ||
				(projectPackageJson.devDependencies && projectPackageJson.devDependencies[dependency.name]);

			if (!dependencyVersionInProject) {
				await this.$npm.install(`${dependency.name}@${dependency.version}`, projectData.projectDir, npmConfig);
			} else {
				const cleanedVersion = semver.clean(dependencyVersionInProject);

				// The plugin version is not valid. Check node_modules for the valid version.
				if (!cleanedVersion) {
					const pathToPluginPackageJson = path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME, dependency.name, constants.PACKAGE_JSON_FILE_NAME);
					dependencyVersionInProject = this.$fs.exists(pathToPluginPackageJson) && this.$fs.readJson(pathToPluginPackageJson).version;
				}

				if (!semver.satisfies(dependencyVersionInProject || cleanedVersion, dependency.version)) {
					this.$errors.failWithoutHelp(`Your project have installed ${dependency.name} version ${cleanedVersion} but Android platform requires version ${dependency.version}.`);
				}
			}
		}
	}

	private cleanResValues(targetSdkVersion: number, projectData: IProjectData): void {
		const resDestinationDir = this.getAppResourcesDestinationDirectoryPath(projectData);
		const directoriesInResFolder = this.$fs.readDirectory(resDestinationDir);
		const directoriesToClean = directoriesInResFolder
			.map(dir => {
				return {
					dirName: dir,
					sdkNum: parseInt(dir.substr(AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX.length))
				};
			})
			.filter(dir => dir.dirName.match(AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX)
				&& dir.sdkNum
				&& (!targetSdkVersion || (targetSdkVersion < dir.sdkNum)))
			.map(dir => path.join(resDestinationDir, dir.dirName));

		this.$logger.trace("Directories to clean:");

		this.$logger.trace(directoriesToClean);

		_.map(directoriesToClean, dir => this.$fs.deleteDirectory(dir));
	}

	public async interpolateData(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void> {
		// Interpolate the apilevel and package
		this.interpolateConfigurationFile(projectData, platformSpecificData);
		const appResourcesDirectoryPath = projectData.getAppResourcesDirectoryPath();

		let stringsFilePath: string;

		const appResourcesDestinationDirectoryPath = this.getAppResourcesDestinationDirectoryPath(projectData);
		if (this.$androidResourcesMigrationService.hasMigrated(appResourcesDirectoryPath)) {
			stringsFilePath = path.join(appResourcesDestinationDirectoryPath, constants.MAIN_DIR, constants.RESOURCES_DIR, 'values', 'strings.xml');
		} else {
			stringsFilePath = path.join(appResourcesDestinationDirectoryPath, 'values', 'strings.xml');
		}

		shell.sed('-i', /__NAME__/, projectData.projectName, stringsFilePath);
		shell.sed('-i', /__TITLE_ACTIVITY__/, projectData.projectName, stringsFilePath);

		const gradleSettingsFilePath = path.join(this.getPlatformData(projectData).projectRoot, "settings.gradle");
		shell.sed('-i', /__PROJECT_NAME__/, this.getProjectNameFromId(projectData), gradleSettingsFilePath);

		try {
			// will replace applicationId in app/App_Resources/Android/app.gradle if it has not been edited by the user
			const appGradleContent = this.$fs.readText(projectData.appGradlePath);
			if (appGradleContent.indexOf(constants.PACKAGE_PLACEHOLDER_NAME) !== -1) {
				shell.sed('-i', new RegExp(constants.PACKAGE_PLACEHOLDER_NAME), projectData.projectId, projectData.appGradlePath);
			}
		} catch (e) {
			this.$logger.warn(`\n${e}.\nCheck if you're using an outdated template and update it.`);
		}
	}

	public interpolateConfigurationFile(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): void {
		const manifestPath = this.getPlatformData(projectData).configurationFilePath;
		shell.sed('-i', /__PACKAGE__/, projectData.projectId, manifestPath);
		if (this.$androidToolsInfo.getToolsInfo().androidHomeEnvVar) {
			const sdk = (platformSpecificData && platformSpecificData.sdk) || (this.$androidToolsInfo.getToolsInfo().compileSdkVersion || "").toString();
			shell.sed('-i', /__APILEVEL__/, sdk, manifestPath);
		}
	}

	private getProjectNameFromId(projectData: IProjectData): string {
		let id: string;
		if (projectData && projectData.projectId) {
			const idParts = projectData.projectId.split(".");
			id = idParts[idParts.length - 1];
		}

		return id;
	}

	public afterCreateProject(projectRoot: string): void {
		return null;
	}

	public canUpdatePlatform(newInstalledModuleDir: string, projectData: IProjectData): boolean {
		return true;
	}

	public async updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean, projectData: IProjectData, addPlatform?: Function, removePlatforms?: (platforms: string[]) => Promise<void>): Promise<boolean> {
		if (semver.eq(newVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
			const platformLowercase = this.getPlatformData(projectData).normalizedPlatformName.toLowerCase();
			await removePlatforms([platformLowercase.split("@")[0]]);
			await addPlatform(platformLowercase);
			return false;
		}

		return true;
	}

	public async buildProject(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		const gradleArgs = this.getGradleBuildOptions(buildConfig, projectData);
		if (this.$logger.getLevel() === "TRACE") {
			gradleArgs.unshift("--stacktrace");
			gradleArgs.unshift("--debug");
		}
		if (buildConfig.release) {
			gradleArgs.unshift("assembleRelease");
		} else {
			gradleArgs.unshift("assembleDebug");
		}

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
		};

		await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
			this.$childProcess,
			handler,
			this.executeCommand({
				projectRoot: this.getPlatformData(projectData).projectRoot,
				gradleArgs,
				childProcessOpts: { stdio: buildConfig.buildOutputStdio || "inherit" },
				spawnFromEventOptions: { emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true },
				message: "Gradle build..."
			})
		);
	}

	private getGradleBuildOptions(settings: IAndroidBuildOptionsSettings, projectData: IProjectData): Array<string> {
		const configurationFilePath = this.getPlatformData(projectData).configurationFilePath;

		const buildOptions: Array<string> = this.getBuildOptions(configurationFilePath);

		if (settings.release) {
			buildOptions.push("-Prelease");
			buildOptions.push(`-PksPath=${path.resolve(settings.keyStorePath)}`);
			buildOptions.push(`-Palias=${settings.keyStoreAlias}`);
			buildOptions.push(`-Ppassword=${settings.keyStoreAliasPassword}`);
			buildOptions.push(`-PksPassword=${settings.keyStorePassword}`);
		}

		return buildOptions;
	}

	private getBuildOptions(configurationFilePath?: string): Array<string> {
		this.$androidToolsInfo.validateInfo({ showWarningsAsErrors: true, validateTargetSdk: true });

		const androidToolsInfo = this.$androidToolsInfo.getToolsInfo();
		const compileSdk = androidToolsInfo.compileSdkVersion;
		const targetSdk = this.getTargetFromAndroidManifest(configurationFilePath) || compileSdk;
		const buildToolsVersion = androidToolsInfo.buildToolsVersion;
		const appCompatVersion = androidToolsInfo.supportRepositoryVersion;
		const generateTypings = androidToolsInfo.generateTypings;
		const buildOptions = [
			`-PcompileSdk=android-${compileSdk}`,
			`-PtargetSdk=${targetSdk}`,
			`-PbuildToolsVersion=${buildToolsVersion}`,
			`-PsupportVersion=${appCompatVersion}`,
			`-PgenerateTypings=${generateTypings}`
		];

		return buildOptions;
	}

	public async buildForDeploy(projectRoot: string, projectData: IProjectData, buildConfig?: IBuildConfig): Promise<void> {
		return this.buildProject(projectRoot, projectData, buildConfig);
	}

	public isPlatformPrepared(projectRoot: string, projectData: IProjectData): boolean {
		return this.$fs.exists(path.join(this.getPlatformData(projectData).appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
	}

	public getFrameworkFilesExtensions(): string[] {
		return [".jar", ".dat"];
	}

	public async prepareProject(): Promise<void> {
		// Intentionally left empty.
	}

	public ensureConfigurationFileInAppResources(projectData: IProjectData): void {
		const appResourcesDirectoryPath = projectData.appResourcesDirectoryPath;
		const appResourcesDirStructureHasMigrated = this.$androidResourcesMigrationService.hasMigrated(appResourcesDirectoryPath);
		let originalAndroidManifestFilePath;

		if (appResourcesDirStructureHasMigrated) {
			originalAndroidManifestFilePath = path.join(appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, "src", "main", this.getPlatformData(projectData).configurationFileName);
		} else {
			originalAndroidManifestFilePath = path.join(appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, this.getPlatformData(projectData).configurationFileName);
		}

		const manifestExists = this.$fs.exists(originalAndroidManifestFilePath);

		if (!manifestExists) {
			this.$logger.warn('No manifest found in ' + originalAndroidManifestFilePath);
			return;
		}
		// Overwrite the AndroidManifest from runtime.
		if (!appResourcesDirStructureHasMigrated) {
			this.$fs.copyFile(originalAndroidManifestFilePath, this.getPlatformData(projectData).configurationFilePath);
		}
	}

	public prepareAppResources(appResourcesDirectoryPath: string, projectData: IProjectData): void {
		this.cleanUpPreparedResources(appResourcesDirectoryPath, projectData);
	}

	public async preparePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		if (!this.runtimeVersionIsGreaterThanOrEquals(projectData, "3.3.0")) {
			const pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME);
			await this.processResourcesFromPlugin(pluginData, pluginPlatformsFolderPath, projectData);
		} else if (this.runtimeVersionIsGreaterThanOrEquals(projectData, "4.0.0")) {
			// build Android plugins which contain AndroidManifest.xml and/or resources
			const pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME);
			if (this.$fs.exists(pluginPlatformsFolderPath)) {
				const options: IBuildOptions = {
					projectDir: projectData.projectDir,
					pluginName: pluginData.name,
					platformsAndroidDirPath: pluginPlatformsFolderPath,
					aarOutputDir: pluginPlatformsFolderPath,
					tempPluginDirPath: path.join(projectData.platformsDir, "tempPlugin")
				};

				await this.prebuildNativePlugin(options);
			}
		}

		// Do nothing, the Android Gradle script will configure itself based on the input dependencies.json
	}

	public async checkIfPluginsNeedBuild(projectData: IProjectData): Promise<Array<{ platformsAndroidDirPath: string, pluginName: string }>> {
		const detectedPlugins: Array<{ platformsAndroidDirPath: string, pluginName: string }> = [];

		const platformsAndroid = path.join(constants.PLATFORMS_DIR_NAME, "android");
		const pathToPlatformsAndroid = path.join(projectData.projectDir, platformsAndroid);
		const dependenciesJson = await this.$fs.readJson(path.join(pathToPlatformsAndroid, constants.DEPENDENCIES_JSON_NAME));
		const productionDependencies = dependenciesJson.map((item: any) => {
			return path.resolve(pathToPlatformsAndroid, item.directory);
		});

		for (const dependency of productionDependencies) {
			const jsonContent = this.$fs.readJson(path.join(dependency, constants.PACKAGE_JSON_FILE_NAME));
			const isPlugin = !!jsonContent.nativescript;
			const pluginName = jsonContent.name;
			if (isPlugin) {
				const platformsAndroidDirPath = path.join(dependency, platformsAndroid);
				if (this.$fs.exists(platformsAndroidDirPath)) {
					let hasGeneratedAar = false;
					let generatedAarPath = "";
					const nativeFiles = this.$fs.enumerateFilesInDirectorySync(platformsAndroidDirPath).filter((item) => {
						if (isRecommendedAarFile(item, pluginName)) {
							generatedAarPath = item;
							hasGeneratedAar = true;
						}
						return this.isAllowedFile(item);
					});

					if (hasGeneratedAar) {
						const aarStat = this.$fs.getFsStats(generatedAarPath);
						nativeFiles.forEach((item) => {
							const currentItemStat = this.$fs.getFsStats(item);
							if (currentItemStat.mtime > aarStat.mtime) {
								detectedPlugins.push({
									platformsAndroidDirPath,
									pluginName
								});
							}
						});
					} else if (nativeFiles.length > 0) {
						detectedPlugins.push({
							platformsAndroidDirPath,
							pluginName
						});
					}
				}
			}
		}
		return detectedPlugins;
	}

	private isAllowedFile(item: string): boolean {
		return item.endsWith(constants.MANIFEST_FILE_NAME) || item.endsWith(constants.RESOURCES_DIR);
	}

	public async prebuildNativePlugin(options: IBuildOptions): Promise<void> {
		if (await this.$androidPluginBuildService.buildAar(options)) {
			this.$logger.info(`Built aar for ${options.pluginName}`);
		}

		this.$androidPluginBuildService.migrateIncludeGradle(options);
	}

	public async processConfigurationFilesFromAppResources(): Promise<void> {
		return;
	}

	private async processResourcesFromPlugin(pluginData: IPluginData, pluginPlatformsFolderPath: string, projectData: IProjectData): Promise<void> {
		const configurationsDirectoryPath = path.join(this.getPlatformData(projectData).projectRoot, "configurations");
		this.$fs.ensureDirectoryExists(configurationsDirectoryPath);

		const pluginConfigurationDirectoryPath = path.join(configurationsDirectoryPath, pluginData.name);
		if (this.$fs.exists(pluginPlatformsFolderPath)) {
			this.$fs.ensureDirectoryExists(pluginConfigurationDirectoryPath);

			const isScoped = pluginData.name.indexOf("@") === 0;
			const flattenedDependencyName = isScoped ? pluginData.name.replace("/", "_") : pluginData.name;

			// Copy all resources from plugin
			const resourcesDestinationDirectoryPath = path.join(this.getPlatformData(projectData).projectRoot, constants.SRC_DIR, flattenedDependencyName);
			this.$fs.ensureDirectoryExists(resourcesDestinationDirectoryPath);
			shell.cp("-Rf", path.join(pluginPlatformsFolderPath, "*"), resourcesDestinationDirectoryPath);

			const filesForInterpolation = this.$fs.enumerateFilesInDirectorySync(resourcesDestinationDirectoryPath, file => this.$fs.getFsStats(file).isDirectory() || path.extname(file) === constants.XML_FILE_EXTENSION) || [];
			for (const file of filesForInterpolation) {
				this.$logger.trace(`Interpolate data for plugin file: ${file}`);
				await this.$pluginVariablesService.interpolate(pluginData, file, projectData);
			}
		}

		// Copy include.gradle file
		const includeGradleFilePath = path.join(pluginPlatformsFolderPath, constants.INCLUDE_GRADLE_NAME);
		if (this.$fs.exists(includeGradleFilePath)) {
			shell.cp("-f", includeGradleFilePath, pluginConfigurationDirectoryPath);
		}
	}

	public async removePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		try {
			if (!this.runtimeVersionIsGreaterThanOrEquals(projectData, "3.3.0")) {
				const pluginConfigDir = path.join(this.getPlatformData(projectData).projectRoot, "configurations", pluginData.name);
				if (this.$fs.exists(pluginConfigDir)) {
					await this.cleanProject(this.getPlatformData(projectData).projectRoot, projectData);
				}
			}
		} catch (e) {
			if (e.code === "ENOENT") {
				this.$logger.debug("No native code jars found: " + e.message);
			} else {
				throw e;
			}
		}
	}

	public async afterPrepareAllPlugins(projectData: IProjectData): Promise<void> {
		return;
	}

	public async beforePrepareAllPlugins(projectData: IProjectData, dependencies?: IDependencyData[]): Promise<void> {
		const shouldUseNewRoutine = this.runtimeVersionIsGreaterThanOrEquals(projectData, "3.3.0");

		if (dependencies) {
			dependencies = this.filterUniqueDependencies(dependencies);
			if (shouldUseNewRoutine) {
				this.provideDependenciesJson(projectData, dependencies);
			} else {
				const platformDir = path.join(projectData.platformsDir, AndroidProjectService.ANDROID_PLATFORM_NAME);
				const buildDir = path.join(platformDir, "build-tools");
				const checkV8dependants = path.join(buildDir, "check-v8-dependants.js");
				if (this.$fs.exists(checkV8dependants)) {
					const stringifiedDependencies = JSON.stringify(dependencies);
					try {
						await this.spawn('node', [checkV8dependants, stringifiedDependencies, projectData.platformsDir], { stdio: "inherit" });
					} catch (e) {
						this.$logger.info("Checking for dependants on v8 public API failed. This is likely caused because of cyclic production dependencies. Error code: " + e.code + "\nMore information: https://github.com/NativeScript/nativescript-cli/issues/2561");
					}
				}
			}
		}

		if (!shouldUseNewRoutine) {
			const projectRoot = this.getPlatformData(projectData).projectRoot;
			await this.cleanProject(projectRoot, projectData);
		}
	}

	private filterUniqueDependencies(dependencies: IDependencyData[]): IDependencyData[] {
		const depsDictionary = dependencies.reduce((dict, dep) => {
			const collision = dict[dep.name];
			// in case there are multiple dependencies to the same module, the one declared in the package.json takes precedence
			if (!collision || collision.depth > dep.depth) {
				dict[dep.name] = dep;
			}
			return dict;
		}, <IDictionary<IDependencyData>>{});
		return _.values(depsDictionary);
	}

	private provideDependenciesJson(projectData: IProjectData, dependencies: IDependencyData[]): void {
		const platformDir = path.join(projectData.platformsDir, AndroidProjectService.ANDROID_PLATFORM_NAME);
		const dependenciesJsonPath = path.join(platformDir, constants.DEPENDENCIES_JSON_NAME);
		const nativeDependencies = dependencies
			.filter(AndroidProjectService.isNativeAndroidDependency)
			.map(({ name, directory }) => ({ name, directory: path.relative(platformDir, directory) }));
		const jsonContent = JSON.stringify(nativeDependencies, null, 4);

		this.$fs.writeFile(dependenciesJsonPath, jsonContent);
	}

	private static isNativeAndroidDependency({ nativescript }: IDependencyData): boolean {
		return nativescript && (nativescript.android || (nativescript.platforms && nativescript.platforms.android));
	}

	public stopServices(projectRoot: string): Promise<ISpawnResult> {
		return this.executeCommand({
			projectRoot,
			gradleArgs: ["--stop", "--quiet"],
			childProcessOpts: { stdio: "pipe" },
			message: "Gradle stop services..."
		});
	}

	public async cleanProject(projectRoot: string, projectData: IProjectData): Promise<void> {
		if (this.$androidToolsInfo.getToolsInfo().androidHomeEnvVar) {
			const gradleArgs = this.getGradleBuildOptions({ release: false }, projectData);
			gradleArgs.unshift("clean");
			await this.executeCommand({
				projectRoot,
				gradleArgs,
				message: "Gradle clean..."
			});
		}
	}

	public async cleanDeviceTempFolder(deviceIdentifier: string, projectData: IProjectData): Promise<void> {
		const adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
		const deviceRootPath = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${projectData.projectId}`;
		await adb.executeShellCommand(["rm", "-rf", deviceRootPath]);
	}

	public async checkForChanges(changesInfo: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): Promise<void> {
		// Nothing android specific to check yet.
	}

	private copy(projectRoot: string, frameworkDir: string, files: string, cpArg: string): void {
		const paths = files.split(' ').map(p => path.join(frameworkDir, p));
		shell.cp(cpArg, paths, projectRoot);
	}

	private async spawn(command: string, args: string[], opts?: any, spawnOpts?: ISpawnFromEventOptions): Promise<ISpawnResult> {
		return this.$childProcess.spawnFromEvent(command, args, "close", opts || { stdio: "inherit" }, spawnOpts);
	}

	private validatePackageName(packageName: string): void {
		//Make the package conform to Java package types
		//Enforce underscore limitation
		if (!/^[a-zA-Z]+(\.[a-zA-Z0-9][a-zA-Z0-9_]*)+$/.test(packageName)) {
			this.$errors.fail("Package name must look like: com.company.Name");
		}

		//Class is a reserved word
		if (/\b[Cc]lass\b/.test(packageName)) {
			this.$errors.fail("class is a reserved word");
		}
	}

	private validateProjectName(projectName: string): void {
		if (projectName === '') {
			this.$errors.fail("Project name cannot be empty");
		}

		//Classes in Java don't begin with numbers
		if (/^[0-9]/.test(projectName)) {
			this.$errors.fail("Project name must not begin with a number");
		}
	}

	private getTargetFromAndroidManifest(configurationFilePath: string): string {
		let versionInManifest: string;
		if (this.$fs.exists(configurationFilePath)) {
			const targetFromAndroidManifest: string = this.$fs.readText(configurationFilePath);
			if (targetFromAndroidManifest) {
				const match = targetFromAndroidManifest.match(/.*?android:targetSdkVersion=\"(.*?)\"/);
				if (match && match[1]) {
					versionInManifest = match[1];
				}
			}
		}

		return versionInManifest;
	}

	private async executeCommand(opts: { projectRoot: string, gradleArgs: any, childProcessOpts?: SpawnOptions, spawnFromEventOptions?: ISpawnFromEventOptions, message: string }): Promise<ISpawnResult> {
		if (this.$androidToolsInfo.getToolsInfo().androidHomeEnvVar) {
			const { projectRoot, gradleArgs, message, spawnFromEventOptions } = opts;
			const gradlew = this.$hostInfo.isWindows ? "gradlew.bat" : "./gradlew";

			if (this.$logger.getLevel() === "INFO") {
				gradleArgs.push("--quiet");
			}

			this.$logger.info(message);

			const childProcessOpts = opts.childProcessOpts || {};
			childProcessOpts.cwd = childProcessOpts.cwd || projectRoot;
			childProcessOpts.stdio = childProcessOpts.stdio || "inherit";
			let commandResult;
			try {
				commandResult = await this.spawn(gradlew,
					gradleArgs,
					childProcessOpts,
					spawnFromEventOptions);
			} catch (err) {
				this.$errors.failWithoutHelp(err.message);
			}

			return commandResult;
		}
	}

	private isAndroidStudioCompatibleTemplate(projectData: IProjectData, frameworkVersion?: string): boolean {
		const currentPlatformData: IDictionary<any> = this.$projectDataService.getNSValue(projectData.projectDir, constants.TNS_ANDROID_RUNTIME_NAME);
		const platformVersion = (currentPlatformData && currentPlatformData[constants.VERSION_STRING]) || frameworkVersion;

		if (!platformVersion) {
			return true;
		}

		if (platformVersion === constants.PackageVersion.NEXT || platformVersion === constants.PackageVersion.LATEST || platformVersion === constants.PackageVersion.RC) {
			return true;
		}

		const androidStudioCompatibleTemplate = "3.4.0";
		const normalizedPlatformVersion = `${semver.major(platformVersion)}.${semver.minor(platformVersion)}.0`;

		return semver.gte(normalizedPlatformVersion, androidStudioCompatibleTemplate);
	}

	private runtimeVersionIsGreaterThanOrEquals(projectData: IProjectData, versionString: string): boolean {
		const platformVersion = this.getCurrentPlatformVersion(this.getPlatformData(projectData), projectData);

		if (platformVersion === constants.PackageVersion.NEXT) {
			return true;
		}

		const normalizedPlatformVersion = `${semver.major(platformVersion)}.${semver.minor(platformVersion)}.0`;
		return semver.gte(normalizedPlatformVersion, versionString);
	}

	private getLegacyAppResourcesDestinationDirPath(projectData: IProjectData): string {
		const resourcePath: string[] = [constants.SRC_DIR, constants.MAIN_DIR, constants.RESOURCES_DIR];
		if (this.isAndroidStudioTemplate) {
			resourcePath.unshift(constants.APP_FOLDER_NAME);
		}

		return path.join(this.getPlatformData(projectData).projectRoot, ...resourcePath);
	}

	private getUpdatedAppResourcesDestinationDirPath(projectData: IProjectData): string {
		const resourcePath: string[] = [constants.SRC_DIR];
		if (this.isAndroidStudioTemplate) {
			resourcePath.unshift(constants.APP_FOLDER_NAME);
		}

		return path.join(this.getPlatformData(projectData).projectRoot, ...resourcePath);
	}

	private cleanUpPreparedResources(appResourcesDirectoryPath: string, projectData: IProjectData): void {
		let resourcesDirPath = path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName);
		if (this.$androidResourcesMigrationService.hasMigrated(projectData.appResourcesDirectoryPath)) {
			resourcesDirPath = path.join(resourcesDirPath, constants.MAIN_DIR, constants.RESOURCES_DIR);
		}

		const valuesDirRegExp = /^values/;
		if (this.$fs.exists(resourcesDirPath)) {
			const resourcesDirs = this.$fs.readDirectory(resourcesDirPath).filter(resDir => !resDir.match(valuesDirRegExp));
			const appResourcesDestinationDirectoryPath = this.getAppResourcesDestinationDirectoryPath(projectData);
			_.each(resourcesDirs, resourceDir => {
				this.$fs.deleteDirectory(path.join(appResourcesDestinationDirectoryPath, resourceDir));
			});
		}
	}
}

$injector.register("androidProjectService", AndroidProjectService);
