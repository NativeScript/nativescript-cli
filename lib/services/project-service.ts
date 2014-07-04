import path = require("path");
import options = require("./../options");

export class ProjectService implements IProjectService {
	private static DEFAULT_ID = "com.tns.helloNativeScript";
	private static DEFAULT_NAME = "HelloNativeScript";

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem) { }

	public createProject(projectId: string, projectName: string, projectConfig?: IProjectConfig): IFuture<void> {
		return(() => {
			var projectDir = path.resolve(options.path || ".");

			projectId = projectId || ProjectService.DEFAULT_ID;
			projectName = projectName || ProjectService.DEFAULT_NAME;
			projectConfig = projectConfig || {};

			projectConfig.customAppPath = path.resolve(this.getCustomAppPath());

			this.$logger.trace("Creating a new NativeScript project with name %s and id at location", projectName, projectId, projectDir);

			if(this.$fs.exists(projectDir).wait() && !this.isEmptyDir(projectDir)) {
				this.$errors.fail("Path already exists and is not empty %s", projectDir);
			}

			if(projectConfig.customAppPath) {

			} else {
				// No custom app - use hello-world application
				this.$logger.trace("Using NativeScript hello-world application");
			}
		}).future<void>();
	}

	private getCustomAppPath(): string {
		var customAppPath = options["copy-from"] || options["link-to"];
		if(customAppPath) {
			if(customAppPath.indexOf("http") >= 0) {
				this.$errors.fail("Only local paths for custom app assets are supported.");
			}
		}
		if(customAppPath.substr(0, 1) === '~') {
			customAppPath = path.join(process.env.HOME, customAppPath.substr(1));
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