///<reference path="../.d.ts"/>
"use strict";
import * as path from "path";
import * as shell from "shelljs";
import Future = require("fibers/future");
import * as constants from "../constants";
import * as semver from "semver";
import * as projectServiceBaseLib from "./platform-project-service-base";
import * as androidDebugBridgePath from "../common/mobile/android/android-debug-bridge";
import {AndroidDeviceHashService} from "../common/mobile/android/android-device-hash-service";
import {EOL} from "os";
import { createGUID } from "../common/helpers";

export class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";
	private static ANDROID_PLATFORM_NAME = "android";
	private static MIN_RUNTIME_VERSION_WITH_GRADLE = "1.3.0";

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
		private $xmlValidator: IXmlValidator) {
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
			if(this.canUseGradle(frameworkVersion).wait()) {
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
			this.$androidToolsInfo.getPathToAndroidExecutable({showWarningsAsErrors: true}).wait();
			this.$androidToolsInfo.validateJavacVersion(this.$sysInfo.getSysInfo(path.join(__dirname, "..", "..", "package.json")).wait().javacVersion, {showWarningsAsErrors: true}).wait();
		}).future<void>()();
	}

	public createProject(frameworkDir: string, frameworkVersion: string, pathToTemplate?: string): IFuture<void> {
		return (() => {
			if(semver.lt(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
				this.$errors.failWithoutHelp(`The NativeScript CLI requires Android runtime ${AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE} or later to work properly.`);
			}

			this.$fs.ensureDirectoryExists(this.platformData.projectRoot).wait();
			this.$androidToolsInfo.validateInfo({showWarningsAsErrors: true, validateTargetSdk: true}).wait();
			let androidToolsInfo = this.$androidToolsInfo.getToolsInfo().wait();
			let targetSdkVersion = androidToolsInfo.targetSdkVersion;
			this.$logger.trace(`Using Android SDK '${targetSdkVersion}'.`);
			if(this.$options.symlink) {
				this.symlinkDirectory("build-tools", this.platformData.projectRoot, frameworkDir).wait();
				this.symlinkDirectory("libs", this.platformData.projectRoot, frameworkDir).wait();
			} else {
				this.copy(this.platformData.projectRoot, frameworkDir, "build-tools libs", "-R");
			}

			// These files and directories should not be symlinked as CLI is modifying them and we'll change the original values as well.
			if(pathToTemplate) {
				let mainPath = path.join(this.platformData.projectRoot, "src", "main");
				this.$fs.createDirectory(mainPath).wait();
				shell.cp("-R", path.join(path.resolve(pathToTemplate), "*"), mainPath);
			} else {
				this.copy(this.platformData.projectRoot, frameworkDir, "src", "-R");
			}
			this.copy(this.platformData.projectRoot, frameworkDir, "build.gradle settings.gradle gradle.properties", "-f");

			if (this.useGradleWrapper(frameworkDir)) {
				this.copy(this.platformData.projectRoot, frameworkDir, "gradle", "-R");
				this.copy(this.platformData.projectRoot, frameworkDir, "gradlew gradlew.bat", "-f");
			}

			this.cleanResValues(targetSdkVersion, frameworkVersion).wait();

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
				.map(dir => { return {
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
		if(this.$projectData && this.$projectData.projectId) {
			id = this.$projectData.projectId.split(".")[2];
		}

		return id;
	}

	public afterCreateProject(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}

	public canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean> {
		return Future.fromResult(true);
	}

	public updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean, addPlatform?: Function, removePlatforms?: (platforms: string[]) => IFuture<void>): IFuture<boolean> {
		return (() => {
			if(semver.eq(newVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
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
			if(this.canUseGradle().wait()) {
				this.$androidToolsInfo.validateInfo({showWarningsAsErrors: true, validateTargetSdk: true}).wait();
				let androidToolsInfo = this.$androidToolsInfo.getToolsInfo().wait();
				let compileSdk = androidToolsInfo.compileSdkVersion;
				let targetSdk = this.getTargetFromAndroidManifest().wait() || compileSdk;
				let buildToolsVersion = androidToolsInfo.buildToolsVersion;
				let appCompatVersion = androidToolsInfo.supportRepositoryVersion;
				let buildOptions = ["buildapk",
					`-PcompileSdk=android-${compileSdk}`,
					`-PtargetSdk=${targetSdk}`,
					`-PbuildToolsVersion=${buildToolsVersion}`,
					`-PsupportVersion=${appCompatVersion}`,
				];

				if(this.$options.release) {
					buildOptions.push("-Prelease");
					buildOptions.push(`-PksPath=${path.resolve(this.$options.keyStorePath)}`);
					buildOptions.push(`-Palias=${this.$options.keyStoreAlias}`);
					buildOptions.push(`-Ppassword=${this.$options.keyStoreAliasPassword}`);
					buildOptions.push(`-PksPassword=${this.$options.keyStorePassword}`);
				}

				if (buildConfig && buildConfig.runSbGenerator) {
					buildOptions.push("-PrunSBGenerator");
				}

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
		return (() => {
			let resDestinationDir = this.getAppResourcesDestinationDirectoryPath().wait();
			let androidManifestPath = path.join(resDestinationDir, this.platformData.configurationFileName);

			// In case the file is not correct, looks like we are still using the default AndroidManifest.xml from runtime and the current file (in res dir)
			// should be merged with it.
			if(this.isAndroidManifestFileCorrect(androidManifestPath).wait()) {
				// Delete the AndroidManifest.xml file from res directory as the runtime will consider it as addition to the one in src/main and will try to merge them.
				// However now they are the same file.
				this.$fs.deleteFile(androidManifestPath).wait();
			}
		}).future<void>()();
	}

	public ensureConfigurationFileInAppResources(): IFuture<void> {
		return (() => {
			let originalAndroidManifestFilePath = path.join(this.$projectData.appResourcesDirectoryPath, this.$devicePlatformsConstants.Android, this.platformData.configurationFileName),
				hasAndroidManifestInAppResources = this.$fs.exists(originalAndroidManifestFilePath).wait(),
				shouldExtractDefaultManifest = !hasAndroidManifestInAppResources || !this.isAndroidManifestFileCorrect(originalAndroidManifestFilePath).wait();

			// In case we should extract the manifest from default template, but for some reason we cannot, break the execution,
			// so the original file from Android runtime will be used.
			if(shouldExtractDefaultManifest && !this.extractAndroidManifestFromDefaultTemplate(originalAndroidManifestFilePath).wait()) {
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
			if(this.$fs.exists(includeGradleFilePath).wait()) {
				shell.cp("-f", includeGradleFilePath, pluginConfigurationDirectoryPath);
			}
		}).future<void>()();
	}

	public removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			try {
				this.$fs.deleteDirectory(path.join(this.platformData.projectRoot, "configurations", pluginData.name)).wait();
				this.$fs.deleteDirectory(path.join(this.platformData.projectRoot, "src", pluginData.name)).wait();
			} catch(e) {
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

	public deploy(deviceIdentifier: string): IFuture<void> {
		return (() => {
			let adb = this.$injector.resolve(androidDebugBridgePath.AndroidDebugBridge, { identifier: deviceIdentifier });
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
			if(!this._canUseGradle) {
				if(!frameworkVersion) {
					this.$projectDataService.initialize(this.$projectData.projectDir);
					frameworkVersion = this.$projectDataService.getValue(this.platformData.frameworkPackageName).wait().version;
				}

				this._canUseGradle = semver.gte(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE);
			}

			return this._canUseGradle;
		}).future<boolean>()();
	}

	private copy(projectRoot: string, frameworkDir: string, files: string, cpArg: string): void {
		let paths = files.split(' ').map(p => path.join(frameworkDir, p));
		shell.cp(cpArg, paths, projectRoot);
	}

	private spawn(command: string, args: string[], opts?: any): IFuture<void> {
		return this.$childProcess.spawnFromEvent(command, args, "close", opts || { stdio: "inherit"});
	}

	private validatePackageName(packageName: string): void {
		//Make the package conform to Java package types
		//Enforce underscore limitation
		if (!/^[a-zA-Z]+(\.[a-zA-Z0-9][a-zA-Z0-9_]*)+$/.test(packageName)) {
			this.$errors.fail("Package name must look like: com.company.Name");
		}

		//Class is a reserved word
		if(/\b[Cc]lass\b/.test(packageName)) {
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
				if(targetFromAndroidManifest) {
					let match = targetFromAndroidManifest.match(/.*?android:targetSdkVersion=\"(.*?)\"/);
					if(match && match[1]) {
						versionInManifest = match[1];
					}
				}
			}

			return versionInManifest;
		}).future<string>()();
	}

	private symlinkDirectory(directoryName: string, projectRoot: string, frameworkDir: string): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(path.join(projectRoot, directoryName)).wait();
			let directoryContent = this.$fs.readDirectory(path.join(frameworkDir, directoryName)).wait();

			_.each(directoryContent, (file: string) => {
				let sourceFilePath = path.join(frameworkDir, directoryName, file);
				let destinationFilePath = path.join(projectRoot, directoryName, file);
				if(this.$fs.getFsStats(sourceFilePath).wait().isFile()) {
					this.$fs.symlink(sourceFilePath, destinationFilePath).wait();
				} else {
					this.$fs.symlink(sourceFilePath, destinationFilePath, "dir").wait();
				}
			});

		}).future<void>()();
	}

	private isAndroidManifestFileCorrect(pathToAndroidManifest: string): IFuture<boolean> {
		return ((): boolean => {
			try {
				// Check if the AndroidManifest in app/App_Resouces is the correct one
				// Use a real magic to detect if this is the correct file, by checking some mandatory strings.
				let fileContent = this.$fs.readText(pathToAndroidManifest).wait(),
					isFileCorrect = !!(~fileContent.indexOf("android:minSdkVersion") && ~fileContent.indexOf("android:targetSdkVersion")
									&& ~fileContent.indexOf("uses-permission") && ~fileContent.indexOf("<application")
									&& ~fileContent.indexOf("<activity") && ~fileContent.indexOf("<intent-filter>")
									&& ~fileContent.indexOf("android.intent.action.MAIN") && ~fileContent.indexOf("com.tns.ErrorReportActivity")
									&& ~fileContent.indexOf("android:versionCode")
									&& !this.$xmlValidator.getXmlFileErrors(pathToAndroidManifest).wait());

				this.$logger.trace(`Existing ${this.platformData.configurationFileName} is ${isFileCorrect ? "" : "NOT "}correct.`);
				return isFileCorrect;
			} catch(err) {
				this.$logger.trace(`Error while checking ${pathToAndroidManifest}: `, err);
				return false;
			}
		}).future<boolean>()();
	}

	private _configurationFileBackupName: string;

	private getConfigurationFileBackupName(originalAndroidManifestFilePath: string): IFuture<string> {
		return (() => {
			if(!this._configurationFileBackupName) {
				let defaultBackupName = this.platformData.configurationFileName + ".backup";
				if(this.$fs.exists(path.join(path.dirname(originalAndroidManifestFilePath), defaultBackupName)).wait()) {
					defaultBackupName += `_${createGUID(false)}`;
				}
				this._configurationFileBackupName = defaultBackupName;
			}

			return this._configurationFileBackupName;
		}).future<string>()();
	}

	private backupOriginalAndroidManifest(originalAndroidManifestFilePath: string): IFuture<void> {
		return (() => {
			let newPathForOriginalManifest = path.join(path.dirname(originalAndroidManifestFilePath), this.getConfigurationFileBackupName(originalAndroidManifestFilePath).wait());
			shell.mv(originalAndroidManifestFilePath, newPathForOriginalManifest);
		}).future<void>()();
	}

	private revertBackupOfOriginalAndroidManifest(originalAndroidManifestFilePath: string): IFuture<void> {
		return (() => {
			let pathToBackupFile = path.join(path.dirname(originalAndroidManifestFilePath), this.getConfigurationFileBackupName(originalAndroidManifestFilePath).wait());
			if(this.$fs.exists(pathToBackupFile).wait()) {
				this.$logger.trace(`Could not extract ${this.platformData.configurationFileName} from default template. Reverting the change of your app/App_Resources/${this.platformData.configurationFileName}.`);
				shell.mv(pathToBackupFile, originalAndroidManifestFilePath);
			}
		}).future<void>()();
	}

	private extractAndroidManifestFromDefaultTemplate(originalAndroidManifestFilePath: string): IFuture<boolean> {
		return ((): boolean => {
			let defaultTemplatePath = this.$projectTemplatesService.defaultTemplatePath.wait();
			let templateAndroidManifest = path.join(defaultTemplatePath, constants.APP_RESOURCES_FOLDER_NAME, this.$devicePlatformsConstants.Android, this.platformData.configurationFileName);
			let alreadyHasAndroidManifest = this.$fs.exists(originalAndroidManifestFilePath).wait();
			if (this.$fs.exists(templateAndroidManifest).wait()) {
				this.$logger.trace(`${originalAndroidManifestFilePath} is missing. Upgrading the source of the project with one from the new project template. Copy ${templateAndroidManifest} to ${originalAndroidManifestFilePath}`);
				try {
					if(alreadyHasAndroidManifest) {
						this.backupOriginalAndroidManifest(originalAndroidManifestFilePath).wait();
					}
					this.$fs.copyFile(templateAndroidManifest, originalAndroidManifestFilePath).wait();
				} catch(e) {
					this.$logger.trace(`Copying template's ${this.platformData.configurationFileName} failed. `, e);
					this.revertBackupOfOriginalAndroidManifest(originalAndroidManifestFilePath).wait();
					return false;
				}
			} else {
				this.$logger.trace(`${originalAndroidManifestFilePath} is missing but the template ${templateAndroidManifest} is missing too, can not upgrade ${this.platformData.configurationFileName}.`);
				return false;
			}

			if(alreadyHasAndroidManifest) {
				this.$logger.warn(`Your ${this.platformData.configurationFileName} in app/App_Resources/Android will be replaced by the default one from hello-world template.`);
				this.$logger.printMarkdown(`The original file will be moved to \`${this.getConfigurationFileBackupName(originalAndroidManifestFilePath).wait()}\`. Merge it **manually** with the new \`${this.platformData.configurationFileName}\` in your app/App_Resources/Android.`);
			}

			this.interpolateConfigurationFile().wait();
			return true;
		}).future<boolean>()();
	}
}
$injector.register("androidProjectService", AndroidProjectService);
