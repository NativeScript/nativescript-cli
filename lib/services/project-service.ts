///<reference path="../.d.ts"/>
"use strict";

import constants = require("./../constants");
import helpers = require("../common/helpers");
import options = require("../common/options");
import osenv = require("osenv");
import path = require("path");
import shell = require("shelljs");
import util = require("util");

export class ProjectService implements IProjectService {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $projectHelper: IProjectHelper,
		private $projectNameValidator: IProjectNameValidator,
		private $projectTemplatesService: IProjectTemplatesService) { }

	public createProject(projectName: string): IFuture<void> {
		return(() => {
			if (!projectName) {
				this.$errors.fail("You must specify <App name> when creating a new project.");
			}
			this.$projectNameValidator.validate(projectName);

			var projectId = options.appid || this.$projectHelper.generateDefaultAppId(projectName, "org.nativescript");

			var projectDir = path.join(path.resolve(options.path || "."), projectName);
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

			if (customAppPath) {
				this.$logger.trace("Using custom app from %s", customAppPath);

				// Make sure that the source app/ is not a direct ancestor of a target app/
				var relativePathFromSourceToTarget = path.relative(customAppPath, appDirectory);
				// path.relative returns second argument if the paths are located on different disks
				// so in this case we don't need to make the check for direct ancestor
				if (relativePathFromSourceToTarget !== appDirectory) {
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

			try {
				this.createProjectCore(projectDir, appPath, projectId).wait();
			} catch (err) {
				this.$fs.deleteDirectory(projectDir).wait();
				throw err;
			}


			this.$logger.out("Project %s was successfully created", projectName);

		}).future<void>()();
	}

	private createProjectCore(projectDir: string, appSourcePath: string,  projectId: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(projectDir).wait();

			var appDestinationPath = path.join(projectDir, constants.APP_FOLDER_NAME);
			this.$fs.createDirectory(appDestinationPath).wait();

			if(options.symlink) {
				this.$fs.symlink(appSourcePath, appDestinationPath).wait();
			} else {
				shell.cp('-R', path.join(appSourcePath, "*"), appDestinationPath);
			}
			this.createBasicProjectStructure(projectDir,  projectId).wait();
		}).future<void>()();
	}

	private createBasicProjectStructure(projectDir: string,  projectId: string): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(path.join(projectDir, "platforms")).wait();

			this.$projectDataService.initialize(projectDir);
			this.$projectDataService.setValue("id", projectId).wait();
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

