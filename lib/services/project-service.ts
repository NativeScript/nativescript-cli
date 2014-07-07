///<reference path="../.d.ts"/>

import path = require("path");
import options = require("./../options");

export class ProjectService implements IProjectService {
	private static DEFAULT_ID = "com.telerik.tns.Cuteness";
	private static DEFAULT_NAME = "Cuteness";

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $cutenessService: ICutenessService) { }

	public createProject(projectDir: string, projectId: string, projectName: string, projectConfig?: IProjectConfig): IFuture<void> {
		return(() => {
			if(!projectDir) {
				this.$errors.fail("At least the project directory must be provided to create new project");
			}

			projectDir = projectDir || path.resolve(options.path || ".");

			projectId = projectId || ProjectService.DEFAULT_ID;
			projectName = projectName || ProjectService.DEFAULT_NAME;
			projectConfig = projectConfig;

			var customAppPath = this.getCustomAppPath();
			if(customAppPath) {
				projectConfig.customAppPath = path.resolve(customAppPath);
			}

			if(this.$fs.exists(projectDir).wait() && !this.isEmptyDir(projectDir).wait()) {
				this.$errors.fail("Path already exists and is not empty %s", projectDir);
			}

			this.$logger.trace("Creating a new NativeScript project with name %s and id at location", projectName, projectId, projectDir);

			if(projectConfig.customAppPath) {
				// TODO:
			} else {
				// No custom app - use Cuteness application
				this.$logger.trace("Using NativeScript Cuteness application");
				var cutenessAppPath = this.$cutenessService.cutenessAppPath.wait();
			}
		}).future<void>()();
	}

	private getCustomAppPath(): string {
		var customAppPath = options["copy-from"] || options["link-to"];
		if(customAppPath) {
			if(customAppPath.indexOf("http") >= 0) {
				this.$errors.fail("Only local paths for custom app assets are supported.");
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