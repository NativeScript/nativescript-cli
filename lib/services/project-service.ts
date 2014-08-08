///<reference path="../.d.ts"/>

import options = require("./../options");
import osenv = require("osenv");
import path = require("path");
import shell = require("shelljs");
import util = require("util");
import constants = require("./../constants");
import helpers = require("./../common/helpers");

class ProjectData implements IProjectData {
	public projectDir: string;
	public platformsDir: string;
	public projectFilePath: string;
	public projectId: string;
	public projectName: string;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig) {
		this.initializeProjectData().wait();
	}

	private initializeProjectData(): IFuture<void> {
		return(() => {
			var projectDir = this.$projectHelper.projectDir;
			// If no project found, projectDir should be null
			if(projectDir) {
				this.projectDir = projectDir;
				this.projectName = path.basename(projectDir);
				this.platformsDir = path.join(projectDir, "platforms");
				this.projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);

				if (this.$fs.exists(this.projectFilePath).wait()) {
					var fileContent = this.$fs.readJson(this.projectFilePath).wait();
					this.projectId = fileContent.id;
				}
			} else {
				this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", process.cwd());
			}
		}).future<void>()();
	}
}
$injector.register("projectData", ProjectData);

export class ProjectService implements IProjectService {
	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $projectTemplatesService: IProjectTemplatesService,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig) { }

	public createProject(projectName: string, projectId: string): IFuture<void> {
		return(() => {
			var projectDir = path.resolve(options.path || ".");

			projectName = projectName || constants.DEFAULT_PROJECT_NAME;
			projectId =  options.appid || this.$projectHelper.generateDefaultAppId(projectName);

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

			var appDirectory = path.join(projectDir, constants.APP_FOLDER_NAME);
			var appPath: string = null;

			if(customAppPath) {
				this.$logger.trace("Using custom app from %s", customAppPath);

				// Make sure that the source app/ is not a direct ancestor of a target app/
				var relativePathFromSourceToTarget = path.relative(customAppPath, appDirectory);
				// path.relative returns second argument if the paths are located on different disks
				// so in this case we don't need to make the check for direct ancestor
				if(relativePathFromSourceToTarget !== appDirectory) {
					var doesRelativePathGoUpAtLeastOneDir = relativePathFromSourceToTarget.split(path.sep)[0] === "..";
					if (!doesRelativePathGoUpAtLeastOneDir) {
						this.$errors.fail("Project dir %s must not be created at/inside the template used to create the project %s.", projectDir, customAppPath);
					}
				}
				this.$logger.trace("Copying custom app into %s", appDirectory);
				appPath = customAppPath;
			} else {
				// No custom app - use nativescript hello world application
				this.$logger.trace("Using NativeScript hello world application");
				var defaultTemplatePath = this.$projectTemplatesService.defaultTemplatePath.wait();
				this.$logger.trace("Copying NativeScript hello world application into %s", appDirectory);
				appPath = defaultTemplatePath;
			}

			this.createProjectCore(projectDir, appPath,  projectId, false).wait();

			this.$logger.out("Project %s was successfully created", projectName);
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
				var appDir = path.join(projectDir, constants.APP_FOLDER_NAME);
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
			this.$fs.writeFile(path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME), JSON.stringify(projectData)).wait();
		}).future<void>()();
	}

	private getCustomAppPath(): string {
		var customAppPath = options["copy-from"] || options["link-to"];
		if(customAppPath) {
			if(customAppPath.indexOf("http://") === 0) {
				this.$errors.fail("Only local paths for custom app are supported.");
			}

			if(customAppPath.substr(0, 1) === '~') {
				customAppPath = path.join(osenv.home(), customAppPath.substr(1));
			}
		}

		return customAppPath;
	}
}
$injector.register("projectService", ProjectService);

