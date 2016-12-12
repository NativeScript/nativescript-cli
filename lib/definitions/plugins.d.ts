interface IPluginsService {
	add(plugin: string): IFuture<void>; // adds plugin by name, github url, local path and et.
	remove(pluginName: string): IFuture<void>; // removes plugin only by name
	getAvailable(filter: string[]): IFuture<IDictionary<any>>; // gets all available plugins
	prepare(pluginData: IDependencyData, platform: string): IFuture<void>;
	getAllInstalledPlugins(): IFuture<IPluginData[]>;
	ensureAllDependenciesAreInstalled(): IFuture<void>;

	/**
	 * Returns all dependencies and devDependencies from pacakge.json file.
	 * @returns {IPackageJsonDepedenciesResult}
	 */
	getDependenciesFromPackageJson(): IPackageJsonDepedenciesResult;
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
	 * @return {IFuture<void>}
	 */
	savePluginVariablesInProjectFile(pluginData: IPluginData): IFuture<void>;

	/**
	 * Removes plugin variables from project package.json file.
	 * @param  {string}		pluginName Name of the plugin.
	 * @return {void}
	 */
	removePluginVariablesFromProjectFile(pluginName: string): void;

	/**
	 * Replaces all plugin variables with their corresponding values.
	 * @param {IPluginData}		pluginData for the plugin.
	 * @param {pluginConfigurationFilePath}		pluginConfigurationFilePath for the plugin.
	 * @return {IFuture<void>}
	 */
	interpolatePluginVariables(pluginData: IPluginData, pluginConfigurationFilePath: string): IFuture<void>;

	/**
	 * Replaces {nativescript.id} expression with the application identifier from package.json.
	 * @param {pluginConfigurationFilePath}	pluginConfigurationFilePath for the plugin.
	 * @return {void}
	 */
	interpolateAppIdentifier(pluginConfigurationFilePath: string): void;

	/**
	 * Replaces both plugin variables and appIdentifier
	 */
	interpolate(pluginData: IPluginData, pluginConfigurationFilePath: string): IFuture<void>;

	/**
	 * Returns the
	 * @param {string}		pluginName for the plugin.
	 * @return {IFuture<string>}		returns the changed plugin configuration file content.
	 */
	getPluginVariablePropertyName(pluginName: string): string;

}

interface IPluginVariableData {
	defaultValue?: string;
	name?: string;
	value?: string;
}
