import * as path from "path";
import * as assert from "assert";

export class ProjectDataService implements IProjectDataService {
	private static DEPENDENCIES_KEY_NAME = "dependencies";

	private projectFilePath: string;
	private projectData: IDictionary<any>;
	private projectFileIndent: string;

	constructor(private $fs: IFileSystem,
		private $staticConfig: IStaticConfig,
		private $errors: IErrors,
		private $logger: ILogger) {
	}

	public initialize(projectDir: string): void {
		if (!this.projectFilePath) {
			this.projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
		}
	}

	public getValue(propertyName: string): any {
		this.loadProjectFile();
		return this.projectData ? this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][propertyName] : null;
	}

	public setValue(key: string, value: any): void {
		this.loadProjectFile();
		if (!this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE]) {
			this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE] = Object.create(null);
		}
		this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][key] = value;
		this.$fs.writeJson(this.projectFilePath, this.projectData, this.projectFileIndent);
	}

	public removeProperty(propertyName: string): void {
		this.loadProjectFile();
		delete this.projectData[this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE][propertyName];
		this.$fs.writeJson(this.projectFilePath, this.projectData, this.projectFileIndent);
	}

	public removeDependency(dependencyName: string): void {
		this.loadProjectFile();
		delete this.projectData[ProjectDataService.DEPENDENCIES_KEY_NAME][dependencyName];
		this.$fs.writeJson(this.projectFilePath, this.projectData, this.projectFileIndent);
	}

	private loadProjectFile(): void {
		assert.ok(this.projectFilePath, "Initialize method of projectDataService is not called.");

		if (!this.$fs.exists(this.projectFilePath)) {
			this.$fs.writeJson(this.projectFilePath, {
				"description": "NativeScript Application",
				"license": "SEE LICENSE IN <your-license-filename>",
				"readme": "NativeScript Application",
				"repository": "<fill-your-repository-here>"
			});
		}

		// Detect indent and use it later to write JSON.
		let projectFileContent = this.$fs.readText(this.projectFilePath);

		this.projectFileIndent = projectFileContent ? this.detectIndent(projectFileContent) : "\t";

		this.projectData = projectFileContent ? JSON.parse(projectFileContent) : Object.create(null);
	}

	private detectIndent(content: string): any {
		const leadingSpace = content.match(/(^[ ]+)\S/m);
		if (leadingSpace) {
			return leadingSpace[1].length;
		}
		return "\t";
	}
}
$injector.register("projectDataService", ProjectDataService);
