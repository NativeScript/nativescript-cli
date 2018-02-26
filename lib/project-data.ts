import * as constants from "./constants";
import * as path from "path";
import { parseJson } from "./common/helpers";
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
	public nsConfig: any;
	public appDirectoryPath: string;
	public appResourcesDirectoryPath: string;
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
			const projectFilePath = this.getProjectFilePath(projectDir);

			if (this.$fs.exists(projectFilePath)) {
				const packageJsonContent = this.$fs.readText(projectFilePath);
				const nsConfigContent = this.getNsConfigContent(projectDir);

				this.initializeProjectDataFromContent(packageJsonContent, nsConfigContent, projectDir);
			}

			return;
		}

		this.errorInvalidProject(projectDir);
	}

	public initializeProjectDataFromContent(packageJsonContent: string, nsconfigContent: string, projectDir?: string): void {
		projectDir = projectDir || this.$projectHelper.projectDir || "";
		const projectFilePath = this.getProjectFilePath(projectDir);
		// If no project found, projectDir should be null
		let nsData = null;
		let nsConfig: INsConfig = null;
		let packageJsonData = null;

		try {
			packageJsonData = parseJson(packageJsonContent);
			nsData = packageJsonData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE];
		} catch (err) {
			this.$errors.failWithoutHelp(`The project file ${this.projectFilePath} is corrupted. ${EOL}` +
				`Consider restoring an earlier version from your source control or backup.${EOL}` +
				`Additional technical info: ${err.toString()}`);
		}

		try {
			nsConfig = nsconfigContent ? <INsConfig>parseJson(nsconfigContent) : null;
		} catch (err) {
			this.$errors.failWithoutHelp(`The NativeScript configuration file ${constants.CONFIG_NS_FILE_NAME} is corrupted. ${EOL}` +
				`Consider restoring an earlier version from your source control or backup.${EOL}` +
				`Additional technical info: ${err.toString()}`);
		}

		if (nsData) {
			this.projectDir = projectDir;
			this.projectName = this.$projectHelper.sanitizeName(path.basename(projectDir));
			this.platformsDir = path.join(projectDir, constants.PLATFORMS_DIR_NAME);
			this.projectFilePath = projectFilePath;
			this.projectId = nsData.id;
			this.dependencies = packageJsonData.dependencies;
			this.devDependencies = packageJsonData.devDependencies;
			this.projectType = this.getProjectType();
			this.nsConfig = nsConfig;
			this.appDirectoryPath = this.getAppDirectoryPath();
			this.appResourcesDirectoryPath = this.getAppResourcesDirectoryPath();

			return;
		}

		this.errorInvalidProject(projectDir);
	}

	private errorInvalidProject(projectDir: string): void {
		const currentDir = path.resolve(".");
		this.$logger.trace(`Unable to find project. projectDir: ${projectDir}, options.path: ${this.$options.path}, ${currentDir}`);

		// This is the case when no project file found
		this.$errors.fail("No project found at or above '%s' and neither was a --path specified.", projectDir || this.$options.path || currentDir);
	}

	private getProjectFilePath(projectDir: string): string {
		return path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
	}

	public getAppResourcesDirectoryPath(projectDir?: string): string {
		const appResourcesRelativePath = this.getAppResourcesRelativeDirectoryPath();

		return this.resolveToProjectDir(appResourcesRelativePath, projectDir);
	}

	public getAppResourcesRelativeDirectoryPath(): string {
		if (this.nsConfig && this.nsConfig[constants.CONFIG_NS_APP_RESOURCES_ENTRY]) {
			return this.nsConfig[constants.CONFIG_NS_APP_RESOURCES_ENTRY];
		}

		return path.join(this.getAppDirectoryRelativePath(), constants.APP_RESOURCES_FOLDER_NAME);
	}

	public getAppDirectoryPath(projectDir?: string): string {
		const appRelativePath = this.getAppDirectoryRelativePath();

		return this.resolveToProjectDir(appRelativePath, projectDir);
	}

	public getAppDirectoryRelativePath(): string {
		if (this.nsConfig && this.nsConfig[constants.CONFIG_NS_APP_ENTRY]) {
			return this.nsConfig[constants.CONFIG_NS_APP_ENTRY];
		}

		return constants.APP_FOLDER_NAME;
	}

	private getNsConfigContent(projectDir: string): string {
		const configNSFilePath = path.join(projectDir, constants.CONFIG_NS_FILE_NAME);

		if (!this.$fs.exists(configNSFilePath)) {
			return null;
		}

		return this.$fs.readText(configNSFilePath);
	}

	private resolveToProjectDir(pathToResolve: string, projectDir?: string): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		if (!projectDir) {
			return null;
		}

		return path.resolve(projectDir, pathToResolve);
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
