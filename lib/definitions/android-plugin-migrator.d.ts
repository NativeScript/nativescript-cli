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
	gradlePath?: string;
	gradleArgs?: string;
	abiFilters?: string[];
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

	/**
	 * Optional custom Gradle path.
	 */
	gradlePath?: string;

	/**
	 * Optional custom Gradle arguments.
	 */
	gradleArgs?: string;

	/**
	 * The ABIs the build this plugin is prepared for is about to deploy to,
	 * passed to the plugin build as `-PabiFilters`. Nothing in the gradle files
	 * the CLI generates for a plugin acts on it - it is there for a plugin whose
	 * own `include.gradle` reads the property to skip the ABIs the build does
	 * not need.
	 */
	abiFilters?: string[];
}
