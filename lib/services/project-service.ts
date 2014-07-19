///<reference path="../.d.ts"/>

import path = require("path");
import options = require("./../options");
import shell = require("shelljs");
import osenv = require("osenv");
import util = require("util");
import helpers = require("./../common/helpers");

class ProjectData implements IProjectData {
	public projectDir: string;
	public platformsDir: string;
	public projectFilePath: string;
	public projectId: string;
	public projectName: string;

	constructor(private $fs: IFileSystem,
		private $projectHelper: IProjectHelper,
		private $config) {
		this.initializeProjectData().wait();
	}

	private initializeProjectData(): IFuture<void> {
		return(() => {
			var projectDir = this.$projectHelper.projectDir;

			if(projectDir) {
				this.projectDir = projectDir;
				this.projectName = path.basename(projectDir);
				this.platformsDir = path.join(projectDir, "platforms");
				this.projectFilePath = path.join(projectDir, this.$config.PROJECT_FILE_NAME);

				if (this.$fs.exists(this.projectFilePath).wait()) {
					var fileContent = this.$fs.readJson(this.projectFilePath).wait();
					this.projectId = fileContent.id;
				}
			}

		}).future<void>()();
	}
}
$injector.register("projectData", ProjectData);

export class ProjectService implements IProjectService {
	private static DEFAULT_PROJECT_ID = "com.telerik.tns.HelloWorld";
	private static DEFAULT_PROJECT_NAME = "HelloNativescript";
	public static APP_FOLDER_NAME = "app";

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $projectTemplatesService: IProjectTemplatesService,
		private $projectData: IProjectData,
		private $config) { }

	public createProject(projectName: string, projectId: string): IFuture<void> {
		return(() => {
			var projectDir = path.resolve(options.path || ".");

			projectId = projectId || ProjectService.DEFAULT_PROJECT_ID;
			projectName = projectName || ProjectService.DEFAULT_PROJECT_NAME;

			projectDir = path.join(projectDir, projectName);
			this.$fs.createDirectory(projectDir).wait();

			var customAppPath = this.getCustomAppPath();
			if(customAppPath) {
				customAppPath = path.resolve(customAppPath);
			}

			if(this.$fs.exists(projectDir).wait() && !this.$fs.isEmptyDir(projectDir).wait()) {
				this.$errors.fail("Path already exists and is not empty %s", projectDir);
			}

			this.$logger.trace("Creating a new NativeScript project with name %s and id %s at location %s", projectName, projectId, projectDir);

			var appDirectory = path.join(projectDir, ProjectService.APP_FOLDER_NAME);
			var appPath: string = null;

			if(customAppPath) {
				this.$logger.trace("Using custom app from %s", customAppPath);

				// Make sure that the source app/ is not a direct ancestor of a target app/
				var relativePathFromSourceToTarget = path.relative(customAppPath, appDirectory);
				var doesRelativePathGoUpAtLeastOneDir = relativePathFromSourceToTarget.split(path.sep)[0] == "..";
				if(!doesRelativePathGoUpAtLeastOneDir) {
					this.$errors.fail("Project dir %s must not be created at/inside the template used to create the project %s.", projectDir, customAppPath);
				}
				this.$logger.trace("Copying custom app into %s", appDirectory);
				appPath = customAppPath;
			} else {
				// No custom app - use nativescript hello world application
				this.$logger.trace("Using NativeScript hello world application");
				var defaultTemplatePath = this.$projectTemplatesService.defaultTemplatePath.wait();
				this.$logger.trace("Copying Nativescript hello world application into %s", appDirectory);
				appPath = defaultTemplatePath;
			}

			this.createProjectCore(projectDir, appPath,  projectId, false).wait();
		}).future<void>()();
	}

	private createProjectCore(projectDir: string, appPath: string,  projectId: string, symlink?: boolean): IFuture<void> {
		return (() => {
			if(!this.$fs.exists(projectDir).wait()) {
				this.$fs.createDirectory(projectDir).wait();
			}
			if(symlink) {
				// TODO: Implement support for symlink the app folder instead of copying
			} else {
				var appDir = path.join(projectDir, ProjectService.APP_FOLDER_NAME);
				this.$fs.createDirectory(appDir).wait();
				shell.cp('-R', path.join(appPath, "*"), appDir);
			}
			this.createBasicProjectStructure(projectDir,  projectId).wait();
		}).future<void>()();
	}

	private createBasicProjectStructure(projectDir: string,  projectId: string): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(path.join(projectDir, "platforms")).wait();
			this.$fs.createDirectory(path.join(projectDir, "tns_modules")).wait();
			this.$fs.createDirectory(path.join(projectDir, "hooks")).wait();

			var projectData = { id: projectId };
			this.$fs.writeFile(path.join(projectDir, this.$config.PROJECT_FILE_NAME), JSON.stringify(projectData)).wait();
		}).future<void>()();
	}

	private getCustomAppPath(): string {
		var customAppPath = options["copy-from"] || options["link-to"];
		if(customAppPath) {
			if(customAppPath.indexOf("http") >= 0) {
				this.$errors.fail("Only local paths for custom app are supported.");
			}

			if(customAppPath.substr(0, 1) === '~') {
				customAppPath = path.join(osenv.home(), customAppPath.substr(1));
			}
		}

		return customAppPath;
	}

 	public ensureProject() {
		if (this.$projectData.projectDir === "" || !this.$fs.exists(this.$projectData.projectFilePath).wait()) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}
	}
}
$injector.register("projectService", ProjectService);

class PlatformProjectService implements IPlatformProjectService {
	private static APP_RESOURCES_FOLDER_NAME = "App_Resources";
	public static PROJECT_FRAMEWORK_DIR = "framework";

	constructor(private $npm: INodePackageManager,
		private $platformsData: IPlatformsData,
		private $projectData: IProjectData,
		private $logger: ILogger,
		private $fs: IFileSystem) { }

	public createProject(platform: string): IFuture<void> {
		return(() => {
			var platformData = this.$platformsData.getPlatformData(platform);
			var platformProjectService = platformData.platformProjectService;

			platformProjectService.validate();

			// get path to downloaded framework package
			var frameworkDir = this.$npm.downloadNpmPackage(this.$platformsData.getPlatformData(platform).frameworkPackageName,
				path.join(this.$projectData.platformsDir, platform)).wait();
			frameworkDir = path.join(frameworkDir, PlatformProjectService.PROJECT_FRAMEWORK_DIR);

			platformProjectService.checkRequirements().wait();

			// Log the values for project
			this.$logger.trace("Creating NativeScript project for the %s platform", platform);
			this.$logger.trace("Path: %s", platformData.projectRoot);
			this.$logger.trace("Package: %s", this.$projectData.projectId);
			this.$logger.trace("Name: %s", this.$projectData.projectName);

			this.$logger.out("Copying template files...");
			platformProjectService.createProject(platformData.projectRoot, frameworkDir).wait();

			// Need to remove unneeded node_modules folder
			this.$fs.deleteDirectory(path.join(this.$projectData.platformsDir, platform, "node_modules")).wait();

			platformProjectService.interpolateData(platformData.projectRoot);
			platformProjectService.executePlatformSpecificAction(platformData.projectRoot, frameworkDir);

			this.$logger.out("Project successfully created.");

		}).future<void>()();
	}

	public prepareProject(normalizedPlatformName: string, platforms: string[]): IFuture<void> {
		return (() => {
			var platform = normalizedPlatformName.toLowerCase();
			var assetsDirectoryPath = path.join(this.$projectData.platformsDir, platform, "assets");
			var appResourcesDirectoryPath = path.join(assetsDirectoryPath, ProjectService.APP_FOLDER_NAME, PlatformProjectService.APP_RESOURCES_FOLDER_NAME);
			shell.cp("-r", path.join(this.$projectData.projectDir, ProjectService.APP_FOLDER_NAME), assetsDirectoryPath);

			if(this.$fs.exists(appResourcesDirectoryPath).wait()) {
				shell.cp("-r", path.join(appResourcesDirectoryPath, normalizedPlatformName, "*"), path.join(this.$projectData.platformsDir, platform, "res"));
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			var files = helpers.enumerateFilesInDirectorySync(path.join(assetsDirectoryPath, ProjectService.APP_FOLDER_NAME));
			var platformsAsString = platforms.join("|");

			_.each(files, fileName => {
				var platformInfo = PlatformProjectService.parsePlatformSpecificFileName(path.basename(fileName), platformsAsString);
				var shouldExcludeFile = platformInfo && platformInfo.platform !== platform;
				if(shouldExcludeFile) {
					this.$fs.deleteFile(fileName).wait();
				} else if(platformInfo && platformInfo.onDeviceName) {
					this.$fs.rename(fileName, path.join(path.dirname(fileName), platformInfo.onDeviceName)).wait();
				}
			});

		}).future<void>()();
	}

	private static parsePlatformSpecificFileName(fileName: string, platforms: string): any {
		var regex = util.format("^(.+?)\.(%s)(\..+?)$", platforms);
		var parsed = fileName.toLowerCase().match(new RegExp(regex, "i"));
		if (parsed) {
			return {
				platform: parsed[2],
				onDeviceName: parsed[1] + parsed[3]
			};
		}
		return undefined;
	}

	public buildProject(platform: string): IFuture<void> {
		return (() => {
			this.executePlatformSpecificAction(platform, "buildProject").wait();
		}).future<void>()();
	}

	private executePlatformSpecificAction(platform, functionName: string): IFuture<void> {
		return (() => {
			var platformProjectService = null;


			this.executeFunctionByName(functionName, platformProjectService).wait();
		}).future<void>()();
	}

	private executeFunctionByName(functionName, context): IFuture<any> {
		return (() => {
			var namespaces = functionName.split(".");
			var func = namespaces.pop();
			for (var i = 0; i < namespaces.length; i++) {
				context = context[namespaces[i]];
			}
			return context[func].apply(context).wait();
		}).future<any>()();
	}
}
$injector.register("platformProjectService", PlatformProjectService);

class AndroidProjectService implements IPlatformSpecificProjectService {
	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData,
		private $propertiesParser: IPropertiesParser) { }

	public validate(): void {
		this.validatePackageName(this.$projectData.projectId);
		this.validateProjectName(this.$projectData.projectName);
	}

	public checkRequirements(): IFuture<void> {
		return (() => {
			this.checkAnt().wait() && this.checkAndroid().wait() && this.checkJava().wait();
		}).future<void>()();
	}

	public createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return (() => {
			var packageName = this.$projectData.projectId;
			var packageAsPath = packageName.replace(/\./g, path.sep);

			var validTarget = this.getTarget(frameworkDir).wait();
			var output = this.$childProcess.exec('android list targets').wait();
			if (!output.match(validTarget)) {
				this.$errors.fail("Please install Android target %s the Android newest SDK). Make sure you have the latest Android tools installed as well. Run \"android\" from your command-line to install/update any missing SDKs or tools.",
					validTarget.split('-')[1]);
			}

			shell.cp("-r", path.join(frameworkDir, "assets"), projectRoot);
			shell.cp("-r", path.join(frameworkDir, "gen"), projectRoot);
			shell.cp("-r", path.join(frameworkDir, "libs"), projectRoot);
			shell.cp("-r", path.join(frameworkDir, "res"), projectRoot);

			shell.cp("-f", path.join(frameworkDir, ".project"), projectRoot);
			shell.cp("-f", path.join(frameworkDir, "AndroidManifest.xml"), projectRoot);

			// Create src folder
			var activityDir = path.join(projectRoot, 'src', packageAsPath);
			this.$fs.createDirectory(activityDir).wait();

		}).future<any>()();
	}

	public interpolateData(projectRoot: string): void {
		// Interpolate the activity name and package
		var stringsFilePath = path.join(projectRoot, 'res', 'values', 'strings.xml');
		shell.sed('-i', /__NAME__/, this.$projectData.projectName, stringsFilePath);
		shell.sed('-i', /__TITLE_ACTIVITY__/, this.$projectData.projectName, stringsFilePath);
		shell.sed('-i', /__NAME__/, this.$projectData.projectName, path.join(projectRoot, '.project'));
		shell.sed('-i', /__PACKAGE__/, this.$projectData.projectId, path.join(projectRoot, "AndroidManifest.xml"));
	}

	public executePlatformSpecificAction(projectRoot: string, frameworkDir: string) {
		var targetApi = this.getTarget(frameworkDir).wait();
		this.$logger.trace("Android target: %s", targetApi);
		this.runAndroidUpdate(projectRoot, targetApi).wait();
	}

	public buildProject(): IFuture<void> {
		return (() => {
			var projectRoot = path.join(this.$projectData.platformsDir, "android");
			var buildConfiguration = options.release || "--debug";
			var args = this.getAntArgs(buildConfiguration, projectRoot);

			switch(buildConfiguration) {
				case "--debug":
					args[0] = "debug";
					break;
				case "--release":
					args[0] = "release";
					break;
				default:
					this.$errors.fail("Build option %s not recognized", buildConfiguration);
			}

			this.spawn('ant', args);

		}).future<void>()();
	}

	private spawn(command: string, args: string[], options?: any): void {
		if(helpers.isWindows()) {
			args.unshift('/s', '/c', command);
			command = 'cmd';
		}

		this.$childProcess.spawn(command, args, {cwd: options, stdio: 'inherit'});
	}

	private getAntArgs(configuration: string, projectRoot: string): string[] {
		var args = [configuration, "-f", path.join(projectRoot, "build.xml")];
		return args;
	}

	private runAndroidUpdate(projectPath: string, targetApi: string): IFuture<void> {
		return (() => {
			this.$childProcess.exec("android update project --subprojects --path " + projectPath + " --target " +  targetApi).wait();
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

	private getTarget(frameworkDir: string): IFuture<string> {
		return (() => {
			var projectPropertiesFilePath = path.join(frameworkDir, "project.properties");

			if (this.$fs.exists(projectPropertiesFilePath).wait()) {
				var properties = this.$propertiesParser.createEditor(projectPropertiesFilePath).wait();
				return properties.get("target");
			}

			return "";
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
 }
$injector.register("androidProjectService", AndroidProjectService);

class IOSProjectService implements  IPlatformSpecificProjectService {
	public validate(): void {

	}

	public checkRequirements(): IFuture<void> {
		return (() => {
		}).future<void>()();
	}

	public interpolateData(): void {

	}

	public executePlatformSpecificAction(): void {

	}

	public createProject(): IFuture<void> {
		return (() => {

		}).future<any>()();
	}

	public buildProject(): IFuture<void> {
		return (() => {

		}).future<void>()();
	}
}
$injector.register("iOSProjectService", IOSProjectService);
