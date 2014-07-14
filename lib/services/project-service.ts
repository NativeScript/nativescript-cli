///<reference path="../.d.ts"/>

import path = require("path");
import options = require("./../options");
import shell = require("shelljs");
import osenv = require("osenv");

export class ProjectService implements IProjectService {
	private static DEFAULT_PROJECT_ID = "com.telerik.tns.HelloWorld";
	private static DEFAULT_PROJECT_NAME = "HelloNativescript";
	private static APP_FOLDER_NAME = "app";
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
			switch (platform) {
				case "android":
					// TODO: set default values for project name and project id
					this.$androidProjectService.createProject(this.projectData).wait();
					break;
				case "ios":
					this.$iOSProjectService.createProject(this.projectData).wait();
					break;
			}
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
			var safeActivityName = projectData.projectName.replace(/\W/g, '');
			var packageName = projectData.projectId;
			var packageAsPath = packageName.replace(/\./g, path.sep);

			var targetApi = this.getTargetApi();
			var manifestFile = path.join(this.frameworkDir, "AndroidManifest.xml");

			this.validatePackageName(packageName);
			this.validateProjectName(projectData.projectName);

		}).future<any>()();
	}

	private validatePackageName(packageName: string): boolean {
		//Make the package conform to Java package types
		//Enforce underscore limitation
		if (!/^[a-zA-Z]+(\.[a-zA-Z0-9][a-zA-Z0-9_]*)+$/.test(packageName)) {
			this.$errors.fail("Package name must look like: com.company.Name");
		}

		//Class is a reserved word
		if(/\b[Cc]lass\b/.test(packageName)) {
			this.$errors.fail("class is a reserved word");
		}

		return true;
	}

	private validateProjectName(projectName: string): boolean {
		if (projectName === '') {
			this.$errors.fail("Project name cannot be empty");
		}

		//Classes in Java don't begin with numbers
		if (/^[0-9]/.test(projectName)) {
			this.$errors.fail("Project name must not begin with a number");
		}

		return true;
	}

	private get frameworkDir(): string {
		// This should be downloaded as npm package
		return path.join(__dirname, "../../framework", "android");
	}

	private getTargetApi(): string {
		var projectPropertiesFilePath = path.join(this.frameworkDir, "project.properties");
		if(this.$fs.exists(projectPropertiesFilePath).wait()) {
			var target = shell.grep(/target=android-[\d+]/, projectPropertiesFilePath);
			return target.split('=')[1].replace('\n', '').replace('\r', '').replace(' ', ''); // Target should be in following format: target=android-XX
		}

		return "";
	}

	private checkAnt(): IFuture<boolean> {
		return (() => {
			return true;
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