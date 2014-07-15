///<reference path="../.d.ts"/>

import path = require("path");
import options = require("./../options");
import shell = require("shelljs");
import osenv = require("osenv");

export class ProjectService implements IProjectService {
	private static DEFAULT_PROJECT_ID = "com.telerik.tns.HelloWorld";
	private static DEFAULT_PROJECT_NAME = "HelloNativescript";
	public static APP_FOLDER_NAME = "app";
	private static PROJECT_FRAMEWORK_DIR = "framework";

	private cachedProjectDir: string = "";
	public projectData: IProjectData = null;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $projectTemplatesService: IProjectTemplatesService,
		private $androidProjectService: IAndroidProjectService,
		private $iOSProjectService: IiOSProjectService,
		private $config) {
		this.projectData = this.getProjectData().wait();
	}

	private get projectDir(): string {
		if(this.cachedProjectDir !== "") {
			return this.cachedProjectDir;
		}

		var projectDir = path.resolve(options.path || ".");
		while (true) {
			this.$logger.trace("Looking for project in '%s'", projectDir);

			if (this.$fs.exists(path.join(projectDir, this.$config.PROJECT_FILE_NAME)).wait()) {
				this.$logger.debug("Project directory is '%s'.", projectDir);
				this.cachedProjectDir = projectDir;
				break;
			}

			var dir = path.dirname(projectDir);
			if (dir === projectDir) {
				this.$logger.debug("No project found at or above '%s'.", path.resolve("."));
				break;
			}
			projectDir = dir;
		}

		return this.cachedProjectDir;
	}

	private getProjectData(): IFuture<IProjectData> {
		return(() => {
			var projectFilePath = path.join(this.projectDir, this.$config.PROJECT_FILE_NAME);
			var projectData:IProjectData = {
				projectDir: this.projectDir,
				platformsDir: path.join(this.projectDir, "platforms"),
				projectFilePath: path.join(this.projectDir, this.$config.PROJECT_FILE_NAME)
			};

			if (this.$fs.exists(projectFilePath).wait()) {
				var fileContent = this.$fs.readJson(projectFilePath).wait();
				projectData.projectId = fileContent.id;
				projectData.projectName = path.basename(this.projectDir);
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

	public prepareProject(platform: string): IFuture<void> {
		return (() => {
			this.executePlatformSpecificAction(platform, "prepareProject").wait();
		}).future<void>()();
	}

	public buildProject(platform: string): IFuture<void> {
		return (() => {
			this.executePlatformSpecificAction(platform, "buildProject").wait();
		}).future<void>()();
	}

	private executePlatformSpecificAction(platform, functionName: string): IFuture<void> {
		return (() => {
			switch (platform) {
				case "android":
					this.executeFunctionByName(functionName, this.$androidProjectService, [this.projectData]).wait();
					break;
				case "ios":
					this.executeFunctionByName(functionName, this.$iOSProjectService, [this.projectData]).wait();
					break;
			}
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

class AndroidProjectService implements IAndroidProjectService {
	constructor(private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger) { }

	public createProject(projectData: IProjectData): IFuture<void> {
		return (() => {
			var packageName = projectData.projectId;
			var projectDir = path.join(projectData.projectDir, "platforms", "android");

			var targetApi = this.getTarget();

			this.validatePackageName(packageName);
			this.validateProjectName(projectData.projectName);

			this.checkRequirements().wait();

			// Log the values for project
			this.$logger.trace("Creating NativeScript project for the Android platform");
			this.$logger.trace("Path: %s", projectData.projectDir);
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

			// Interpolate the activity name and package
			shell.sed('-i', /__NAME__/, projectData.projectName, path.join(projectDir, 'res', 'values', 'strings.xml'));
			shell.sed('-i', /__TITLE_ACTIVITY__/, projectData.projectName, path.join(projectDir, 'res', 'values', 'strings.xml'));
			shell.sed('-i', /__NAME__/, projectData.projectName, path.join(projectDir, '.project'));
			shell.sed('-i', /__PACKAGE__/, packageName, path.join(projectDir, "AndroidManifest.xml"));

			this.runAndroidUpdate(projectDir, targetApi).wait();

			this.$logger.out("Project successfully created.");

		}).future<any>()();
	}

	public prepareProject(projectData: IProjectData): IFuture<void> {
		return (() => {
			var projectDir = path.join(projectData.projectDir, "platforms", "android");
			// Copy app into assets
			shell.cp("-r", path.join(projectData.projectDir, ProjectService.APP_FOLDER_NAME), path.join(projectDir, "assets"));
		}).future<void>()();
	}

	private runAndroidUpdate(projectPath: string, targetApi): IFuture<void> {
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

	private get frameworkDir(): string {
		// This should be downloaded as npm package
		return path.join(__dirname, "../../framework", "android");
	}

	private getTarget(): string {
		var projectPropertiesFilePath = path.join(this.frameworkDir, "project.properties");
		if(this.$fs.exists(projectPropertiesFilePath).wait()) {
			var target = shell.grep(/target=android-[\d+]/, projectPropertiesFilePath);
			return target.split('=')[1].replace('\n', '').replace('\r', '').replace(' ', ''); // Target should be in following format: target=android-XX
		}

		return "";
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
			var validTarget = this.getTarget();
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

class iOSProjectService implements  IiOSProjectService {
	public createProject(projectData: IProjectData): IFuture<void> {
		return (() => {

		}).future<any>()();
	}
}
$injector.register("iOSProjectService", iOSProjectService);