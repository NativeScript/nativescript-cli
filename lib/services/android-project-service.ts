import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import * as semver from "semver";
import * as projectServiceBaseLib from "./platform-project-service-base";
import { DeviceAndroidDebugBridge } from "../common/mobile/android/device-android-debug-bridge";
import { attachAwaitDetach } from "../common/helpers";
import { EOL } from "os";
import { Configurations } from "../common/constants";
import { SpawnOptions } from "child_process";

export class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";
	private static ANDROID_PLATFORM_NAME = "android";
	private static MIN_RUNTIME_VERSION_WITH_GRADLE = "1.5.0";
	private static REQUIRED_DEV_DEPENDENCIES = [
		{ name: "babel-traverse", version: "^6.4.5" },
		{ name: "babel-types", version: "^6.4.5" },
		{ name: "babylon", version: "^6.4.5" },
		{ name: "lazy", version: "^1.0.11" }
	];

	private _androidProjectPropertiesManagers: IDictionary<IAndroidProjectPropertiesManager>;

	constructor(private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $androidToolsInfo: IAndroidToolsInfo,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		$fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		$projectDataService: IProjectDataService,
		private $sysInfo: ISysInfo,
		private $injector: IInjector,
		private $pluginVariablesService: IPluginVariablesService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: IConfiguration,
		private $npm: INodePackageManager) {
		super($fs, $projectDataService);
		this._androidProjectPropertiesManagers = Object.create(null);
	}

	private _platformsDirCache: string = null;
	private _platformData: IPlatformData = null;
	public getPlatformData(projectData: IProjectData): IPlatformData {
		if (!projectData && !this._platformData) {
			throw new Error("First call of getPlatformData without providing projectData.");
		}

		if (projectData && projectData.platformsDir && this._platformsDirCache !== projectData.platformsDir) {
			this._platformsDirCache = projectData.platformsDir;
			let projectRoot = path.join(projectData.platformsDir, "android");
			let packageName = this.getProjectNameFromId(projectData);
			this._platformData = {
				frameworkPackageName: "tns-android",
				normalizedPlatformName: "Android",
				appDestinationDirectoryPath: path.join(projectRoot, "src", "main", "assets"),
				platformProjectService: this,
				emulatorServices: this.$androidEmulatorServices,
				projectRoot: projectRoot,
				deviceBuildOutputPath: path.join(projectRoot, "build", "outputs", "apk"),
				getValidPackageNames: (buildOptions: { isReleaseBuild?: boolean, isForDevice?: boolean }): string[] => {
					const buildMode = buildOptions.isReleaseBuild ? Configurations.Release.toLowerCase() : Configurations.Debug.toLowerCase();

					return [
						`${packageName}-${buildMode}.apk`,
						`${projectData.projectName}-${buildMode}.apk`,
						`${projectData.projectName}.apk`
					];
				},
				frameworkFilesExtensions: [".jar", ".dat", ".so"],
				configurationFileName: "AndroidManifest.xml",
				configurationFilePath: path.join(projectRoot, "src", "main", "AndroidManifest.xml"),
				relativeToFrameworkConfigurationFilePath: path.join("src", "main", "AndroidManifest.xml"),
				fastLivesyncFileExtensions: [".jpg", ".gif", ".png", ".bmp", ".webp"] // http://developer.android.com/guide/appendix/media-formats.html
			};
		}

		return this._platformData;
	}

	public validateOptions(): Promise<boolean> {
		return Promise.resolve(true);
	}

	public getAppResourcesDestinationDirectoryPath(projectData: IProjectData, frameworkVersion?: string): string {
		if (this.canUseGradle(projectData, frameworkVersion)) {
			return path.join(this.getPlatformData(projectData).projectRoot, "src", "main", "res");
		}

		return path.join(this.getPlatformData(projectData).projectRoot, "res");
	}

	public async validate(projectData: IProjectData): Promise<void> {
		this.validatePackageName(projectData.projectId);
		this.validateProjectName(projectData.projectName);

		this.$androidToolsInfo.validateAndroidHomeEnvVariable({ showWarningsAsErrors: true });

		let javaCompilerVersion = await this.$sysInfo.getJavaCompilerVersion();

		await this.$androidToolsInfo.validateJavacVersion(javaCompilerVersion, { showWarningsAsErrors: true });
	}

	public async validatePlugins(): Promise<void> {
		Promise.resolve();
	}

	public async createProject(frameworkDir: string, frameworkVersion: string, projectData: IProjectData, config: ICreateProjectOptions): Promise<void> {
		if (semver.lt(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
			this.$errors.failWithoutHelp(`The NativeScript CLI requires Android runtime ${AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE} or later to work properly.`);
		}

		this.$fs.ensureDirectoryExists(this.getPlatformData(projectData).projectRoot);
		this.$androidToolsInfo.validateInfo({ showWarningsAsErrors: true, validateTargetSdk: true });
		let androidToolsInfo = this.$androidToolsInfo.getToolsInfo();
		let targetSdkVersion = androidToolsInfo.targetSdkVersion;
		this.$logger.trace(`Using Android SDK '${targetSdkVersion}'.`);
		this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "libs", "-R");

		if (config.pathToTemplate) {
			let mainPath = path.join(this.getPlatformData(projectData).projectRoot, "src", "main");
			this.$fs.createDirectory(mainPath);
			shell.cp("-R", path.join(path.resolve(config.pathToTemplate), "*"), mainPath);
		} else {
			this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "src", "-R");
		}
		this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "build.gradle settings.gradle build-tools", "-Rf");

		try {
			this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradle.properties", "-Rf");
		} catch (e) {
			this.$logger.warn(`\n${e}\nIt's possible, the final .apk file will contain all architectures instead of the ones described in the abiFilters!\nYou can fix this by using the latest android platform.`);
		}

		this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradle", "-R");
		this.copy(this.getPlatformData(projectData).projectRoot, frameworkDir, "gradlew gradlew.bat", "-f");

		this.cleanResValues(targetSdkVersion, projectData, frameworkVersion);

		let npmConfig: INodePackageManagerInstallOptions = {
			save: true,
			"save-dev": true,
			"save-exact": true,
			silent: true,
			disableNpmInstall: false,
			frameworkPath: config.frameworkPath,
			ignoreScripts: config.ignoreScripts
		};

		let projectPackageJson: any = this.$fs.readJson(projectData.projectFilePath);

		for (let dependency of AndroidProjectService.REQUIRED_DEV_DEPENDENCIES) {
			let dependencyVersionInProject = (projectPackageJson.dependencies && projectPackageJson.dependencies[dependency.name]) ||
				(projectPackageJson.devDependencies && projectPackageJson.devDependencies[dependency.name]);

			if (!dependencyVersionInProject) {
				await this.$npm.install(`${dependency.name}@${dependency.version}`, projectData.projectDir, npmConfig);
			} else {
				let cleanedVerson = semver.clean(dependencyVersionInProject);

				// The plugin version is not valid. Check node_modules for the valid version.
				if (!cleanedVerson) {
					let pathToPluginPackageJson = path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME, dependency.name, constants.PACKAGE_JSON_FILE_NAME);
					dependencyVersionInProject = this.$fs.exists(pathToPluginPackageJson) && this.$fs.readJson(pathToPluginPackageJson).version;
				}

				if (!semver.satisfies(dependencyVersionInProject || cleanedVerson, dependency.version)) {
					this.$errors.failWithoutHelp(`Your project have installed ${dependency.name} version ${cleanedVerson} but Android platform requires version ${dependency.version}.`);
				}
			}
		};
	}

	private cleanResValues(targetSdkVersion: number, projectData: IProjectData, frameworkVersion: string): void {
		let resDestinationDir = this.getAppResourcesDestinationDirectoryPath(projectData, frameworkVersion);
		let directoriesInResFolder = this.$fs.readDirectory(resDestinationDir);
		let directoriesToClean = directoriesInResFolder
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

		let stringsFilePath = path.join(this.getAppResourcesDestinationDirectoryPath(projectData), 'values', 'strings.xml');
		shell.sed('-i', /__NAME__/, projectData.projectName, stringsFilePath);
		shell.sed('-i', /__TITLE_ACTIVITY__/, projectData.projectName, stringsFilePath);

		let gradleSettingsFilePath = path.join(this.getPlatformData(projectData).projectRoot, "settings.gradle");
		shell.sed('-i', /__PROJECT_NAME__/, this.getProjectNameFromId(projectData), gradleSettingsFilePath);

		// will replace applicationId in app/App_Resources/Android/app.gradle if it has not been edited by the user
		let userAppGradleFilePath = path.join(projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, "app.gradle");

		try {
			shell.sed('-i', /__PACKAGE__/, projectData.projectId, userAppGradleFilePath);
		} catch (e) {
			this.$logger.warn(`\n${e}.\nCheck if you're using an outdated template and update it.`);
		}
	}

	public interpolateConfigurationFile(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): void {
		let manifestPath = this.getPlatformData(projectData).configurationFilePath;
		shell.sed('-i', /__PACKAGE__/, projectData.projectId, manifestPath);
		const sdk = (platformSpecificData && platformSpecificData.sdk) || this.$androidToolsInfo.getToolsInfo().compileSdkVersion.toString();
		shell.sed('-i', /__APILEVEL__/, sdk, manifestPath);
	}

	private getProjectNameFromId(projectData: IProjectData): string {
		let id: string;
		if (projectData && projectData.projectId) {
			let idParts = projectData.projectId.split(".");
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
			let platformLowercase = this.getPlatformData(projectData).normalizedPlatformName.toLowerCase();
			await removePlatforms([platformLowercase.split("@")[0]]);
			await addPlatform(platformLowercase);
			return false;
		}

		return true;
	}

	public async buildProject(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): Promise<void> {
		if (this.canUseGradle(projectData)) {
			let buildOptions = this.getBuildOptions(buildConfig, projectData);
			if (this.$logger.getLevel() === "TRACE") {
				buildOptions.unshift("--stacktrace");
				buildOptions.unshift("--debug");
			}

			buildOptions.unshift("buildapk");

			const handler = (data: any) => {
				this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
			};

			await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME,
				this.$childProcess,
				handler,
				this.executeGradleCommand(this.getPlatformData(projectData).projectRoot,
					buildOptions,
					{ stdio: buildConfig.buildOutputStdio || "inherit" },
					{ emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true }));
		} else {
			this.$errors.failWithoutHelp("Cannot complete build because this project is ANT-based." + EOL +
				"Run `tns platform remove android && tns platform add android` to switch to Gradle and try again.");
		}
	}

	private getBuildOptions(settings: IAndroidBuildOptionsSettings, projectData: IProjectData): Array<string> {
		this.$androidToolsInfo.validateInfo({ showWarningsAsErrors: true, validateTargetSdk: true });

		let androidToolsInfo = this.$androidToolsInfo.getToolsInfo();
		let compileSdk = androidToolsInfo.compileSdkVersion;
		let targetSdk = this.getTargetFromAndroidManifest(projectData) || compileSdk;
		let buildToolsVersion = androidToolsInfo.buildToolsVersion;
		let appCompatVersion = androidToolsInfo.supportRepositoryVersion;
		let generateTypings = androidToolsInfo.generateTypings;
		let buildOptions = [
			`-PcompileSdk=android-${compileSdk}`,
			`-PtargetSdk=${targetSdk}`,
			`-PbuildToolsVersion=${buildToolsVersion}`,
			`-PsupportVersion=${appCompatVersion}`,
			`-PgenerateTypings=${generateTypings}`
		];

		if (settings.release) {
			buildOptions.push("-Prelease");
			buildOptions.push(`-PksPath=${path.resolve(settings.keyStorePath)}`);
			buildOptions.push(`-Palias=${settings.keyStoreAlias}`);
			buildOptions.push(`-Ppassword=${settings.keyStoreAliasPassword}`);
			buildOptions.push(`-PksPassword=${settings.keyStorePassword}`);
		}

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
		let originalAndroidManifestFilePath = path.join(projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, this.getPlatformData(projectData).configurationFileName);

		let manifestExists = this.$fs.exists(originalAndroidManifestFilePath);

		if (!manifestExists) {
			this.$logger.warn('No manifest found in ' + originalAndroidManifestFilePath);
			return;
		}
		// Overwrite the AndroidManifest from runtime.
		this.$fs.copyFile(originalAndroidManifestFilePath, this.getPlatformData(projectData).configurationFilePath);
	}

	public prepareAppResources(appResourcesDirectoryPath: string, projectData: IProjectData): void {
		let resourcesDirPath = path.join(appResourcesDirectoryPath, this.getPlatformData(projectData).normalizedPlatformName);
		let valuesDirRegExp = /^values/;
		let resourcesDirs = this.$fs.readDirectory(resourcesDirPath).filter(resDir => !resDir.match(valuesDirRegExp));
		_.each(resourcesDirs, resourceDir => {
			this.$fs.deleteDirectory(path.join(this.getAppResourcesDestinationDirectoryPath(projectData), resourceDir));
		});
	}

	public async preparePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		let pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME);
		await this.processResourcesFromPlugin(pluginData, pluginPlatformsFolderPath, projectData);
	}

	public async processConfigurationFilesFromAppResources(): Promise<void> {
		return;
	}

	private async processResourcesFromPlugin(pluginData: IPluginData, pluginPlatformsFolderPath: string, projectData: IProjectData): Promise<void> {
		let configurationsDirectoryPath = path.join(this.getPlatformData(projectData).projectRoot, "configurations");
		this.$fs.ensureDirectoryExists(configurationsDirectoryPath);

		let pluginConfigurationDirectoryPath = path.join(configurationsDirectoryPath, pluginData.name);
		if (this.$fs.exists(pluginPlatformsFolderPath)) {
			this.$fs.ensureDirectoryExists(pluginConfigurationDirectoryPath);

			let isScoped = pluginData.name.indexOf("@") === 0;
			let flattenedDependencyName = isScoped ? pluginData.name.replace("/", "_") : pluginData.name;

			// Copy all resources from plugin
			let resourcesDestinationDirectoryPath = path.join(this.getPlatformData(projectData).projectRoot, "src", flattenedDependencyName);
			this.$fs.ensureDirectoryExists(resourcesDestinationDirectoryPath);
			shell.cp("-Rf", path.join(pluginPlatformsFolderPath, "*"), resourcesDestinationDirectoryPath);

			const filesForInterpolation = this.$fs.enumerateFilesInDirectorySync(resourcesDestinationDirectoryPath, file => this.$fs.getFsStats(file).isDirectory() || path.extname(file) === constants.XML_FILE_EXTENSION) || [];
			for (let file of filesForInterpolation) {
				this.$logger.trace(`Interpolate data for plugin file: ${file}`);
				await this.$pluginVariablesService.interpolate(pluginData, file, projectData);
			}
		}

		// Copy include.gradle file
		let includeGradleFilePath = path.join(pluginPlatformsFolderPath, "include.gradle");
		if (this.$fs.exists(includeGradleFilePath)) {
			shell.cp("-f", includeGradleFilePath, pluginConfigurationDirectoryPath);
		}
	}

	public async removePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void> {
		try {
			// check whether the dependency that's being removed has native code
			let pluginConfigDir = path.join(this.getPlatformData(projectData).projectRoot, "configurations", pluginData.name);
			if (this.$fs.exists(pluginConfigDir)) {
				await this.cleanProject(this.getPlatformData(projectData).projectRoot, projectData);
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
		if (!this.$config.debugLivesync) {
			if (dependencies) {
				let platformDir = path.join(projectData.platformsDir, "android");
				let buildDir = path.join(platformDir, "build-tools");
				let checkV8dependants = path.join(buildDir, "check-v8-dependants.js");
				if (this.$fs.exists(checkV8dependants)) {
					let stringifiedDependencies = JSON.stringify(dependencies);
					try {
						await this.spawn('node', [checkV8dependants, stringifiedDependencies, projectData.platformsDir], { stdio: "inherit" });
					} catch (e) {
						this.$logger.info("Checking for dependants on v8 public API failed. This is likely caused because of cyclic production dependencies. Error code: " + e.code + "\nMore information: https://github.com/NativeScript/nativescript-cli/issues/2561");
					}
				}
			}

			let projectRoot = this.getPlatformData(projectData).projectRoot;

			await this.cleanProject(projectRoot, projectData);
		}
	}

	public stopServices(projectRoot: string): Promise<ISpawnResult> {
		return this.executeGradleCommand(projectRoot, ["--stop", "--quiet"]);
	}

	public async cleanProject(projectRoot: string, projectData: IProjectData): Promise<void> {
		const buildOptions = this.getBuildOptions({ release: false }, projectData);
		buildOptions.unshift("clean");
		await this.executeGradleCommand(projectRoot, buildOptions);
	}

	public async cleanDeviceTempFolder(deviceIdentifier: string, projectData: IProjectData): Promise<void> {
		let adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
		let deviceRootPath = `/data/local/tmp/${projectData.projectId}`;
		await adb.executeShellCommand(["rm", "-rf", deviceRootPath]);
	}

	public checkForChanges(changesInfo: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): void {
		// Nothing android specific to check yet.
	}

	private _canUseGradle: boolean;
	private canUseGradle(projectData: IProjectData, frameworkVersion?: string): boolean {
		if (!this._canUseGradle) {
			if (!frameworkVersion) {
				const frameworkInfoInProjectFile = this.$projectDataService.getNSValue(projectData.projectDir, this.getPlatformData(projectData).frameworkPackageName);
				frameworkVersion = frameworkInfoInProjectFile && frameworkInfoInProjectFile.version;
			}

			this._canUseGradle = !frameworkVersion || semver.gte(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE);
		}

		return this._canUseGradle;
	}

	private copy(projectRoot: string, frameworkDir: string, files: string, cpArg: string): void {
		let paths = files.split(' ').map(p => path.join(frameworkDir, p));
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

	private getTargetFromAndroidManifest(projectData: IProjectData): string {
		let versionInManifest: string;
		if (this.$fs.exists(this.getPlatformData(projectData).configurationFilePath)) {
			let targetFromAndroidManifest: string = this.$fs.readText(this.getPlatformData(projectData).configurationFilePath);
			if (targetFromAndroidManifest) {
				let match = targetFromAndroidManifest.match(/.*?android:targetSdkVersion=\"(.*?)\"/);
				if (match && match[1]) {
					versionInManifest = match[1];
				}
			}
		}

		return versionInManifest;
	}

	private async executeGradleCommand(projectRoot: string, gradleArgs: string[], childProcessOpts?: SpawnOptions, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> {
		const gradlew = this.$hostInfo.isWindows ? "gradlew.bat" : "./gradlew";

		childProcessOpts = childProcessOpts || {};
		childProcessOpts.cwd = childProcessOpts.cwd || projectRoot;
		childProcessOpts.stdio = childProcessOpts.stdio || "inherit";

		return await this.spawn(gradlew,
			gradleArgs,
			childProcessOpts,
			spawnFromEventOptions);
	}
}

$injector.register("androidProjectService", AndroidProjectService);
