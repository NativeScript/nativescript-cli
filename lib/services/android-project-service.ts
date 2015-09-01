///<reference path="../.d.ts"/>
"use strict";
import * as path from "path";
import * as shell from "shelljs";
import Future = require("fibers/future");
import * as constants from "../constants";
import * as semver from "semver";
import * as projectServiceBaseLib from "./platform-project-service-base";

class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static MIN_SUPPORTED_VERSION = 17;
	private SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21", "android-22"]; // forbidden for now: "android-MNC"
	private static ANDROID_TARGET_PREFIX = "android";
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";
	private static ANDROID_PLATFORM_NAME = "android";
	private static LIBS_FOLDER_NAME = "libs";
	private static MIN_JAVA_VERSION = "1.7.0";
	private static MIN_RUNTIME_VERSION_WITH_GRADLE = "1.3.0";

	private _androidProjectPropertiesManagers: IDictionary<IAndroidProjectPropertiesManager>;

	constructor(private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $propertiesParser: IPropertiesParser,
		private $sysInfo: ISysInfo,
		$fs: IFileSystem) {
			super($fs);
			this._androidProjectPropertiesManagers = Object.create(null);
	}

	private _platformData: IPlatformData = null;
	public get platformData(): IPlatformData {
		if (!this._platformData) {
			let projectRoot = path.join(this.$projectData.platformsDir, "android");

			this._platformData = {
				frameworkPackageName: "tns-android",
				normalizedPlatformName: "Android",
				appDestinationDirectoryPath: path.join(projectRoot, "src", "main", "assets"),
				appResourcesDestinationDirectoryPath: path.join(projectRoot, "src", "main", "res"),
				platformProjectService: this,
				emulatorServices: this.$androidEmulatorServices,
				projectRoot: projectRoot,
				deviceBuildOutputPath: path.join(projectRoot, "build", "outputs", "apk"),
				validPackageNamesForDevice: [
					`${this.$projectData.projectName}-debug.apk`,
					`${this.$projectData.projectName}-release.apk`
				],
				frameworkFilesExtensions: [".jar", ".dat", ".so"],
				configurationFileName: "AndroidManifest.xml",
				configurationFilePath: path.join(projectRoot, "src", "main", "AndroidManifest.xml"),
				mergeXmlConfig: [{ "nodename": "manifest", "attrname": "*" }, {"nodename": "application", "attrname": "*"}]
			};
		}

		return this._platformData;
	}

	public validate(): IFuture<void> {
		return (() => {
			this.validatePackageName(this.$projectData.projectId);
			this.validateProjectName(this.$projectData.projectName);

			this.checkJava().wait();
			this.checkAndroid().wait();
		}).future<void>()();
	}

	public createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return (() => {
			let frameworkVersion = this.$fs.readJson(path.join(frameworkDir, "../", "package.json")).wait().version;
			if(semver.lt(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE)) {
				this.$errors.fail(`The NativeScript CLI requires Android runtime ${AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE} or later to work properly.`);
			}

			this.checkGradle().wait();

			this.$fs.ensureDirectoryExists(projectRoot).wait();

			let newTarget = this.getAndroidTarget().wait();
			this.$logger.trace(`Using Android SDK '${newTarget}'.`);
			let versionNumber = _.last(newTarget.split("-"));
			if(this.$options.symlink) {
				this.symlinkDirectory("build-tools", projectRoot, frameworkDir).wait();
				this.symlinkDirectory("libs", projectRoot, frameworkDir).wait();
				this.symlinkDirectory("src", projectRoot, frameworkDir).wait();

				this.$fs.symlink(path.join(frameworkDir, "build.gradle"), path.join(projectRoot, "build.gradle")).wait();
				this.$fs.symlink(path.join(frameworkDir, "settings.gradle"), path.join(projectRoot, "settings.gradle")).wait();
			} else {
				this.copy(projectRoot, frameworkDir, "build-tools libs src", "-R");
				this.copy(projectRoot, frameworkDir, "build.gradle settings.gradle", "-f");
			}

			this.copyResValues(projectRoot, frameworkDir, versionNumber).wait();

		}).future<any>()();
	}

	private copyResValues(projectRoot: string, frameworkDir: string, versionNumber: string): IFuture<void> {
		return (() => {
			let resSourceDir = path.join(frameworkDir, "src", "main", "res");
			let resDestinationDir = this.platformData.appResourcesDestinationDirectoryPath;
			this.$fs.createDirectory(resDestinationDir).wait();
			let versionDirName = AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX + versionNumber;
			let directoriesToCopy = [AndroidProjectService.VALUES_DIRNAME];
			let directoriesInResFolder = this.$fs.readDirectory(resSourceDir).wait();
			let integerFrameworkVersion = parseInt(versionNumber);
			let versionDir = _.find(directoriesInResFolder, dir => dir === versionDirName) ||
				_(directoriesInResFolder)
				.map(dir => {
					return {
						dirName: dir,
						sdkNum: parseInt(dir.substr(AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX.length))
					};
				})
				.filter(dir => dir.dirName.match(AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX) && dir.sdkNum && (!integerFrameworkVersion || (integerFrameworkVersion >= dir.sdkNum)))
				.max(dir => dir.sdkNum)
				.dirName;

			if(versionDir) {
				directoriesToCopy.push(versionDir);
			}

			this.copy(resDestinationDir, resSourceDir, directoriesToCopy.join(" "), "-Rf");
		}).future<void>()();
	}

	public interpolateData(projectRoot: string): IFuture<void> {
		return (() => {
			// Interpolate the activity name and package
			let manifestPath = this.platformData.configurationFilePath;
			shell.sed('-i', /__PACKAGE__/, this.$projectData.projectId, manifestPath);
			shell.sed('-i', /__APILEVEL__/, this.getApiLevel().wait(), manifestPath);

			let stringsFilePath = path.join(this.platformData.appResourcesDestinationDirectoryPath, 'values', 'strings.xml');
			shell.sed('-i', /__NAME__/, this.$projectData.projectName, stringsFilePath);
			shell.sed('-i', /__TITLE_ACTIVITY__/, this.$projectData.projectName, stringsFilePath);

			let gradleSettingsFilePath = path.join(this.platformData.projectRoot, "settings.gradle");
			shell.sed('-i', /__PROJECT_NAME__/,  this.$projectData.projectName, gradleSettingsFilePath);
		}).future<void>()();
	}

	public afterCreateProject(projectRoot: string): IFuture<void> {
		return (() => {
			let targetApi = this.getAndroidTarget().wait();
			this.$logger.trace(`Adroid target: ${targetApi}`);
			this.adjustMinSdk(projectRoot).wait();
		}).future<void>()();
	}

	private adjustMinSdk(projectRoot: string): IFuture<void> {
		return (() => {
			let apiLevel = this.getApiLevel().wait();
			if (apiLevel === "MNC") { // MNC SDK requires that minSdkVersion is set to "MNC"
				shell.sed('-i', /android:minSdkVersion=".*?"/, `android:minSdkVersion="${apiLevel}"`, this.platformData.configurationFilePath);
			}
		}).future<void>()();
	}

	public canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean> {
		return Future.fromResult<boolean>(true);
	}

	public updatePlatform(currentVersion: string, newVersion: string): IFuture<void> {
		return Future.fromResult();
	}

	public buildProject(projectRoot: string, buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			if(this.canUseGradle().wait()) {
				let buildOptions = ["buildapk", `-PcompileSdk=${this.getAndroidTarget().wait()}`];
				if(this.$options.release) {
					buildOptions.push("-Prelease");
					buildOptions.push(`-PksPath=${this.$options.keyStorePath}`);
					buildOptions.push(`-Palias=${this.$options.keyStoreAlias}`);
					buildOptions.push(`-Ppassword=${this.$options.keyStoreAliasPassword}`);
					buildOptions.push(`-PksPassword=${this.$options.keyStorePassword}`);
				}

				if (buildConfig && buildConfig.runSbGenerator) {
					buildOptions.push("-PrunSBGenerator");
				}

				this.spawn("gradle", buildOptions, { stdio: "inherit", cwd: this.platformData.projectRoot }).wait();
			} else {
				this.checkAnt().wait();

				let args = this.getAntArgs(this.$options.release ? "release" : "debug", projectRoot);
				this.spawn('ant', args).wait();
			}
		}).future<void>()();
	}

	public isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return this.$fs.exists(path.join(this.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME));
	}

	public addLibrary(libraryPath: string): IFuture<void> {
		return (() => {
			let name = path.basename(libraryPath);
			let targetLibPath = this.getLibraryPath(name);

			let targetPath = path.dirname(targetLibPath);
			this.$fs.ensureDirectoryExists(targetPath).wait();

			shell.cp("-f", path.join(libraryPath, "*.jar"), targetPath);
			let projectLibsDir = path.join(this.platformData.projectRoot, "libs");
			this.$fs.ensureDirectoryExists(projectLibsDir).wait();
			shell.cp("-f", path.join(libraryPath, "*.jar"), projectLibsDir);
		}).future<void>()();
	}

	public getFrameworkFilesExtensions(): string[] {
		return [".jar", ".dat"];
	}

	public prepareProject(): IFuture<void> {
		return Future.fromResult();
	}

	public prepareAppResources(appResourcesDirectoryPath: string): IFuture<void> {
		return (() => {
			let resourcesDirPath = path.join(appResourcesDirectoryPath, this.platformData.normalizedPlatformName);
			let valuesDirRegExp = /^values/;
			let resourcesDirs = this.$fs.readDirectory(resourcesDirPath).wait().filter(resDir => !resDir.match(valuesDirRegExp));
			_.each(resourcesDirs, resourceDir => {
				this.$fs.deleteDirectory(path.join(this.platformData.appResourcesDestinationDirectoryPath, resourceDir)).wait();
			});
		}).future<void>()();
	}

	public preparePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME);

			// Handle *.jars inside libs folder
			let libsFolderPath = path.join(pluginPlatformsFolderPath, AndroidProjectService.LIBS_FOLDER_NAME);
			if(this.$fs.exists(libsFolderPath).wait()) {
				this.addLibrary(libsFolderPath).wait();
			}
		}).future<void>()();
	}

	public removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let pluginPlatformsFolderPath = this.getPluginPlatformsFolderPath(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME);
			let pluginJars = this.$fs.enumerateFilesInDirectorySync(path.join(pluginPlatformsFolderPath, AndroidProjectService.LIBS_FOLDER_NAME));

			let libsFolderPath = path.join(pluginPlatformsFolderPath, AndroidProjectService.LIBS_FOLDER_NAME);
			_.each(pluginJars, jarName => this.$fs.deleteFile(path.join(libsFolderPath, jarName)).wait());
		}).future<void>()();
	}

	public afterPrepareAllPlugins(): IFuture<void> {
		return Future.fromResult();
	}

	private canUseGradle(): IFuture<boolean> {
		return (() => {
			this.$projectDataService.initialize(this.$projectData.projectDir);
			let frameworkVersion = this.$projectDataService.getValue(this.platformData.frameworkPackageName).wait().version;
			return semver.gte(frameworkVersion, AndroidProjectService.MIN_RUNTIME_VERSION_WITH_GRADLE);
		}).future<boolean>()();
	}

	private getLibraryPath(libraryName: string): string {
		 return path.join(this.$projectData.projectDir, "lib", this.platformData.normalizedPlatformName, libraryName);
	}

	private copy(projectRoot: string, frameworkDir: string, files: string, cpArg: string): void {
		let paths = files.split(' ').map(p => path.join(frameworkDir, p));
		shell.cp(cpArg, paths, projectRoot);
	}

	private spawn(command: string, args: string[], opts?: any): IFuture<void> {
		if (this.$hostInfo.isWindows) {
			args.unshift('/s', '/c', command);
			command = process.env.COMSPEC || 'cmd.exe';
		}

		return this.$childProcess.spawnFromEvent(command, args, "close", opts || { stdio: "inherit"});
	}

	private getAntArgs(configuration: string, projectRoot: string): string[] {
		let args = [configuration, "-f", path.join(projectRoot, "build.xml")];
		if(configuration === "release") {
			if(this.$options.keyStorePath) {
				args = args.concat(["-Dkey.store", this.$options.keyStorePath]);
			}

			if(this.$options.keyStorePassword) {
				args = args.concat(["-Dkey.store.password", this.$options.keyStorePassword]);
			}

			if(this.$options.keyStoreAlias) {
				args = args.concat(["-Dkey.alias", this.$options.keyStoreAlias]);
			}

			if(this.$options.keyStoreAliasPassword) {
				args = args.concat(["-Dkey.alias.password", this.$options.keyStoreAliasPassword]);
			}
		}

		// metadata generation support
		args = args.concat(["-Dns.resources", path.join(__dirname, "../../resources/tools")]);

		return args;
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

	private getAndroidTarget(): IFuture<string> {
		return ((): string => {
			let newTarget = this.$options.sdk ? `${AndroidProjectService.ANDROID_TARGET_PREFIX}-${this.$options.sdk}` : this.getLatestValidAndroidTarget().wait();
			if(!_.contains(this.SUPPORTED_TARGETS, newTarget)) {
				let versionNumber = parseInt(_.last(newTarget.split("-")));
				if(versionNumber && (versionNumber < AndroidProjectService.MIN_SUPPORTED_VERSION)) {
					this.$errors.failWithoutHelp(`The selected target SDK ${newTarget} is not supported. You should target at least ${AndroidProjectService.MIN_SUPPORTED_VERSION}.`);
				}

				if(!_.contains(this.getInstalledTargets().wait(), newTarget)) {
					this.$errors.failWithoutHelp(`You have selected to use ${newTarget}, but it is not currently installed.`+
						' Run \"android\" from your command-line to install/update any missing SDKs or tools.');
				}
				this.$logger.warn(`The selected Android target '${newTarget}' is not verified as supported. Some functionality may not work as expected.`);
			}

			return newTarget;
		}).future<string>()();
	}

	private getLatestValidAndroidTarget(): IFuture<string> {
		return (() => {
			let installedTargets = this.getInstalledTargets().wait();

			// adjust to the latest available version
			let newTarget = _(this.SUPPORTED_TARGETS).sort().findLast(supportedTarget => _.contains(installedTargets, supportedTarget));
			if (!newTarget) {
				this.$errors.failWithoutHelp(`Could not find supported Android target. Please install one of the following: ${this.SUPPORTED_TARGETS.join(", ")}.` +
					" Make sure you have the latest Android tools installed as well." +
					' Run "android" from your command-line to install/update any missing SDKs or tools.');
			}

			return newTarget;
		}).future<string>()();
	}

	private getApiLevel(): IFuture<string> {
		return (() => {
			return this.getAndroidTarget().wait().split('-')[1];
		}).future<string>()();
	}

	private installedTargetsCache: string[] = null;
	private getInstalledTargets(): IFuture<string[]> {
		return (() => {
			if (!this.installedTargetsCache) {
				this.installedTargetsCache = [];
				let output = this.$childProcess.exec('android list targets').wait();
				output.replace(/id: \d+ or "(.+)"/g, (m:string, p1:string) => (this.installedTargetsCache.push(p1), m));
			}
			return this.installedTargetsCache;
		}).future<string[]>()();
	}

	private checkJava(): IFuture<void> {
		return (() => {
			try {
				let javaVersion = this.$sysInfo.getSysInfo().javaVer;
				if(semver.lt(javaVersion, AndroidProjectService.MIN_JAVA_VERSION)) {
					this.$errors.failWithoutHelp(`Your current java version is ${javaVersion}. NativeScript CLI needs at least ${AndroidProjectService.MIN_JAVA_VERSION} version to work correctly. Ensure that you have at least ${AndroidProjectService.MIN_JAVA_VERSION} java version installed and try again.`);
				}
			} catch(error) {
				this.$errors.failWithoutHelp("Error executing command 'java'. Make sure you have java installed and added to your PATH.");
			}
		}).future<void>()();
	}

	private checkAnt(): IFuture<void> {
		return (() => {
			try {
				this.$childProcess.exec("ant -version").wait();
			} catch(error) {
				this.$errors.fail("Error executing commands 'ant', make sure you have ant installed and added to your PATH.");
			}
		}).future<void>()();
	}

	private checkGradle(): IFuture<void> {
		return (() => {
			try {
				this.$childProcess.exec("gradle -v").wait();
			} catch(error) {
				this.$errors.fail("Error executing commands 'gradle', make sure you have gradle installed and added to your PATH.");
			}
		}).future<void>()();
	}

	private checkAndroid(): IFuture<void> {
		return (() => {
			try {
				this.$childProcess.exec('android list targets').wait();
			} catch(error) {
				if (error.match(/command\snot\sfound/)) {
					this.$errors.fail("The command \"android\" failed. Make sure you have the latest Android SDK installed, and the \"android\" command (inside the tools/ folder) is added to your path.");
				} else {
					this.$errors.fail("An error occurred while listing Android targets");
				}
			}
		}).future<void>()();
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
}
$injector.register("androidProjectService", AndroidProjectService);
