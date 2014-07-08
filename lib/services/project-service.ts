///<reference path="../.d.ts"/>

import path = require("path");
import options = require("./../options");
import shell = require("shelljs");

export class ProjectService implements IProjectService {
	private static DEFAULT_ID = "com.telerik.tns.Cuteness";
	private static DEFAULT_NAME = "HelloNativescript";
	private static APP_FOLDER_NAME = "app";

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $projectTemplatesService: IProjectTemplatesService) { }

	public createProject(projectName: string, projectId: string): IFuture<void> {
		return(() => {
			var projectDir = path.resolve(options.path || ".");

			projectId = projectId || ProjectService.DEFAULT_ID;
			projectName = projectName || ProjectService.DEFAULT_NAME;

			projectDir = path.join(projectDir, projectName);
			this.$fs.createDirectory(projectDir).wait();

			var customAppPath = this.getCustomAppPath();
			if(customAppPath) {
				customAppPath = path.resolve(customAppPath);
			}

			if(this.$fs.exists(projectDir).wait() && !this.isEmptyDir(projectDir).wait()) {
				this.$errors.fail("Path already exists and is not empty %s", projectDir);
			}

			this.$logger.trace("Creating a new NativeScript project with name %s and id at location", projectName, projectId, projectDir);

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
				// No custom app - use Cuteness application
				this.$logger.trace("Using NativeScript Cuteness application");
				var defaultTemplatePath = this.$projectTemplatesService.defaultTemplatePath.wait();
				this.$logger.trace("Copying Cuteness application into %s", appDirectory);
				appPath = defaultTemplatePath;
			}

			this.createProjectCore(projectDir, appPath, false).wait();
		}).future<void>()();
	}

	private createProjectCore(projectDir: string, appPath: string, symlink?: boolean): IFuture<void> {
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
			this.createBasicProjectStructure(projectDir).wait();
		}).future<void>()();
	}

	private createBasicProjectStructure(projectDir: string): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(path.join(projectDir, "platforms")).wait();
			this.$fs.createDirectory(path.join(projectDir, "tns_modules")).wait();
			this.$fs.createDirectory(path.join(projectDir, "hooks")).wait();
		}).future<void>()();
	}

	private getCustomAppPath(): string {
		var customAppPath = options["copy-from"] || options["link-to"];
		if(customAppPath) {
			if(customAppPath.indexOf("http") >= 0) {
				this.$errors.fail("Only local paths for custom app are supported.");
			}

			if(customAppPath.substr(0, 1) === '~') {
				customAppPath = path.join(process.env.HOME, customAppPath.substr(1));
			}
		}

		return customAppPath;
	}

	private isEmptyDir(directoryPath: string): IFuture<boolean> {
		return(() => {
			var directoryContent = this.$fs.readDirectory(directoryPath).wait();
			return directoryContent.length === 0;
		}).future<boolean>()();
	}
}
$injector.register("projectService", ProjectService);