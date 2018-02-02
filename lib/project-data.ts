import * as constants from "./constants";
import * as path from "path";
import { EOL } from "os";

interface IProjectType {
	type: string;
	requiredDependencies?: string[];
	isDefaultProjectType?: boolean;
}

export class ProjectData implements IProjectData {
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
	get appResourcesDirectoryPath(): string {
		return this.getAppResourcesDirectoryPath();
	}
	public dependencies: any;
	public devDependencies: IStringDictionary;
	public projectType: string;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors,
		private $projectHelper: IProjectHelper,
		private $staticConfig: IStaticConfig,
		private $options: IOptions,
		private $logger: ILogger) { }

	public initializeProjectData(projectDir?: string): void {
		projectDir = projectDir || this.$projectHelper.projectDir;
		// If no project found, projectDir should be null
		if (projectDir) {
			const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
			let data: any = null;

			if (this.$fs.exists(projectFilePath)) {
				let fileContent: any = null;
				try {
					fileContent = this.$fs.readJson(projectFilePath);
					data = fileContent[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE];
				} catch (err) {
					this.$errors.failWithoutHelp(`The project file ${this.projectFilePath} is corrupted. ${EOL}` +
						`Consider restoring an earlier version from your source control or backup.${EOL}` +
						`Additional technical info: ${err.toString()}`);
				}

				if (data) {
					this.projectDir = projectDir;
					this.projectName = this.$projectHelper.sanitizeName(path.basename(projectDir));
					this.platformsDir = path.join(projectDir, constants.PLATFORMS_DIR_NAME);
					this.projectFilePath = projectFilePath;
					this.appDirectoryPath = path.join(projectDir, constants.APP_FOLDER_NAME);
					this.projectId = data.id;
					this.dependencies = fileContent.dependencies;
					this.devDependencies = fileContent.devDependencies;
					this.projectType = this.getProjectType();

					return;
				}
			}
		}

		const currentDir = path.resolve(".");
		this.$logger.trace(`Unable to find project. projectDir: ${projectDir}, options.path: ${this.$options.path}, ${currentDir}`);

		// This is the case when no project file found
		this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", projectDir || this.$options.path || currentDir);
	}

	public getAppResourcesDirectoryPath(projectDir?: string): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		const configNSFilePath = path.join(projectDir, constants.CONFIG_NS_FILE_NAME);
		let absoluteAppResourcesDirPath: string;

		if (this.$fs.exists(configNSFilePath)) {
			const configNS = this.$fs.readJson(configNSFilePath);

			if (configNS && configNS[constants.CONFIG_NS_APP_RESOURCES_ENTRY]) {
				const appResourcesDirPath = configNS[constants.CONFIG_NS_APP_RESOURCES_ENTRY];

				absoluteAppResourcesDirPath = path.resolve(projectDir, appResourcesDirPath);
			}
		}

		return absoluteAppResourcesDirPath || path.join(projectDir, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME);
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
}
$injector.register("projectData", ProjectData);
