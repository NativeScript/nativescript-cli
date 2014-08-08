///<reference path="../.d.ts"/>
import path = require("path");
import shell = require("shelljs");
import util = require("util");
import options = require("./../options");
import helpers = require("./../common/helpers");
import constants = require("./../constants");

class AndroidProjectService implements IPlatformProjectService {
	private targetApi: string;

	constructor(private $fs: IFileSystem,
				private $errors: IErrors,
				private $logger: ILogger,
				private $childProcess: IChildProcess,
				private $projectData: IProjectData,
				private $propertiesParser: IPropertiesParser) { }

	public get platformData(): IPlatformData {
		return {
			frameworkPackageName: "tns-android",
			normalizedPlatformName: "Android",
			platformProjectService: this,
			projectRoot: path.join(this.$projectData.platformsDir, "android")
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
			this.validateAndroidTarget(frameworkDir); // We need framework to be installed to validate android target so we can't call this method in validate()

			var paths = "assets gen libs res".split(' ').map(p => path.join(frameworkDir, p));
			shell.cp("-r", paths, projectRoot);

			paths = ".project AndroidManifest.xml project.properties".split(' ').map(p => path.join(frameworkDir, p));
			shell.cp("-f", paths, projectRoot);

			// Create src folder
			var packageName = this.$projectData.projectId;
			var packageAsPath = packageName.replace(/\./g, path.sep);
			var activityDir = path.join(projectRoot, 'src', packageAsPath);
			this.$fs.createDirectory(activityDir).wait();

		}).future<any>()();
	}

	public interpolateData(projectRoot: string): IFuture<void> {
		return (() => {
			// Interpolate the activity name and package
			var manifestPath = path.join(projectRoot, "AndroidManifest.xml");
			var safeActivityName = this.$projectData.projectName.replace(/\W/g, '');
			shell.sed('-i', /__PACKAGE__/, this.$projectData.projectId, manifestPath);
			shell.sed('-i', /__ACTIVITY__/, safeActivityName, manifestPath);
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

			shell.cp("-r", appSourceDirectory, assetsDirectory);

			var appResourcesDirectoryPath = path.join(assetsDirectory, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME);
			if (this.$fs.exists(appResourcesDirectoryPath).wait()) {
				shell.cp("-r", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), resDirectory);
				this.$fs.deleteDirectory(appResourcesDirectoryPath).wait();
			}

			return path.join(assetsDirectory, constants.APP_FOLDER_NAME);

		}).future<string>()();
	}

	public buildProject(projectRoot: string): IFuture<void> {
		return (() => {
			var buildConfiguration = options.release ? "release" : "debug";
			var args = this.getAntArgs(buildConfiguration, projectRoot);
			this.spawn('ant', args).wait();
		}).future<void>()();
	}

	private spawn(command: string, args: string[]): IFuture<void> {
		if (helpers.isWindows()) {
			args.unshift('/s', '/c', command);
			command = 'cmd';
		}

		var child = this.$childProcess.spawn(command, args, {stdio: "inherit"});
		return this.$fs.futureFromEvent(child, "close");
	}

	private getAntArgs(configuration: string, projectRoot: string): string[] {
		var args = [configuration, "-f", path.join(projectRoot, "build.xml")];
		return args;
	}

	private runAndroidUpdate(projectPath: string, targetApi: string): IFuture<void> {
		return (() => {
			var args = [
				"--path", projectPath,
				"--target", targetApi
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

	private validateAndroidTarget(frameworkDir: string) {
		var validTarget = this.getTarget(frameworkDir).wait();
		var output = this.$childProcess.exec('android list targets').wait();
		if (!output.match(validTarget)) {
			this.$errors.fail("Please install Android target %s the Android newest SDK). Make sure you have the latest Android tools installed as well. Run \"android\" from your command-line to install/update any missing SDKs or tools.",
				validTarget.split('-')[1]);
		}
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
}
$injector.register("androidProjectService", AndroidProjectService);