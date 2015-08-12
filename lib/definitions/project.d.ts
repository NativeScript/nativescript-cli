interface IProjectService {
	createProject(projectName: string): IFuture<void>;
}

interface IProjectData {
	projectDir: string;
	projectName: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
}

interface IProjectDataService {
	initialize(projectDir: string): void;
	getValue(propertyName: string): IFuture<any>;
	setValue(key: string, value: any): IFuture<void>;
	removeProperty(propertyName: string): IFuture<void>;
}

interface IProjectTemplatesService {
	defaultTemplatePath: IFuture<string>;
}

interface IPlatformProjectServiceBase {
	getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string): string;
}

interface IPlatformProjectService {
	platformData: IPlatformData;
	validate(): IFuture<void>;
	createProject(projectRoot: string, frameworkDir: string): IFuture<void>;
	interpolateData(projectRoot: string): IFuture<void>;
	afterCreateProject(projectRoot: string): IFuture<void>;
	buildProject(projectRoot: string): IFuture<void>;
	prepareProject(): IFuture<void>;
	prepareAppResources(appResourcesDirectoryPath: string): IFuture<void>;
	isPlatformPrepared(projectRoot: string): IFuture<boolean>;
	addLibrary(libraryPath: string): IFuture<void>;
	canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean>;
	updatePlatform(currentVersion: string, newVersion: string): IFuture<void>;
	preparePluginNativeCode(pluginData: IPluginData): IFuture<void>;
	removePluginNativeCode(pluginData: IPluginData): IFuture<void>;
	afterPrepareAllPlugins(): IFuture<void>;
}

interface IAndroidProjectPropertiesManager {
	getProjectReferences(): IFuture<ILibRef[]>;
	addProjectReference(referencePath: string): IFuture<void>;
	removeProjectReference(referencePath: string): IFuture<void>;	
}
