import { IAndroidToolsInfoData } from "../declarations";
import { IProjectDir } from "../common/declarations";

interface IPluginBuildOptions extends IAndroidBuildOptions {
	projectDir?: string;
}

interface IAndroidBuildOptions {
	platformsAndroidDirPath: string;
	pluginName: string;
	aarOutputDir: string;
	tempPluginDirPath: string;
}

interface IAndroidPluginBuildService {
	buildAar(options: IPluginBuildOptions): Promise<boolean>;
	migrateIncludeGradle(options: IPluginBuildOptions): boolean;
}

/**
 * Describes data required for building plugin for Android.
 * The data can be consumed in the buildAndroidPlugin hook.
 */
interface IBuildAndroidPluginData extends Partial<IProjectDir> {
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
	androidToolsInfo?: IAndroidToolsInfoData;
}
