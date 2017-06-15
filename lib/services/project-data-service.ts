import * as path from "path";
import { ProjectData } from "../project-data";

interface IProjectFileData {
	projectData: any;
	projectFilePath: string;
}

export class ProjectDataService implements IProjectDataService {
	private static DEPENDENCIES_KEY_NAME = "dependencies";

	constructor(private $fs: IFileSystem,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger,
		private $injector: IInjector) {
	}

	public getNSValue(projectDir: string, propertyName: string): any {
		return this.getValue(projectDir, this.getNativeScriptPropertyName(propertyName));
	}

	public setNSValue(projectDir: string, key: string, value: any): void {
		this.setValue(projectDir, this.getNativeScriptPropertyName(key), value);
	}

	public removeNSProperty(projectDir: string, propertyName: string): void {
		this.removeProperty(projectDir, this.getNativeScriptPropertyName(propertyName));
	}

	public removeDependency(projectDir: string, dependencyName: string): void {
		const projectFileInfo = this.getProjectFileData(projectDir);
		delete projectFileInfo.projectData[ProjectDataService.DEPENDENCIES_KEY_NAME][dependencyName];
		this.$fs.writeJson(projectFileInfo.projectFilePath, projectFileInfo.projectData);
	}

	// TODO: Add tests
	// TODO: Remove $projectData and replace it with $projectDataService.getProjectData
	public getProjectData(projectDir: string): IProjectData {
		const projectDataInstance = this.$injector.resolve<IProjectData>(ProjectData);
		projectDataInstance.initializeProjectData(projectDir);
		return projectDataInstance;
	}

	private getValue(projectDir: string, propertyName: string): any {
		const projectData = this.getProjectFileData(projectDir).projectData;

		if (projectData) {
			try {
				return this.getPropertyValueFromJson(projectData, propertyName);
			} catch (err) {
				this.$logger.trace(`Error while trying to get property ${propertyName} from ${projectDir}. Error is:`, err);
			}
		}

		return null;
	}

	private getNativeScriptPropertyName(propertyName: string) {
		return `${this.$staticConfig.CLIENT_NAME_KEY_IN_PROJECT_FILE}.${propertyName}`;
	}

	private getPropertyValueFromJson(jsonData: any, dottedPropertyName: string): any {
		const props = dottedPropertyName.split(".");
		let result = jsonData[props.shift()];

		for (let prop of props) {
			result = result[prop];
		}

		return result;
	}

	private setValue(projectDir: string, key: string, value: any): void {
		const projectFileInfo = this.getProjectFileData(projectDir);

		const props = key.split(".");
		let data: any = projectFileInfo.projectData;
		let currentData = data;

		_.each(props, (prop, index: number) => {
			if (index === (props.length - 1)) {
				currentData[prop] = value;
			} else {
				currentData[prop] = currentData[prop] || Object.create(null);
			}

			currentData = currentData[prop];
		});

		this.$fs.writeJson(projectFileInfo.projectFilePath, data);
	}

	private removeProperty(projectDir: string, propertyName: string): void {
		const projectFileInfo = this.getProjectFileData(projectDir);
		let data: any = projectFileInfo.projectData;
		let currentData = data;
		const props = propertyName.split(".");
		const propertyToDelete = props.splice(props.length - 1, 1)[0];

		_.each(props, (prop) => {
			currentData = currentData[prop];
		});

		delete currentData[propertyToDelete];
		this.$fs.writeJson(projectFileInfo.projectFilePath, data);
	}

	private getProjectFileData(projectDir: string): IProjectFileData {
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);
		const projectFileContent = this.$fs.readText(projectFilePath);
		const projectData = projectFileContent ? JSON.parse(projectFileContent) : Object.create(null);

		return {
			projectData,
			projectFilePath
		};
	}
}
$injector.register("projectDataService", ProjectDataService);
