import * as path from "path";
import * as shell from "shelljs";
import Future = require("fibers/future");
import * as constants from "../constants";
import * as semver from "semver";
import * as projectServiceBaseLib from "./platform-project-service-base";
import {DeviceAndroidDebugBridge} from "../common/mobile/android/device-android-debug-bridge";
import {AndroidDeviceHashService} from "../common/mobile/android/android-device-hash-service";
import {EOL} from "os";

export class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";
	private static ANDROID_PLATFORM_NAME = "android";
	private static MIN_RUNTIME_VERSION_WITH_GRADLE = "1.3.0";
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
		private $options: IOptions,
		$projectData: IProjectData,
		$projectDataService: IProjectDataService,
		private $sysInfo: ISysInfo,
		private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector,
		private $pluginVariablesService: IPluginVariablesService,
		private $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectTemplatesService: IProjectTemplatesService,
		private $xmlValidator: IXmlValidator,
		private $config: IConfiguration,
		private $npm: INodePackageManager) {
		super($fs, $projectData, $projectDataService);
		this._androidProjectPropertiesManagers = Object.create(null);
	}

	private _platformData: IPlatformData = null;
	public get platformData(): IPlatformData {
		if (!this._platformData) {
			let projectRoot = path.join(this.$projectData.platformsDir, "android");
			let packageName = this.getProjectNameFromId();
			this._platformData = {
				frameworkPackageName: "tns-android",
				normalizedPlatformName: "Android",
				appDestinationDirectoryPath: path.join(projectRoot, "src", "main", "assets"),
				platformProjectService: this,
				emulatorServices: this.$androidEmulatorServices,
				projectRoot: projectRoot,
				deviceBuildOutputPath: path.join(projectRoot, "build", "outputs", "apk"),
				validPackageNamesForDevice: [
					`${packageName}-debug.apk`,
					`${packageName}-release.apk`,
					`${this.$projectData.projectName}-debug.apk`,
					`${this.$projectData.projectName}-release.apk`
				],
				frameworkFilesExtensions: [".jar", ".dat", ".so"],
				configurationFileName: "AndroidManifest.xml",
				configurationFilePath: path.join(projectRoot, "src", "main", "AndroidManifest.xml"),
				relativeToFrameworkConfigurationFilePath: path.join("src", "main", "AndroidManifest.xml"),
				fastLivesyncFileExtensions: [".jpg", ".gif", ".png", ".bmp", ".webp"] // http://developer.android.com/guide/appendix/media-formats.html
			};
		}

		return this._platformData;
	}

	public getAppResourcesDestinationDirectoryPath(frameworkVersion?: string): IFuture<string> {
		return (() => {
			if (this.canUseGradle(frameworkVersion).wait()) {
				return path.join(this.platformData.projectRoot, "src", "main", "res");
			}

			return path.join(this.platformData.projectRoot, "res");
		}).future<string>()();
	}

	public validate(): IFuture<void> {
		return (() => {
			this.validatePackageName(this.$projectData.projectId);
			this.validateProjectName(this.$projectData.projectName);

			// this call will fail in case `android` is not set correctly.
			this.$androidToolsInfo.getPathToAndroidExecutable({ showWarningsAsErrors: true }).wait();
			let javaCompilerVersion = this.$sysInfo.getJavaCompilerVersion().wait();
			this.$androidToolsInfo.validateJavacVersion(javaCompilerVersion, { showWarningsAsErrors: true }).wait();
		}).future<void>()();
	}

	public createProject(frameworkDir: string, frameworkVersion: string, pathToTemplate?: string): IFuture<void> {
		return (() => {
			if (semver.lt(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
				this.$errors.failWithoutHelp(`The NativeScript CLI requires Android runtime ${AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE} or later to work properly.`);
			}

			this.$fs.ensureDirectoryExists(this.platformData.projectRoot).wait();
			this.$androidToolsInfo.validateInfo({ showWarningsAsErrors: true, validateTargetSdk: true }).wait();
			let androidToolsInfo = this.$androidToolsInfo.getToolsInfo().wait();
			let targetSdkVersion = androidToolsInfo.targetSdkVersion;
			this.$logger.trace(`Using Android SDK '${targetSdkVersion}'.`);
			this.copy(this.platformData.projectRoot, frameworkDir, "libs", "-R");

			if (pathToTemplate) {
				let mainPath = path.join(this.platformData.projectRoot, "src", "main");
				this.$fs.createDirectory(mainPath).wait();
				shell.cp("-R", path.join(path.resolve(pathToTemplate), "*"), mainPath);
			} else {
				this.copy(this.platformData.projectRoot, frameworkDir, "src", "-R");
			}
			this.copy(this.platformData.projectRoot, frameworkDir, "build.gradle settings.gradle gradle.properties build-tools", "-Rf");

			if (this.useGradleWrapper(frameworkDir)) {
				this.copy(this.platformData.projectRoot, frameworkDir, "gradle", "-R");
				this.copy(this.platformData.projectRoot, frameworkDir, "gradlew gradlew.bat", "-f");
			}

			this.cleanResValues(targetSdkVersion, frameworkVersion).wait();

			let npmConfig = {
				"save": true,
				"save-dev": true,
				"save-exact": true,
				"silent": true
			};

			let projectPackageJson: any = this.$fs.readJson(this.$projectData.projectFilePath).wait();

			_.each(AndroidProjectService.REQUIRED_DEV_DEPENDENCIES, (dependency: any) => {
				let dependencyVersionInProject = (projectPackageJson.dependencies && projectPackageJson.dependencies[dependency.name]) ||
					(projectPackageJson.devDependencies && projectPackageJson.devDependencies[dependency.name]);

				if (!dependencyVersionInProject) {
					this.$npm.install(`${dependency.name}@${dependency.version}`, this.$projectData.projectDir, npmConfig).wait();
				} else {
					let cleanedVerson = semver.clean(dependencyVersionInProject);

					// The plugin version is not valid. Check node_modules for the valid version.
					if (!cleanedVerson) {
						let pathToPluginPackageJson = path.join(this.$projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME, dependency.name, constants.PACKAGE_JSON_FILE_NAME);
						dependencyVersionInProject = this.$fs.exists(pathToPluginPackageJson).wait() && this.$fs.readJson(pathToPluginPackageJson).wait().version;
					}

					if (!semver.satisfies(dependencyVersionInProject || cleanedVerson, dependency.version)) {
						this.$errors.failWithoutHelp(`Your project have installed ${dependency.name} version ${cleanedVerson} but Android platform requires version ${dependency.version}.`);
					}
				}
			});

		}).future<any>()();
	}

	private useGradleWrapper(frameworkDir: string): boolean {
		let gradlew = path.join(frameworkDir, "gradlew");
		return this.$fs.exists(gradlew).wait();
	}

	private cleanResValues(targetSdkVersion: number, frameworkVersion: string): IFuture<void> {
		return (() => {
			let resDestinationDir = this.getAppResourcesDestinationDirectoryPath(frameworkVersion).wait();
			let directoriesInResFolder = this.$fs.readDirectory(resDestinationDir).wait();
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
			Future.wait(_.map(directoriesToClean, dir => this.$fs.deleteDirectory(dir)));
		}).future<void>()();
	}

	public interpolateData(): IFuture<void> {
		return (() => {
			// Interpolate the apilevel and package
			this.interpolateConfigurationFile().wait();

			let stringsFilePath = path.join(this.getAppResourcesDestinationDirectoryPath().wait(), 'values', 'strings.xml');
			shell.sed('-i', /__NAME__/, this.$projectData.projectName, stringsFilePath);
			shell.sed('-i', /__TITLE_ACTIVITY__/, this.$projectData.projectName, stringsFilePath);

			let gradleSettingsFilePath = path.join(this.platformData.projectRoot, "settings.gradle");
			shell.sed('-i', /__PROJECT_NAME__/, this.getProjectNameFromId(), gradleSettingsFilePath);

			// will replace applicationId in app/App_Resources/Android/app.gradle if it has not been edited by the user
			let userAppGradleFilePath = path.join(this.$projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, "app.gradle");
			shell.sed('-i', /__PACKAGE__/, this.$projectData.projectId, userAppGradleFilePath);
		}).future<void>()();
	}

	public interpolateConfigurationFile(): IFuture<void> {
		return (() => {
			let manifestPath = this.platformData.configurationFilePath;
			shell.sed('-i', /__PACKAGE__/, this.$projectData.projectId, manifestPath);
			shell.sed('-i', /__APILEVEL__/, this.$options.sdk || this.$androidToolsInfo.getToolsInfo().wait().compileSdkVersion.toString(), manifestPath);
		}).future<void>()();
	}

	private getProjectNameFromId(): string {
		let id: string;
		if (this.$projectData && this.$projectData.projectId) {
			id = this.$projectData.projectId.split(".")[2];
		}

		return id;
	}

	public afterCreateProject(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}

	public canUpdatePlatform(newInstalledModuleDir: string): IFuture<boolean> {
		return Future.fromResult(true);
	}

	public updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean, addPlatform?: Function, removePlatforms?: (platforms: string[]) => IFuture<void>): IFuture<boolean> {
		return (() => {
			// TODO: plamen5kov: drop support for project older than 1.3.0(MIN_RUNTIME_VERSION_WITH_GRADLE)
			if (semver.eq(newVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
				let platformLowercase = this.platformData.normalizedPlatformName.toLowerCase();
				removePlatforms([platformLowercase.split("@")[0]]).wait();
				addPlatform(platformLowercase).wait();
				return false;
			}

			return true;
		}).future<boolean>()();
	}

	public buildProject(projectRoot: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			if (this.canUseGradle().wait()) {
				let buildOptions = this.getBuildOptions();
				if (this.$logger.getLevel() === "TRACE") {
					buildOptions.unshift("--stacktrace");
					buildOptions.unshift("--debug");
				}
				buildOptions.unshift("buildapk");
				let gradleBin = this.useGradleWrapper(projectRoot) ? path.join(projectRoot, "gradlew") : "gradle";
				if (this.$hostInfo.isWindows) {
					gradleBin += ".bat"; // cmd command line parsing rules are weird. Avoid issues with quotes. See https://github.com/apache/cordova-android/blob/master/bin/templates/cordova/lib/builders/GradleBuilder.js for another approach
				}
				this.spawn(gradleBin, buildOptions, { stdio: "inherit", cwd: this.platformData.projectRoot }).wait();
			} else {
				this.$errors.failWithoutHelp("Cannot complete build because this project is ANT-based." + EOL +
					"Run `tns platform remove android && tns platform add android` to switch to Gradle and try again.");
			}
		}).future<void>()();
	}

	public getBuildOptions(): Array<string> {
		this.$androidToolsInfo.validateInfo({ showWarningsAsErrors: true, validateTargetSdk: true }).wait();
		let androidToolsInfo = this.$androidToolsInfo.getToolsInfo().wait();
		let compileSdk = androidToolsInfo.compileSdkVersion;
		let targetSdk = this.getTargetFromAndroidManifest().wait() || compileSdk;
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

		if (this.$options.release) {
			buildOptions.push("-Prelease");
			buildOptions.push(`-PksPath=${path.resolve(this.$options.keyStorePath)}`);
			buildOptions.push(`-Palias=${this.$options.keyStoreAlias}`);
			buildOptions.push(`-Ppassword=${this.$options.keyStoreAliasPassword}`);
			buildOptions.push(`-PksPassword=${this.$options.keyStorePassword}`);
		}

		return buildOptions;
	}

	public buildForDeploy(projectRoot: string, buildConfig?: IBuildConfig): IFuture<void> {
		return this.buildProject(projectRoot, buildConfig);
	}

	public isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return this.$fs.exists(path.join(this.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
	}

	public getFrameworkFilesExtensions(): string[] {
		return [".jar", ".dat"];
	}

	public prepareProject(): IFuture<void> {
		return Future.fromResult();
	}

	public ensureConfigurationFileInAppResources(): IFuture<void> {
		return (() => {
			let originalAndroidManifestFilePath = path.join(this.$projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, this.platformData.configurationFileName);

			let manifestExists = this.$fs.exists(originalAndroidManifestFilePath).wait();
			if(!manifestExists) {
				this.$logger.warn('No manifest found in ' + originalAndroidManifestFilePath);
				return;
			}
			// Overwrite the AndroidManifest from runtime.
			this.$fs.copyFile(originalAndroidManifestFilePath, this.platformData.configurationFilePath).wait();
		}).future<void>()();
	}

	public prepareAppResources(appResourcesDirectoryPath: string): IFuture<void> {
		return (() => {
			let resourcesDirPath = path.join(appResourcesDirectoryPath, this.platformData.normalizedPlatformName);
			let valuesDirRegExp = /^values/;
			let resourcesDirs = this.$fs.readDirectory(resourcesDirPath).wait().filter(resDir => !resDir.match(valuesDirRegExp));
			_.each(resourcesDirs, resourceDir => {
				this.$fs.deleteDirectory(path.join(this.getAppResourcesDestinationDirectoryPath().wait(), resourceDir)).wait();
			});
		}).future<void>()();
	}

	public preparePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME);
			this.processResourcesFromPlugin(pluginData, pluginPlatformsFolderPath).wait();
		}).future<void>()();
	}

	public processConfigurationFilesFromAppResources(): IFuture<void> {
		return Future.fromResult();
	}

	private processResourcesFromPlugin(pluginData: IPluginData, pluginPlatformsFolderPath: string): IFuture<void> {
		return (() => {
			let configurationsDirectoryPath = path.join(this.platformData.projectRoot, "configurations");
			this.$fs.ensureDirectoryExists(configurationsDirectoryPath).wait();

			let pluginConfigurationDirectoryPath = path.join(configurationsDirectoryPath, pluginData.name);
			if (this.$fs.exists(pluginPlatformsFolderPath).wait()) {
				this.$fs.ensureDirectoryExists(pluginConfigurationDirectoryPath).wait();

				// Copy all resources from plugin
				let resourcesDestinationDirectoryPath = path.join(this.platformData.projectRoot, "src", pluginData.name);
				this.$fs.ensureDirectoryExists(resourcesDestinationDirectoryPath).wait();
				shell.cp("-Rf", path.join(pluginPlatformsFolderPath, "*"), resourcesDestinationDirectoryPath);

				(this.$fs.enumerateFilesInDirectorySync(resourcesDestinationDirectoryPath, file => this.$fs.getFsStats(file).wait().isDirectory() || path.extname(file) === constants.XML_FILE_EXTENSION) || [])
					.forEach(file => {
						this.$logger.trace(`Interpolate data for plugin file: ${file}`);
						this.$pluginVariablesService.interpolate(pluginData, file).wait();
					});
			}

			// Copy include.gradle file
			let includeGradleFilePath = path.join(pluginPlatformsFolderPath, "include.gradle");
			if (this.$fs.exists(includeGradleFilePath).wait()) {
				shell.cp("-f", includeGradleFilePath, pluginConfigurationDirectoryPath);
			}
		}).future<void>()();
	}

	public removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			try {
				this.$fs.deleteDirectory(path.join(this.platformData.projectRoot, "configurations", pluginData.name)).wait();
				this.$fs.deleteDirectory(path.join(this.platformData.projectRoot, "src", pluginData.name)).wait();
			} catch (e) {
				if (e.code === "ENOENT") {
					this.$logger.debug("No native code jars found: " + e.message);
				} else {
					throw e;
				}
			}
		}).future<void>()();
	}

	public afterPrepareAllPlugins(): IFuture<void> {
		return Future.fromResult();
	}

	public beforePrepareAllPlugins(dependencies?: IDictionary<IDependencyData>): IFuture<void> {
		if (!this.$config.debugLivesync) {
			if (dependencies) {
				let platformDir = path.join(this.$projectData.platformsDir, "android");
				let buildDir = path.join(platformDir, "build-tools");
				let checkV8dependants = path.join(buildDir, "check-v8-dependants.js");
				if (this.$fs.exists(checkV8dependants).wait()) {
					let stringifiedDependencies = JSON.stringify(dependencies);
					this.spawn('node', [checkV8dependants, stringifiedDependencies, this.$projectData.platformsDir], { stdio: "inherit" }).wait();
				}
			}

			let buildOptions = this.getBuildOptions();

			buildOptions.unshift("clean");

			let projectRoot = this.platformData.projectRoot;
			let gradleBin = this.useGradleWrapper(projectRoot) ? path.join(projectRoot, "gradlew") : "gradle";
			if (this.$hostInfo.isWindows) {
				gradleBin += ".bat";
			}
			this.spawn(gradleBin, buildOptions, { stdio: "inherit", cwd: this.platformData.projectRoot }).wait();
		}
		return Future.fromResult();
	}

	public deploy(deviceIdentifier: string): IFuture<void> {
		return (() => {
			let adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: deviceIdentifier });
			let deviceRootPath = `/data/local/tmp/${this.$projectData.projectId}`;
			adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "fullsync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "sync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync")]).wait();

			let projectFilesManager = this.$injector.resolve("projectFilesManager"); // We need to resolve projectFilesManager here due to cyclic dependency
			let devicesService: Mobile.IDevicesService = this.$injector.resolve("devicesService");
			let device = _.find(devicesService.getDevicesForPlatform(this.platformData.normalizedPlatformName), d => d.deviceInfo.identifier === deviceIdentifier);
			let deviceAppData = this.$deviceAppDataFactory.create(this.$projectData.projectId, this.platformData.normalizedPlatformName, device);
			let localToDevicePaths = projectFilesManager.createLocalToDevicePaths(deviceAppData, path.join(this.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
			let deviceHashService = this.$injector.resolve(AndroidDeviceHashService, { adb: adb, appIdentifier: this.$projectData.projectId });
			deviceHashService.uploadHashFileToDevice(localToDevicePaths).wait();
		}).future<void>()();
	}

	private _canUseGradle: boolean;
	private canUseGradle(frameworkVersion?: string): IFuture<boolean> {
		return (() => {
			if (!this._canUseGradle) {
				if (!frameworkVersion) {
					this.$projectDataService.initialize(this.$projectData.projectDir);
					let frameworkInfoInProjectFile = this.$projectDataService.getValue(this.platformData.frameworkPackageName).wait();
					frameworkVersion = frameworkInfoInProjectFile && frameworkInfoInProjectFile.version;
				}

				this._canUseGradle = !frameworkVersion || semver.gte(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE);
			}

			return this._canUseGradle;
		}).future<boolean>()();
	}

	private copy(projectRoot: string, frameworkDir: string, files: string, cpArg: string): void {
		let paths = files.split(' ').map(p => path.join(frameworkDir, p));
		shell.cp(cpArg, paths, projectRoot);
	}

	private spawn(command: string, args: string[], opts?: any): IFuture<ISpawnResult> {
		return this.$childProcess.spawnFromEvent(command, args, "close", opts || { stdio: "inherit" });
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

	private getTargetFromAndroidManifest(): IFuture<string> {
		return ((): string => {
			let versionInManifest: string;
			if (this.$fs.exists(this.platformData.configurationFilePath).wait()) {
				let targetFromAndroidManifest: string = this.$fs.readText(this.platformData.configurationFilePath).wait();
				if (targetFromAndroidManifest) {
					let match = targetFromAndroidManifest.match(/.*?android:targetSdkVersion=\"(.*?)\"/);
					if (match && match[1]) {
						versionInManifest = match[1];
					}
				}
			}

			return versionInManifest;
		}).future<string>()();
	}
}
$injector.register("androidProjectService", AndroidProjectService);
