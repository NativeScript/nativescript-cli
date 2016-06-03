import * as constants from "./constants";
import * as path from "path";
import {EOL} from "os";

export class ProjectData implements IProjectData {
	private static OLD_PROJECT_FILE_NAME = ".tnsproject";

	public projectDir: string;
	public platformsDir: string;
	public projectFilePath: string;
	public projectId: string;
	public projectName: string;
	public appDirectoryPath: string;
	public appResourcesDirectoryPath: string;
	public dependencies: any;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig,
		private $options: IOptions) {
		this.initializeProjectData().wait();
	}

	private initializeProjectData(): IFuture<void> {
		return(() => {
			let projectDir = this.$projectHelper.projectDir;
			// If no project found, projectDir should be null
			if(projectDir) {
				this.initializeProjectDataCore(projectDir);
				let data: any = null;

				if (this.$fs.exists(this.projectFilePath).wait()) {
					let fileContent: any = null;
					try {
						fileContent = this.$fs.readJson(this.projectFilePath).wait();
						data = fileContent[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE];
					} catch (err) {
						this.$errors.fail({formatStr: "The project file %s is corrupted." + EOL +
							"Consider restoring an earlier version from your source control or backup." + EOL +
							"Additional technical info: %s",
								suppressCommandHelp: true},
							this.projectFilePath, err.toString());
					}

					if(data) {
						this.projectId = data.id;
						this.dependencies = fileContent.dependencies;
					} else { // This is the case when we have package.json file but nativescipt key is not presented in it
						this.tryToUpgradeProject().wait();
					}
				}
			} else { // This is the case when no project file found
				this.tryToUpgradeProject().wait();
			}
		}).future<void>()();
	}

	private throwNoProjectFoundError(): void {
		this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", this.$options.path || path.resolve("."));
	}

	private tryToUpgradeProject(): IFuture<void> {
		return (() => {
			let projectDir = this.projectDir || path.resolve(this.$options.path || ".");
			let oldProjectFilePath = path.join(projectDir, ProjectData.OLD_PROJECT_FILE_NAME);
			if(this.$fs.exists(oldProjectFilePath).wait()) {
				this.upgrade(projectDir, oldProjectFilePath).wait();
			} else {
				this.throwNoProjectFoundError();
			}
		}).future<void>()();
	}

	private upgrade(projectDir: string, oldProjectFilePath: string): IFuture<void> {
		return (() => {
			try {
				let oldProjectData = this.$fs.readJson(oldProjectFilePath).wait();

				let newProjectFilePath = this.projectFilePath || path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
				let newProjectData = this.$fs.exists(newProjectFilePath).wait() ? this.$fs.readJson(newProjectFilePath).wait() : {};
				newProjectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE] = oldProjectData;
				this.$fs.writeJson(newProjectFilePath, newProjectData).wait();
				this.projectId = newProjectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE].id;

				this.$fs.deleteFile(oldProjectFilePath).wait();
			} catch(err) {
				this.$logger.out("An error occurred while upgrading your project.");
				throw err;
			}

			this.initializeProjectDataCore(projectDir);

			this.$logger.out("Successfully upgraded your project file.");
		}).future<void>()();
	}

	private initializeProjectDataCore(projectDir: string): void {
		this.projectDir = projectDir;
		this.projectName = this.$projectHelper.sanitizeName(path.basename(projectDir));
		this.platformsDir = path.join(projectDir, "platforms");
		this.projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
		this.appDirectoryPath = path.join(projectDir, constants.APP_FOLDER_NAME);
		this.appResourcesDirectoryPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME);
	}
}
$injector.register("projectData", ProjectData);
