interface IPluginsService {
	add(plugin: string, projectData: IProjectData): Promise<void>; // adds plugin by name, github url, local path and et.
	remove(pluginName: string, projectData: IProjectData): Promise<void>; // removes plugin only by name
	prepare(pluginData: IDependencyData, platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void>;
	getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]>;
	ensureAllDependenciesAreInstalled(projectData: IProjectData): Promise<void>;
	preparePluginScripts(pluginData: IPluginData, platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): void

	/**
	 * Returns all dependencies and devDependencies from pacakge.json file.
	 * @param {string} projectData Root directory of the project.
	 * @returns {IPackageJsonDepedenciesResult}
	 */
	getDependenciesFromPackageJson(projectDir: string): IPackageJsonDepedenciesResult;
	validate(platformData: IPlatformData, projectData: IProjectData): Promise<void>;
	preparePluginNativeCode(pluginData: IPluginData, platform: string, projectData: IProjectData): Promise<void>;
	convertToPluginData(cacheData: any, projectDir: string): IPluginData;
	isNativeScriptPlugin(pluginName: string, projectData: IProjectData): boolean;
}

interface IPackageJsonDepedenciesResult {
	dependencies: IBasePluginData[],
	devDependencies?: IBasePluginData[]
}

interface IBasePluginData {
	name: string;
	version: string;
}

interface IPluginData extends INodeModuleData {
	platformsData: IPluginPlatformsData;
	/* Gets all plugin variables from plugin */
	pluginVariables: IDictionary<IPluginVariableData>;
	pluginPlatformsFolderPath(platform: string): string;
}

interface INodeModuleData extends IBasePluginData {
	fullPath: string;
	isPlugin: boolean;
	moduleInfo: any;
}

interface IPluginPlatformsData {
	ios: string;
	android: string;
}

interface IPluginVariablesService {
	/**
	 * Saves plugin variables in project package.json file.
	 * @param  {IPluginData}		pluginData for the plugin.
	 * @param {string} projectDir: Specifies the directory of the project.
	 * @return {Promise<void>}
	 */
	savePluginVariablesInProjectFile(pluginData: IPluginData, projectDir: string): Promise<void>;

	/**
	 * Removes plugin variables from project package.json file.
	 * @param  {string}		pluginName Name of the plugin.
	 * @param {string} projectDir: Specifies the directory of the project.
	 * @return {void}
	 */
	removePluginVariablesFromProjectFile(pluginName: string, projectDir: string): void;

	/**
	 * Replaces all plugin variables with their corresponding values.
	 * @param {IPluginData}		pluginData for the plugin.
	 * @param {pluginConfigurationFilePath}		pluginConfigurationFilePath for the plugin.
	 * @param {string} projectDir: Specifies the directory of the project.
	 * @return {Promise<void>}
	 */
	interpolatePluginVariables(pluginData: IPluginData, pluginConfigurationFilePath: string, projectDir: string): Promise<void>;

	/**
	 * Replaces {nativescript.id} expression with the application identifier from package.json.
	 * @param {pluginConfigurationFilePath}	pluginConfigurationFilePath for the plugin.
	 * @return {void}
	 */
	interpolateAppIdentifier(pluginConfigurationFilePath: string, projectIdentifier: string): void;

	/**
	 * Replaces both plugin variables and appIdentifier
	 */
	interpolate(pluginData: IPluginData, pluginConfigurationFilePath: string, projectDir: string, projectIdentifier: string): Promise<void>;

	/**
	 * Returns the
	 * @param {string}		pluginName for the plugin.
	 * @return {Promise<string>}		returns the changed plugin configuration file content.
	 */
	getPluginVariablePropertyName(pluginName: string): string;

}

interface IPluginVariableData {
	defaultValue?: string;
	name?: string;
	value?: string;
}
