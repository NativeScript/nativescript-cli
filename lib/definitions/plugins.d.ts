interface IPluginsService {
	add(plugin: string): IFuture<void>; // adds plugin by name, github url, local path and et.
	remove(pluginName: string): IFuture<void>; // removes plugin only by name
	prepare(pluginData: IPluginData): IFuture<void>;
	getAllInstalledPlugins(): IFuture<IPluginData[]>;
	ensureAllDependenciesAreInstalled(): IFuture<void>;
}

interface IPluginData extends INodeModuleData {
	platformsData: IPluginPlatformsData;
	pluginPlatformsFolderPath(platform: string): string; 
}

interface INodeModuleData {
	name: string;
	version: string;
	fullPath: string;
	isPlugin: boolean;
	moduleInfo: any;
}

interface IPluginPlatformsData {
	ios: string;
	android: string;
}