interface IPluginsService {
	add(plugin: string, projectData: IProjectData): Promise<void>; // adds plugin by name, github url, local path and et.
	remove(pluginName: string, projectData: IProjectData): Promise<void>; // removes plugin only by name
	getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]>;
	ensureAllDependenciesAreInstalled(projectData: IProjectData): Promise<void>;

	/**
	 * Returns all dependencies and devDependencies from pacakge.json file.
	 * @param {string} projectData Root directory of the project.
	 * @returns {IPackageJsonDepedenciesResult}
	 */
	getDependenciesFromPackageJson(projectDir: string): IPackageJsonDepedenciesResult;
	validate(platformData: IPlatformData, projectData: IProjectData): Promise<void>;
	preparePluginNativeCode(pluginData: IPluginData, platform: string, projectData: IProjectData): Promise<void>;
	convertToPluginData(cacheData: any, projectDir: string): IPluginData;
	isNativeScriptPlugin(pluginPackageJsonPath: string): boolean;
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

interface IPluginVariableData {
	defaultValue?: string;
	name?: string;
	value?: string;
}
