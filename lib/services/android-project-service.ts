///<reference path="../.d.ts"/>
"use strict";
import path = require("path");
import shell = require("shelljs");
import util = require("util");
import Future = require("fibers/future");
import constants = require("../constants");
import helpers = require("../common/helpers");
import fs = require("fs");
import os = require("os");

import androidProjectPropertiesManagerLib = require("./android-project-properties-manager");
import projectServiceBaseLib = require("./platform-project-service-base");

class AndroidProjectService extends projectServiceBaseLib.PlatformProjectServiceBase implements IPlatformProjectService {
	private static MIN_SUPPORTED_VERSION = 17;
	private SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21", "android-22"]; // forbidden for now: "android-MNC"
	private static ANDROID_TARGET_PREFIX = "android";
	private static RES_DIRNAME = "res";
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";
	private static ANDROID_PLATFORM_NAME = "android";
	private static LIBS_FOLDER_NAME = "libs";
	

	private targetApi: string;
	private _androidProjectPropertiesManagers: IDictionary<IAndroidProjectPropertiesManager>;

	constructor(private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions,
		private $projectData: IProjectData,
		private $propertiesParser: IPropertiesParser,
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
				appDestinationDirectoryPath: path.join(projectRoot, "assets"),
				appResourcesDestinationDirectoryPath: path.join(projectRoot, "res"),
				platformProjectService: this,
				emulatorServices: this.$androidEmulatorServices,
				projectRoot: projectRoot,
				deviceBuildOutputPath: path.join(this.$projectData.platformsDir, "android", "bin"),
				validPackageNamesForDevice: [
					util.format("%s-%s.%s", this.$projectData.projectName, "debug", "apk"),
					util.format("%s-%s.%s", this.$projectData.projectName, "release", "apk")
				],
				frameworkFilesExtensions: [".jar", ".dat", ".so"],
				configurationFileName: "AndroidManifest.xml",
				configurationFilePath: path.join(this.$projectData.platformsDir, "android", "AndroidManifest.xml"),
				mergeXmlConfig: [{ "nodename": "manifest", "attrname": "*" }, {"nodename": "application", "attrname": "*"}]
			};
		}

		return this._platformData;
	}

	public validate(): IFuture<void> {
		return (() => {
			this.validatePackageName(this.$projectData.projectId);
			this.validateProjectName(this.$projectData.projectName);

			this.checkAnt().wait() && this.checkAndroid().wait();
		}).future<void>()();
	}

	public createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(projectRoot).wait();
			
			let newTarget = this.getAndroidTarget(frameworkDir).wait();
			this.$logger.trace(`Using Android SDK '${newTarget}'.`);
			let versionNumber = _.last(newTarget.split("-"));
			if(this.$options.symlink) {
				this.copyResValues(projectRoot, frameworkDir, versionNumber).wait();
				this.copy(projectRoot, frameworkDir, ".project AndroidManifest.xml project.properties custom_rules.xml", "-f").wait();

				this.symlinkDirectory("assets", projectRoot, frameworkDir).wait();
				this.symlinkDirectory("libs", projectRoot, frameworkDir).wait();
			} else {
				this.copyResValues(projectRoot, frameworkDir, versionNumber).wait();
				this.copy(projectRoot, frameworkDir, "assets libs", "-R").wait();
				this.copy(projectRoot, frameworkDir, ".project AndroidManifest.xml project.properties custom_rules.xml", "-f").wait();
			}

			if(newTarget) {
				this.updateTarget(projectRoot, newTarget).wait();
			}

			// Create src folder
			let packageName = this.$projectData.projectId;
			let packageAsPath = packageName.replace(/\./g, path.sep);
			let activityDir = path.join(projectRoot, 'src', packageAsPath);
			this.$fs.createDirectory(activityDir).wait();

		}).future<any>()();
	}

	private copyResValues(projectRoot: string, frameworkDir: string, versionNumber: string): IFuture<void> {
		return (() => {
			let resSourceDir = path.join(frameworkDir, AndroidProjectService.RES_DIRNAME);
			let resDestinationDir = path.join(projectRoot, AndroidProjectService.RES_DIRNAME);
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
					}
				})
				.filter(dir => dir.dirName.match(AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX) && dir.sdkNum && (!integerFrameworkVersion || (integerFrameworkVersion >= dir.sdkNum)))
				.max(dir => dir.sdkNum)
				.dirName;

			if(versionDir) {
				directoriesToCopy.push(versionDir);
			}

			this.copy(resDestinationDir, resSourceDir, directoriesToCopy.join(" "), "-R").wait();
		}).future<void>()();
	}

	public interpolateData(projectRoot: string): IFuture<void> {
		return (() => {
			// Interpolate the activity name and package
			let manifestPath = path.join(projectRoot, "AndroidManifest.xml");
			let safeActivityName = this.$projectData.projectName.replace(/\W/g, '');
			shell.sed('-i', /__PACKAGE__/, this.$projectData.projectId, manifestPath);
			shell.sed('-i', /__APILEVEL__/, this.getTarget(projectRoot).wait().split('-')[1], manifestPath);

			let stringsFilePath = path.join(projectRoot, 'res', 'values', 'strings.xml');
			shell.sed('-i', /__NAME__/, this.$projectData.projectName, stringsFilePath);
			shell.sed('-i', /__TITLE_ACTIVITY__/, this.$projectData.projectName, stringsFilePath);
			shell.sed('-i', /__NAME__/, this.$projectData.projectName, path.join(projectRoot, '.project'));
		}).future<void>()();
	}

	public afterCreateProject(projectRoot: string): IFuture<void> {
		return (() => {
			let targetApi = this.getTarget(projectRoot).wait();
			this.$logger.trace("Android target: %s", targetApi);
			this.runAndroidUpdate(projectRoot, targetApi).wait();
			this.adjustMinSdk(projectRoot);
		}).future<void>()();
	}

	private adjustMinSdk(projectRoot: string): void {
		let manifestPath = path.join(projectRoot, "AndroidManifest.xml");
		let apiLevel = this.getTarget(projectRoot).wait().split('-')[1];
		if (apiLevel === "MNC") { // MNC SDK requires that minSdkVersion is set to "MNC"
			shell.sed('-i', /android:minSdkVersion=".*?"/, `android:minSdkVersion="${apiLevel}"`, manifestPath);
		}
	}

	public getDebugOnDeviceSetup(): Mobile.IDebugOnDeviceSetup {
		return { };
	}

	public canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean> {
		return Future.fromResult<boolean>(true);
	}

	public updatePlatform(currentVersion: string, newVersion: string): IFuture<void> {
		return (() => { }).future<void>()();
	}

	public buildProject(projectRoot: string): IFuture<void> {
		let buildConfiguration = this.$options.release ? "release" : "debug";
		let args = this.getAntArgs(buildConfiguration, projectRoot);
		return this.spawn('ant', args);
	}

	public isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return this.$fs.exists(path.join(projectRoot, "assets", constants.APP_FOLDER_NAME));
	}

	private getProjectPropertiesManager(filePath: string): IAndroidProjectPropertiesManager {
		if(!this._androidProjectPropertiesManagers[filePath]) {
			this._androidProjectPropertiesManagers[filePath] = this.$injector.resolve(androidProjectPropertiesManagerLib.AndroidProjectPropertiesManager, { directoryPath: filePath });
		}
		
		return this._androidProjectPropertiesManagers[filePath];
	}
	
	private parseProjectProperties(projDir: string, destDir: string): IFuture<void> { // projDir is libraryPath, targetPath is the path to lib folder
		return (() => {
			let projProp = path.join(projDir, "project.properties");
			if (!this.$fs.exists(projProp).wait()) {
				this.$logger.warn("Warning: File %s does not exist", projProp);
				return;
			}
			
			let projectPropertiesManager = this.getProjectPropertiesManager(projDir);
			let references = projectPropertiesManager.getProjectReferences().wait();
			_.each(references, reference => {
				let adjustedPath = this.$fs.isRelativePath(reference.path) ? path.join(projDir, reference.path) : reference.path;
				this.parseProjectProperties(adjustedPath, destDir).wait();
			});
	
			this.$logger.info("Copying %s", projDir);
			shell.cp("-Rf", projDir, destDir);
	
			let targetDir = path.join(destDir, path.basename(projDir));
			let targetSdk = `android-${this.$options.sdk || AndroidProjectService.MIN_SUPPORTED_VERSION}`;
			this.$logger.info("Generate build.xml for %s", targetDir);
			this.runAndroidUpdate(targetDir, targetSdk).wait();
		}).future<void>()();
	}

	public addLibrary(libraryPath: string): IFuture<void> {
		return (() => {
			let name = path.basename(libraryPath);
			let targetLibPath = this.getLibraryPath(name);
			
			let targetPath = path.dirname(targetLibPath);
			this.$fs.ensureDirectoryExists(targetPath).wait();

			if(this.$fs.exists(path.join(libraryPath, "project.properties")).wait()) {
				this.parseProjectProperties(libraryPath, targetPath).wait();
			}

			shell.cp("-f", path.join(libraryPath, "*.jar"), targetPath);
			let projectLibsDir = path.join(this.platformData.projectRoot, "libs");
			this.$fs.ensureDirectoryExists(projectLibsDir).wait();
			shell.cp("-f", path.join(libraryPath, "*.jar"), projectLibsDir);

			let libProjProp = path.join(libraryPath, "project.properties");
			if (this.$fs.exists(libProjProp).wait()) {
				this.updateProjectReferences(this.platformData.projectRoot, targetLibPath).wait();
			}
		}).future<void>()();
	}
	
	public getFrameworkFilesExtensions(): string[] {
		return [".jar", ".dat"];
	}
	
	public prepareProject(): IFuture<void> {
		return (() => { }).future<void>()();
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
				let libsFolderContents = this.$fs.readDirectory(libsFolderPath).wait();
				_(libsFolderContents)
					.filter(libsFolderItem => path.extname(libsFolderItem) === ".jar")
					.each(jar => this.addLibrary(path.join(libsFolderPath, jar)).wait())
					.value();
			}
			
			// Handle android libraries
			let librarries = this.getAllLibrariesForPlugin(pluginData).wait();
			_.each(librarries, libraryName => this.addLibrary(path.join(pluginPlatformsFolderPath, libraryName)).wait());
		}).future<void>()();
	}
	
	public removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return (() => {
			let projectPropertiesManager = this.getProjectPropertiesManager(this.platformData.projectRoot);			
			
			let libraries = this.getAllLibrariesForPlugin(pluginData).wait();	
			_.each(libraries, libraryName => {
				let libraryPath = this.getLibraryPath(libraryName);
				let libraryRelativePath = this.getLibraryRelativePath(this.platformData.projectRoot, libraryPath);
				projectPropertiesManager.removeProjectReference(libraryRelativePath).wait();
				this.$fs.deleteDirectory(libraryPath).wait();
			});
			
		}).future<void>()();
	}
	
	private getLibraryRelativePath(basePath: string, libraryPath: string): string {
		return path.relative(basePath, libraryPath).split("\\").join("/");		
	}
	
	private getLibraryPath(libraryName: string): string {
		 return path.join(this.$projectData.projectDir, "lib", this.platformData.normalizedPlatformName, libraryName);
	}
	
	private updateProjectReferences(projDir: string, libraryPath: string): IFuture<void> {
		let relLibDir = this.getLibraryRelativePath(projDir, libraryPath);
		
		let projectPropertiesManager = this.getProjectPropertiesManager(projDir);		
		return projectPropertiesManager.addProjectReference(relLibDir);
	}
	
	private getAllLibrariesForPlugin(pluginData: IPluginData): IFuture<string[]> {
		return (() => {
			let filterCallback = (fileName: string, pluginPlatformsFolderPath: string) => fileName !== AndroidProjectService.LIBS_FOLDER_NAME && this.$fs.exists(path.join(pluginPlatformsFolderPath, fileName, "project.properties")).wait();
			return this.getAllNativeLibrariesForPlugin(pluginData, AndroidProjectService.ANDROID_PLATFORM_NAME, filterCallback).wait();
		}).future<string[]>()();
	}

	private copy(projectRoot: string, frameworkDir: string, files: string, cpArg: string): IFuture<void> {
		return (() => {
			let paths = files.split(' ').map(p => path.join(frameworkDir, p));
			shell.cp(cpArg, paths, projectRoot);
		}).future<void>()();
	}

	private spawn(command: string, args: string[]): IFuture<void> {
		if (this.$hostInfo.isWindows) {
			args.unshift('/s', '/c', command);
			command = process.env.COMSPEC || 'cmd.exe';
		}

		return this.$childProcess.spawnFromEvent(command, args, "close", {stdio: "inherit"});
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
				args = args.concat(["-Dkey.alias.password", this.$options.keyStoreAliasPassword])
			}
		}

		// metadata generation support
		args = args.concat(["-Dns.resources", path.join(__dirname, "../../resources/tools")]);

		return args;
	}

	private runAndroidUpdate(projectPath: string, targetApi: string): IFuture<void> {
		let args = [
			"--path", projectPath,
			"--target", targetApi,
			"--name", this.$projectData.projectName
		];

		return this.spawn("android", ['update', 'project'].concat(args));
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

	private getAndroidTarget(frameworkDir: string): IFuture<string> {
		return ((): string => { 
			let newTarget = this.$options.sdk ? `${AndroidProjectService.ANDROID_TARGET_PREFIX}-${this.$options.sdk}` : this.getLatestValidAndroidTarget(frameworkDir).wait();
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

	private getLatestValidAndroidTarget(frameworkDir: string): IFuture<string> {
		return (() => {
			let validTarget = this.getTarget(frameworkDir).wait();
			let installedTargets = this.getInstalledTargets().wait();

			// adjust to the latest available version
			var newTarget = _(this.SUPPORTED_TARGETS).sort().findLast(supportedTarget => _.contains(installedTargets, supportedTarget));
			if (!newTarget) {
				this.$errors.failWithoutHelp(`Could not find supported Android target. Please install one of the following: ${this.SUPPORTED_TARGETS.join(", ")}.` + 
					" Make sure you have the latest Android tools installed as well." + 
					' Run "android" from your command-line to install/update any missing SDKs or tools.')
			}

			return newTarget;
		}).future<string>()();
	}

	private updateTarget(projectRoot: string, newTarget: string): IFuture<void> {
		return (() => {
			let file = path.join(projectRoot, "project.properties");
			let editor = this.$propertiesParser.createEditor(file).wait();
			editor.set("target", newTarget);
			let future = new Future<void>();
			editor.save((err:any) => {
				if (err) {
					future.throw(err);
				} else {
					this.targetApi = null; // so that later we can repopulate the cache
					future.return();
				}
			});
			future.wait();
		}).future<void>()();
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

	private getTarget(projectRoot: string): IFuture<string> {
		return (() => {
			if(!this.targetApi) {
				let projectPropertiesFilePath = path.join(projectRoot, "project.properties");

				if (this.$fs.exists(projectPropertiesFilePath).wait()) {
					let properties = this.$propertiesParser.createEditor(projectPropertiesFilePath).wait();
					this.targetApi = properties.get("target");
				}
			}

			return this.targetApi;
		}).future<string>()();
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
