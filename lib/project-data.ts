import * as constants from "./constants";
import * as path from "path";
import { EOL } from "os";

interface IProjectType {
	type: string;
	requiredDependencies?: string[];
	isDefaultProjectType?: boolean;
}

export class ProjectData implements IProjectData {
	private static OLD_PROJECT_FILE_NAME = ".tnsproject";

	/**
	 * NOTE: Order of the elements is important as the TypeScript dependencies are commonly included in Angular project as well.
	 */
	private static PROJECT_TYPES: IProjectType[] = [
		{
			type: "Pure JavaScript",
			isDefaultProjectType: true
		},
		{
			type: "Angular",
			requiredDependencies: ["@angular/core", "nativescript-angular"]
		},
		{
			type: "Pure TypeScript",
			requiredDependencies: ["typescript", "nativescript-dev-typescript"]
		}
	];

	public projectDir: string;
	public platformsDir: string;
	public projectFilePath: string;
	public projectId: string;
	public projectName: string;
	public appDirectoryPath: string;
	public appResourcesDirectoryPath: string;
	public dependencies: any;
	public devDependencies: IStringDictionary;
	public projectType: string;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig,
		private $options: IOptions) {
		this.initializeProjectData();
	}

	private initializeProjectData(): void {
		let projectDir = this.$projectHelper.projectDir;
		// If no project found, projectDir should be null
		if (projectDir) {
			this.initializeProjectDataCore(projectDir);
			let data: any = null;

			if (this.$fs.exists(this.projectFilePath)) {
				let fileContent: any = null;
				try {
					fileContent = this.$fs.readJson(this.projectFilePath);
					data = fileContent[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE];
				} catch (err) {
					this.$errors.fail({
						formatStr: "The project file %s is corrupted." + EOL +
						"Consider restoring an earlier version from your source control or backup." + EOL +
						"Additional technical info: %s",
						suppressCommandHelp: true
					},
						this.projectFilePath, err.toString());
				}

				if (data) {
					this.projectId = data.id;
					this.dependencies = fileContent.dependencies;
					this.devDependencies = fileContent.devDependencies;
					this.projectType = this.getProjectType();
				} else { // This is the case when we have package.json file but nativescipt key is not presented in it
					this.tryToUpgradeProject();
				}
			}
		} else { // This is the case when no project file found
			this.tryToUpgradeProject();
		}
	}

	private getProjectType(): string {
		let detectedProjectType = _.find(ProjectData.PROJECT_TYPES, (projectType) => projectType.isDefaultProjectType).type;

		const deps: string[] = _.keys(this.dependencies).concat(_.keys(this.devDependencies));

		_.each(ProjectData.PROJECT_TYPES, projectType => {
			if (_.some(projectType.requiredDependencies, requiredDependency => deps.indexOf(requiredDependency) !== -1)) {
				detectedProjectType = projectType.type;
				return false;
			}
		});

		return detectedProjectType;
	}

	private throwNoProjectFoundError(): void {
		this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", this.$options.path || path.resolve("."));
	}

	private tryToUpgradeProject(): void {
		let projectDir = this.projectDir || path.resolve(this.$options.path || ".");
		let oldProjectFilePath = path.join(projectDir, ProjectData.OLD_PROJECT_FILE_NAME);
		if (this.$fs.exists(oldProjectFilePath)) {
			this.upgrade(projectDir, oldProjectFilePath);
		} else {
			this.throwNoProjectFoundError();
		}
	}

	private upgrade(projectDir: string, oldProjectFilePath: string): void {
		try {
			let oldProjectData = this.$fs.readJson(oldProjectFilePath);

			let newProjectFilePath = this.projectFilePath || path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
			let newProjectData = this.$fs.exists(newProjectFilePath) ? this.$fs.readJson(newProjectFilePath) : {};
			newProjectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE] = oldProjectData;
			this.$fs.writeJson(newProjectFilePath, newProjectData);
			this.projectId = newProjectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE].id;

			this.$fs.deleteFile(oldProjectFilePath);
		} catch (err) {
			this.$logger.out("An error occurred while upgrading your project.");
			throw err;
		}

		this.initializeProjectDataCore(projectDir);

		this.$logger.out("Successfully upgraded your project file.");
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
