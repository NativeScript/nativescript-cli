
interface IProjectService {
	createProject(projectName: string, selectedTemplate?: string): IFuture<void>;
}

interface IProjectData {
	projectDir: string;
	projectName: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
	dependencies: any;
	appDirectoryPath: string;
	appResourcesDirectoryPath: string;
}

interface IProjectDataService {
	initialize(projectDir: string): void;
	getValue(propertyName: string): IFuture<any>;
	setValue(key: string, value: any): IFuture<void>;
	removeProperty(propertyName: string): IFuture<void>;
	removeDependency(dependencyName: string): IFuture<void>;
}

/**
 * Describes working with templates.
 */
interface IProjectTemplatesService {
	/**
	 * Defines the path where unpacked default template can be found.
	 */
	defaultTemplatePath: IFuture<string>;

	/**
	 * Prepares template for project creation.
	 * In case templateName is not provided, use defaultTemplatePath.
	 * In case templateName is a special word, validated from us (for ex. typescript), resolve the real template name and add it to npm cache.
	 * In any other cases try to `npm install` the specified templateName to temp directory.
	 * @param {string} templateName The name of the template.
	 * @return {string} Path to the directory where extracted template can be found.
	 */
	prepareTemplate(templateName: string): IFuture<string>;
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
	interpolateData(): IFuture<void>;
	interpolateConfigurationFile(configurationFilePath?: string): IFuture<void>;
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
	processConfigurationFilesFromAppResources(): IFuture<void>;
}

interface IAndroidProjectPropertiesManager {
	getProjectReferences(): IFuture<ILibRef[]>;
	addProjectReference(referencePath: string): IFuture<void>;
	removeProjectReference(referencePath: string): IFuture<void>;
}

interface ITestExecutionService {
	startTestRunner(platform: string): IFuture<void>;
	startKarmaServer(platform: string): IFuture<void>;
}

