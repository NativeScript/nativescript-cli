///<reference path="../.d.ts"/>
"use strict";
import path = require("path");
import shell = require("shelljs");
import util = require("util");
import Future = require("fibers/future");
import options = require("../common/options");
import constants = require("../constants");
import hostInfo = require("../common/host-info");
import helpers = require("../common/helpers");
import fs = require("fs");
import os = require("os");

class AndroidProjectService implements IPlatformProjectService {
	private SUPPORTED_TARGETS = ["android-17", "android-18", "android-19", "android-21"];
	private static METADATA_DIRNAME = "__metadata";
	private static RES_DIRNAME = "res";
	private static VALUES_DIRNAME = "values";
	private static VALUES_VERSION_DIRNAME_PREFIX = AndroidProjectService.VALUES_DIRNAME + "-v";

	private targetApi: string;

	constructor(private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectData: IProjectData,
		private $propertiesParser: IPropertiesParser) {
	}

	public get platformData(): IPlatformData {
		return {
			frameworkPackageName: "tns-android",
			normalizedPlatformName: "Android",
			platformProjectService: this,
			emulatorServices: this.$androidEmulatorServices,
			projectRoot: path.join(this.$projectData.platformsDir, "android"),
			deviceBuildOutputPath: path.join(this.$projectData.platformsDir, "android", "bin"),
			validPackageNamesForDevice: [
				util.format("%s-%s.%s", this.$projectData.projectName, "debug", "apk"),
				util.format("%s-%s.%s", this.$projectData.projectName, "release", "apk")
			],
			frameworkFilesExtensions: [".jar", ".dat", ".so"]
		};
	}

	public validate(): IFuture<void> {
		return (() => {
			this.validatePackageName(this.$projectData.projectId);
			this.validateProjectName(this.$projectData.projectName);

			this.checkAnt().wait() && this.checkAndroid().wait() && this.checkJava().wait();
		}).future<void>()();
	}

	public createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(projectRoot).wait();
			var newTarget = this.getLatestValidAndroidTarget(frameworkDir).wait();
			var versionNumber = _.last(newTarget.split("-"));
			if(options.symlink) {
				this.copyResValues(projectRoot, frameworkDir, versionNumber).wait();
				this.copy(projectRoot, frameworkDir, ".project AndroidManifest.xml project.properties", "-f").wait();

				this.symlinkDirectory("assets", projectRoot, frameworkDir).wait();
				this.symlinkDirectory("libs", projectRoot, frameworkDir).wait();
			} else {
				this.copyResValues(projectRoot, frameworkDir, versionNumber).wait();
				this.copy(projectRoot, frameworkDir, "assets libs", "-R").wait();
				this.copy(projectRoot, frameworkDir, ".project AndroidManifest.xml project.properties", "-f").wait();
			}

			if(newTarget) {
				this.updateTarget(projectRoot, newTarget).wait();
			}

			// Create src folder
			var packageName = this.$projectData.projectId;
			var packageAsPath = packageName.replace(/\./g, path.sep);
			var activityDir = path.join(projectRoot, 'src', packageAsPath);
			this.$fs.createDirectory(activityDir).wait();

		}).future<any>()();
	}

	private copyResValues(projectRoot: string, frameworkDir: string, versionNumber: string): IFuture<void> {
		return (() => {
			var resSourceDir = path.join(frameworkDir, AndroidProjectService.RES_DIRNAME);
			var resDestinationDir = path.join(projectRoot, AndroidProjectService.RES_DIRNAME);
			this.$fs.createDirectory(resDestinationDir).wait();
			var versionDirName = AndroidProjectService.VALUES_VERSION_DIRNAME_PREFIX + versionNumber;
			var directoriesToCopy = [AndroidProjectService.VALUES_DIRNAME];
			if(this.$fs.exists(path.join(resSourceDir, versionDirName)).wait()) {
				directoriesToCopy.push(versionDirName);
			}

			this.copy(resDestinationDir, resSourceDir, directoriesToCopy.join(" "), "-R").wait();
		}).future<void>()();
	}

	public interpolateData(projectRoot: string): IFuture<void> {
		return (() => {
			// Interpolate the activity name and package
			var manifestPath = path.join(projectRoot, "AndroidManifest.xml");
			var safeActivityName = this.$projectData.projectName.replace(/\W/g, '');
			shell.sed('-i', /__PACKAGE__/, this.$projectData.projectId, manifestPath);
			shell.sed('-i', /__APILEVEL__/, this.getTarget(projectRoot).wait().split('-')[1], manifestPath);

			var stringsFilePath = path.join(projectRoot, 'res', 'values', 'strings.xml');
			shell.sed('-i', /__NAME__/, this.$projectData.projectName, stringsFilePath);
			shell.sed('-i', /__TITLE_ACTIVITY__/, this.$projectData.projectName, stringsFilePath);
			shell.sed('-i', /__NAME__/, this.$projectData.projectName, path.join(projectRoot, '.project'));

		}).future<void>()();
	}

	public afterCreateProject(projectRoot: string): IFuture<void> {
		return (() => {
			var targetApi = this.getTarget(projectRoot).wait();
			this.$logger.trace("Android target: %s", targetApi);
			this.runAndroidUpdate(projectRoot, targetApi).wait();
		}).future<void>()();
	}

	public prepareProject(platformData: IPlatformData): IFuture<string> {
		return (() => {
			var appSourceDirectory = path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME);
			var assetsDirectory = path.join(platformData.projectRoot, "assets");
			var resDirectory = path.join(platformData.projectRoot, "res");

			shell.cp("-Rf", path.join(appSourceDirectory, "*"), assetsDirectory);

			var appResourcesDirectoryPath = path.join(assetsDirectory, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath).wait()) {
				shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), resDirectory);
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			return assetsDirectory;

		}).future<string>()();
	}

	public getDebugOnDeviceSetup(): Mobile.IDebugOnDeviceSetup {
		return { };
	}

	public canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean> {
		return (() => {
			return true;
		}).future<boolean>()();
	}

	public updatePlatform(currentVersion: string, newVersion: string): IFuture<void> {
		return (() => { }).future<void>()();
	}

	private updateMetadata(projectRoot: string): void {
		var projMetadataDir = path.join(projectRoot, "assets", "metadata");
		var libsmetadataDir = path.join(projectRoot, "../../lib", this.platformData.normalizedPlatformName, AndroidProjectService.METADATA_DIRNAME);
		shell.cp("-f", path.join(libsmetadataDir, "*.dat"), projMetadataDir);
	}

	private generateMetadata(projectRoot: string): void {
		var metadataGeneratorPath = path.join(__dirname, "../../resources/tools/metadata-generator.jar");
		var libsFolder = path.join(projectRoot, "../../lib", this.platformData.normalizedPlatformName);
		var metadataDirName = AndroidProjectService.METADATA_DIRNAME;
		var outDir = path.join(libsFolder, metadataDirName);
		this.$fs.ensureDirectoryExists(outDir).wait();

		shell.cp("-f", path.join(__dirname, "../../resources/tools/android.jar"), libsFolder);
		shell.cp("-f", path.join(__dirname, "../../resources/tools/android-support-v4.jar"), libsFolder);
		shell.cp("-f", path.join(projectRoot, "libs/*.jar"), libsFolder);

		this.spawn('java', ['-jar', metadataGeneratorPath, libsFolder, outDir]).wait();
	}

	public buildProject(projectRoot: string): IFuture<void> {
		return (() => {
			var buildConfiguration = options.release ? "release" : "debug";
			var args = this.getAntArgs(buildConfiguration, projectRoot);
			var argsSaved = this.getAntArgs(buildConfiguration, projectRoot);
			this.spawn('ant', args).wait();
			this.generateMetadata(projectRoot);
			this.updateMetadata(projectRoot);
			// build the project again in order to include the newly generated metadata
			this.spawn('ant', argsSaved).wait();
		}).future<void>()();
	}

	public isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return this.$fs.exists(path.join(projectRoot, "assets", constants.APP_FOLDER_NAME));
	}

	private generateBuildFile(projDir: string, targetSdk: string): void {
		this.$logger.info("Generate build.xml for %s", projDir);
		var cmd = util.format("android update project -p %s --target %s --subprojects", projDir, targetSdk);
		this.$childProcess.exec(cmd).wait();
	}

	private parseProjectProperties(projDir: string, destDir: string): void {
		var projProp = path.join(projDir, "project.properties");

		if (!this.$fs.exists(projProp).wait()) {
			this.$logger.warn("Warning: File %s does not exist", projProp);
			return;
		}

		var lines = this.$fs.readText(projProp, "utf-8").wait().split(os.EOL);

		var regEx = /android\.library\.reference\.(\d+)=(.*)/;
		lines.forEach(elem => {
			var match = elem.match(regEx);
			if (match) {
				var libRef: ILibRef = { idx: parseInt(match[1]), path: match[2].trim() };
				libRef.adjustedPath = this.$fs.isRelativePath(libRef.path) ? path.join(projDir, libRef.path) : libRef.path;
				this.parseProjectProperties(libRef.adjustedPath, destDir);
			}
		});

		this.$logger.info("Copying %s", projDir);
		shell.cp("-Rf", projDir, destDir);

		var targetDir = path.join(destDir, path.basename(projDir));
		// TODO: parametrize targetSdk
		var targetSdk = "android-17";
		this.generateBuildFile(targetDir, targetSdk);
	}

	private getProjectReferences(projDir: string): ILibRef[]{
		var projProp = path.join(projDir, "project.properties");

		var lines = this.$fs.readText(projProp, "utf-8").wait().split(os.EOL);

		var refs: ILibRef[] = [];

		var regEx = /android\.library\.reference\.(\d+)=(.*)/;
		lines.forEach(elem => {
			var match = elem.match(regEx);
			if (match) {
				var libRef: ILibRef = { idx: parseInt(match[1]), path: match[2] };
				libRef.adjustedPath = path.join(projDir, libRef.path);
				refs.push(libRef);
			}
		});

		return refs;
	}

	private updateProjectReferences(projDir: string, libraryPath: string): void {
		var refs = this.getProjectReferences(projDir);
		var maxIdx = refs.length > 0 ? _.max(refs, r => r.idx).idx : 0;

		var relLibDir = path.relative(projDir, libraryPath).split("\\").join("/");

		var libRefExists = _.any(refs, r => path.normalize(r.path) === path.normalize(relLibDir));

		if (!libRefExists) {
			var projRef = util.format("%sandroid.library.reference.%d=%s", os.EOL, maxIdx + 1, relLibDir);
			var projProp = path.join(projDir, "project.properties");
			fs.appendFileSync(projProp, projRef, { encoding: "utf-8" });
		}
	}

	public addLibrary(platformData: IPlatformData, libraryPath: string): IFuture<void> {
		return (() => {
			var name = path.basename(libraryPath);
			var projDir = this.$projectData.projectDir;
			var targetPath = path.join(projDir, "lib", platformData.normalizedPlatformName);
			this.$fs.ensureDirectoryExists(targetPath).wait();

			this.parseProjectProperties(libraryPath, targetPath);

			shell.cp("-f", path.join(libraryPath, "*.jar"), targetPath);
			var projectLibsDir = path.join(platformData.projectRoot, "libs");
			this.$fs.ensureDirectoryExists(projectLibsDir).wait();
			shell.cp("-f", path.join(libraryPath, "*.jar"), projectLibsDir);

			var targetLibPath = path.join(targetPath, path.basename(libraryPath));

			var libProjProp = path.join(libraryPath, "project.properties");
			if (this.$fs.exists(libProjProp).wait()) {
				this.updateProjectReferences(platformData.projectRoot, targetLibPath);
			}
		}).future<void>()();
	}

	public getFrameworkFilesExtensions(): string[] {
		return [".jar", ".dat"];
	}

	private copy(projectRoot: string, frameworkDir: string, files: string, cpArg: string): IFuture<void> {
		return (() => {
			var paths = files.split(' ').map(p => path.join(frameworkDir, p));
			shell.cp(cpArg, paths, projectRoot);
		}).future<void>()();
	}

	private spawn(command: string, args: string[]): IFuture<void> {
		if (hostInfo.isWindows()) {
			args.unshift('/s', '/c', command);
			command = 'cmd';
		}

		return this.$childProcess.spawnFromEvent(command, args, "close", {stdio: "inherit"});
	}

	private getAntArgs(configuration: string, projectRoot: string): string[] {
		var args = [configuration, "-f", path.join(projectRoot, "build.xml")];
		if(configuration === "release") {
			if(options.keyStorePath) {
				args = args.concat(["-Dkey.store", options.keyStorePath]);
			}

			if(options.keyStorePassword) {
				args = args.concat(["-Dkey.store.password", options.keyStorePassword]);
			}

			if(options.keyStoreAlias) {
				args = args.concat(["-Dkey.alias", options.keyStoreAlias]);
			}

			if(options.keyStoreAliasPassword) {
				args = args.concat(["-Dkey.alias.password", options.keyStoreAliasPassword])
			}
		}

		return args;
	}

	private runAndroidUpdate(projectPath: string, targetApi: string): IFuture<void> {
		return (() => {
			var args = [
				"--path", projectPath,
				"--target", targetApi,
				"--name", this.$projectData.projectName
			];

			this.spawn("android", ['update', 'project'].concat(args)).wait();
		}).future<void>()();
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

	private getLatestValidAndroidTarget(frameworkDir: string): IFuture<string> {
		return (() => {
			var validTarget = this.getTarget(frameworkDir).wait();
			var installedTargets = this.getInstalledTargets().wait();

			// adjust to the latest available version
			var	newTarget = _(this.SUPPORTED_TARGETS).sort().findLast(supportedTarget => _.contains(installedTargets, supportedTarget));
			if (!newTarget) {
				this.$errors.fail("Please install Android target %s. Make sure you have the latest Android tools installed as well." +
					" Run \"android\" from your command-line to install/update any missing SDKs or tools.",
					validTarget.split('-')[1]);
			}

			return newTarget;
		}).future<string>()();
	}

	private updateTarget(projectRoot: string, newTarget: string): IFuture<void> {
		return (() => {
			var file = path.join(projectRoot, "project.properties");
			var editor = this.$propertiesParser.createEditor(file).wait();
			editor.set("target", newTarget);
			var future = new Future<void>();
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
				var output = this.$childProcess.exec('android list targets').wait();
				output.replace(/id: \d+ or "(.+)"/g, (m:string, p1:string) => (this.installedTargetsCache.push(p1), m));
			}
			return this.installedTargetsCache;
		}).future<string[]>()();
	}

	private getTarget(projectRoot: string): IFuture<string> {
		return (() => {
			if(!this.targetApi) {
				var projectPropertiesFilePath = path.join(projectRoot, "project.properties");

				if (this.$fs.exists(projectPropertiesFilePath).wait()) {
					var properties = this.$propertiesParser.createEditor(projectPropertiesFilePath).wait();
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
				this.$errors.fail("Error executing commands 'ant', make sure you have ant installed and added to your PATH.")
			}
		}).future<void>()();
	}

	private checkJava(): IFuture<void> {
		return (() => {
			try {
				this.$childProcess.exec("java -version").wait();
			} catch(error) {
				this.$errors.fail("%s\n Failed to run 'java', make sure your java environment is set up.\n Including JDK and JRE.\n Your JAVA_HOME variable is %s", error, process.env.JAVA_HOME);
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
			var directoryContent = this.$fs.readDirectory(path.join(frameworkDir, directoryName)).wait();

			_.each(directoryContent, (file: string) => {
				var sourceFilePath = path.join(frameworkDir, directoryName, file);
				var destinationFilePath = path.join(projectRoot, directoryName, file);
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
