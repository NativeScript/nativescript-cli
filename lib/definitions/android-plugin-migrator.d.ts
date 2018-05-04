
interface IBuildOptions extends IAndroidBuildOptions{
}

interface IAndroidBuildOptions {
    platformsAndroidDirPath: string,
    pluginName: string,
    aarOutputDir: string,
    tempPluginDirPath: string
}

interface IAndroidPluginBuildService {
	buildAar(options: IBuildOptions): Promise<boolean>;
	migrateIncludeGradle(options: IBuildOptions): boolean;
}

/**
 * Describes data required for building plugin for Android.
 * The data can be consumed in the buildAndroidPlugin hook.
 */
interface IBuildAndroidPluginData {
	/**
	 * Directory where the plugin will be build.
	 * Usually this is the `<project dir>/platforms/tempPlugin/<plugin name>` dir.
	 */
	pluginDir: string;

	/**
	 * The name of the plugin.
	 */
	pluginName: string;

	/**
	 * Information about tools that will be used to build the plugin, for example compile SDK version, build tools version, etc.
	 */
	androidToolsInfo: IAndroidToolsInfoData;
}
