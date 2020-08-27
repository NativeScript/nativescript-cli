import { IProjectData } from "./project";
import { IDependencyData } from "../declarations";
import { IDictionary } from "../common/declarations";

interface IPluginsService {
	add(plugin: string, projectData: IProjectData): Promise<void>; // adds plugin by name, github url, local path and et.
	remove(pluginName: string, projectData: IProjectData): Promise<void>; // removes plugin only by name
	addToPackageJson(
		plugin: string,
		version: string,
		isDev: boolean,
		projectDir: string
	): void;
	removeFromPackageJson(plugin: string, projectDir: string): void;
	getAllInstalledPlugins(projectData: IProjectData): Promise<IPluginData[]>;
	getAllProductionPlugins(
		projectData: IProjectData,
		platform: string,
		dependencies?: IDependencyData[]
	): IPluginData[];
	ensureAllDependenciesAreInstalled(projectData: IProjectData): Promise<void>;

	/**
	 * Returns all dependencies and devDependencies from pacakge.json file.
	 * @param {string} projectData Root directory of the project.
	 * @returns {IPackageJsonDepedenciesResult}
	 */
	getDependenciesFromPackageJson(
		projectDir: string
	): IPackageJsonDepedenciesResult;
	preparePluginNativeCode(
		preparePluginNativeCodeData: IPreparePluginNativeCodeData
	): Promise<void>;
	isNativeScriptPlugin(pluginPackageJsonPath: string): boolean;
}

interface IPreparePluginNativeCodeData {
	pluginData: IPluginData;
	platform: string;
	projectData: IProjectData;
}

interface IPackageJsonDepedenciesResult {
	dependencies: IBasePluginData[];
	devDependencies?: IBasePluginData[];
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
	nativescript: any;
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
