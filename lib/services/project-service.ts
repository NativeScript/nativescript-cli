///<reference path="../.d.ts"/>

import path = require("path");
import options = require("./../options");
import shell = require("shelljs");
import osenv = require("osenv");
import util = require("util");
import helpers = require("./../common/helpers");

export class ProjectService implements IProjectService {
	private static DEFAULT_PROJECT_ID = "com.telerik.tns.HelloWorld";
	private static DEFAULT_PROJECT_NAME = "HelloNativescript";
	public static APP_FOLDER_NAME = "app";
	private static APP_RESOURCES_FOLDER_NAME = "App_Resources";
	public static PROJECT_FRAMEWORK_DIR = "framework";

	public projectData: IProjectData = null;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $projectTemplatesService: IProjectTemplatesService,
		private $androidProjectService: IPlatformProjectService,
		private $iOSProjectService: IPlatformProjectService,
		private $projectHelper: IProjectHelper,
		private $config) {
		this.projectData = this.getProjectData().wait();
	}

	private getProjectData(): IFuture<IProjectData> {
		return(() => {
			var projectData: IProjectData = null;
			var projectDir = this.$projectHelper.projectDir;

			if(projectDir) {
				projectData = {
					projectDir: projectDir,
					platformsDir: path.join(projectDir, "platforms"),
					projectFilePath: path.join(projectDir, this.$config.PROJECT_FILE_NAME)
				};
				var projectFilePath = path.join(projectDir, this.$config.PROJECT_FILE_NAME);

				if (this.$fs.exists(projectFilePath).wait()) {
					var fileContent = this.$fs.readJson(projectFilePath).wait();
					projectData.projectId = fileContent.id;
					projectData.projectName = path.basename(projectDir);
				}
			}

			return projectData;
		}).future<IProjectData>()();
	}

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

	public createPlatformSpecificProject(platform: string): IFuture<void> {
		return(() => {
			this.executePlatformSpecificAction(platform, "createProject").wait();
		}).future<void>()();
	}

	public prepareProject(normalizedPlatformName: string, platforms: string[]): IFuture<void> {
		return (() => {
			var platform = normalizedPlatformName.toLowerCase();
			var assetsDirectoryPath = path.join(this.projectData.platformsDir, platform, "assets");
			var appResourcesDirectoryPath = path.join(assetsDirectoryPath, ProjectService.APP_FOLDER_NAME, ProjectService.APP_RESOURCES_FOLDER_NAME);
			shell.cp("-r", path.join(this.projectData.projectDir, ProjectService.APP_FOLDER_NAME), assetsDirectoryPath);

			if(this.$fs.exists(appResourcesDirectoryPath).wait()) {
				shell.cp("-r", path.join(appResourcesDirectoryPath, normalizedPlatformName, "*"), path.join(this.projectData.platformsDir, platform, "res"));
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			var files = helpers.enumerateFilesInDirectorySync(path.join(assetsDirectoryPath, ProjectService.APP_FOLDER_NAME));
			var platformsAsString = platforms.join("|");

			_.each(files, fileName => {
				var platformInfo = ProjectService.parsePlatformSpecificFileName(path.basename(fileName), platformsAsString);
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
			switch (platform) {
				case "android":
					platformProjectService = this.$androidProjectService;
					break;
				case "ios":
					platformProjectService = this.$iOSProjectService;
					break;
			}

			this.executeFunctionByName(functionName, platformProjectService, [this.projectData]).wait();
		}).future<void>()();
	}

	private executeFunctionByName(functionName, context , args: any[] ): IFuture<any> {
		return (() => {
			var namespaces = functionName.split(".");
			var func = namespaces.pop();
			for (var i = 0; i < namespaces.length; i++) {
				context = context[namespaces[i]];
			}
			return context[func].apply(context, args).wait();
		}).future<any>()();
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
		if (this.projectData.projectDir === "" || !this.$fs.exists(this.projectData.projectFilePath).wait()) {
			this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
		}
	}
}
$injector.register("projectService", ProjectService);

class AndroidProjectService implements IPlatformProjectService {
	private frameworkDir: string = null;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $projectTemplatesService: IProjectTemplatesService,
		private $propertiesParser: IPropertiesParser) { }

	public createProject(projectData: IProjectData): IFuture<void> {
		return (() => {
			this.frameworkDir = this.getFrameworkDir(projectData).wait();

			var packageName = projectData.projectId;
			var packageAsPath = packageName.replace(/\./g, path.sep);
			var projectDir = path.join(projectData.projectDir, "platforms", "android");

			this.validatePackageName(packageName);
			this.validateProjectName(projectData.projectName);

			this.checkRequirements().wait();

			var targetApi = this.getTarget().wait();

			// Log the values for project
			this.$logger.trace("Creating NativeScript project for the Android platform");
			this.$logger.trace("Path: %s", projectDir);
			this.$logger.trace("Package: %s", projectData.projectId);
			this.$logger.trace("Name: %s", projectData.projectName);
			this.$logger.trace("Android target: %s", targetApi);

			this.$logger.out("Copying template files...");

			shell.cp("-r", path.join(this.frameworkDir, "assets"), projectDir);
			shell.cp("-r", path.join(this.frameworkDir, "gen"), projectDir);
			shell.cp("-r", path.join(this.frameworkDir, "libs"), projectDir);
			shell.cp("-r", path.join(this.frameworkDir, "res"), projectDir);

			shell.cp("-f", path.join(this.frameworkDir, ".project"), projectDir);
			shell.cp("-f", path.join(this.frameworkDir, "AndroidManifest.xml"), projectDir);

			// Create src folder
			var activityDir = path.join(projectDir, 'src', packageAsPath);
			this.$fs.createDirectory(activityDir).wait();

			this.$fs.deleteDirectory(path.join(projectData.platformsDir, "android", "node_modules")).wait();

			// Interpolate the activity name and package
			var stringsFilePath = path.join(projectDir, 'res', 'values', 'strings.xml');
			shell.sed('-i', /__NAME__/, projectData.projectName, stringsFilePath);
			shell.sed('-i', /__TITLE_ACTIVITY__/, projectData.projectName, stringsFilePath);
			shell.sed('-i', /__NAME__/, projectData.projectName, path.join(projectDir, '.project'));
			shell.sed('-i', /__PACKAGE__/, packageName, path.join(projectDir, "AndroidManifest.xml"));

			this.runAndroidUpdate(projectDir, targetApi).wait();

			this.$logger.out("Project successfully created.");

		}).future<any>()();
	}

	public buildProject(projectData: IProjectData): IFuture<void> {
		return (() => {
			var projectRoot = path.join(projectData.platformsDir, "android");
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

	private getFrameworkDir(projectData: IProjectData): IFuture<string> {
		return(() => {
			var androidFrameworkPath = this.$projectTemplatesService.getAndroidFrameworkPath(path.join(projectData.platformsDir, "android")).wait();
			return path.join(androidFrameworkPath, "framework");
		}).future<string>()();
	}

	private getTarget(): IFuture<string> {
		return (() => {
			var projectPropertiesFilePath = path.join(this.frameworkDir, "project.properties");

			if (this.$fs.exists(projectPropertiesFilePath).wait()) {
				var properties = this.$propertiesParser.createEditor(projectPropertiesFilePath).wait();
				return properties.get("target");
			}

			return "";
		}).future<string>()();
	}

	private checkAnt(): IFuture<boolean> {
		return (() => {
			try {
				this.$childProcess.exec("ant -version").wait();
			} catch(error) {
				this.$errors.fail("Error executing commands 'ant', make sure you have ant installed and added to your PATH.")
			}
			return true;
		}).future<boolean>()();
	}

	private checkJava(): IFuture<boolean> {
		return (() => {
			try {
				this.$childProcess.exec("java -version").wait();
			} catch(error) {
				this.$errors.fail("%s\n Failed to run 'java', make sure your java environment is set up.\n Including JDK and JRE.\n Your JAVA_HOME variable is %s", error, process.env.JAVA_HOME);
			}
			return true;
		}).future<boolean>()();
	}

	private checkAndroid(): IFuture<boolean> {
		return (() => {
			var validTarget = this.getTarget().wait();
			try {
				var output = this.$childProcess.exec('android list targets').wait();
			} catch(error) {
				if (error.match(/command\snot\sfound/)) {
					this.$errors.fail("The command \"android\" failed. Make sure you have the latest Android SDK installed, and the \"android\" command (inside the tools/ folder) is added to your path.");
				} else {
					this.$errors.fail("An error occurred while listing Android targets");
				}
			}

			if (!output.match(validTarget)) {
				this.$errors.fail("Please install Android target %s the Android newest SDK). Make sure you have the latest Android tools installed as well. Run \"android\" from your command-line to install/update any missing SDKs or tools.",
					validTarget.split('-')[1]);
			}

			return true;
		}).future<boolean>()();
	}

	private checkRequirements(): IFuture<boolean> {
		return (() => {
			return this.checkAnt().wait() && this.checkAndroid().wait() && this.checkJava().wait();
		}).future<boolean>()();
	}
 }
$injector.register("androidProjectService", AndroidProjectService);

class iOSProjectService implements  IPlatformProjectService {
	public createProject(projectData: IProjectData): IFuture<void> {
		return (() => {

		}).future<any>()();
	}

	public buildProject(projectData: IProjectData): IFuture<void> {
		return (() => {

		}).future<void>()();
	}
}
$injector.register("iOSProjectService", iOSProjectService);