
interface IProjectService {
	createProject(projectName: string): IFuture<void>;
}

interface IProjectData {
	projectDir: string;
	projectName: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
	dependencies: any;
}

interface IProjectDataService {
	initialize(projectDir: string): void;
	getValue(propertyName: string): IFuture<any>;
	setValue(key: string, value: any): IFuture<void>;
	removeProperty(propertyName: string): IFuture<void>;
	removeDependency(dependencyName: string): IFuture<void>;
}

interface IProjectTemplatesService {
	defaultTemplatePath: IFuture<string>;
}

interface IPlatformProjectServiceBase {
	getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string): string;
}

interface IBuildConfig {
	runSbGenerator?: boolean;
}

interface IPlatformProjectService {
	platformData: IPlatformData;
	validate(): IFuture<void>;
	createProject(frameworkDir: string, frameworkVersion: string): IFuture<void>;
	interpolateData(projectRoot: string): IFuture<void>;
	afterCreateProject(projectRoot: string): IFuture<void>;
	buildProject(projectRoot: string, buildConfig?: IBuildConfig): IFuture<void>;
	prepareProject(): IFuture<void>;
	prepareAppResources(appResourcesDirectoryPath: string): IFuture<void>;
	isPlatformPrepared(projectRoot: string): IFuture<boolean>;
	addLibrary(libraryPath: string): IFuture<void>;
	canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean>;
	/**
	* Provides a platform specific update logic for the specified runtime versions.
	* @return true in cases when the update procedure should continue.
	*/
	updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean, addPlatform?: Function, removePlatform?: (platforms: string[]) => IFuture<void>): IFuture<boolean>;
	preparePluginNativeCode(pluginData: IPluginData, options?: any): IFuture<void>;
	removePluginNativeCode(pluginData: IPluginData): IFuture<void>;
	afterPrepareAllPlugins(): IFuture<void>;
	getAppResourcesDestinationDirectoryPath(): IFuture<string>;
	deploy(deviceIdentifier: string): IFuture<void>;
}

interface IAndroidProjectPropertiesManager {
	getProjectReferences(): IFuture<ILibRef[]>;
	addProjectReference(referencePath: string): IFuture<void>;
	removeProjectReference(referencePath: string): IFuture<void>;
}
