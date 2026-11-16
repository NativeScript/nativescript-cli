import { IAndroidToolsInfoData } from "../declarations";
import { IProjectDir } from "../common/declarations";

interface IPluginBuildOptions extends IAndroidBuildOptions {
	projectDir?: string;
	/**
	 * File name (without extension) of the built aar and of its temp build dir.
	 * Defaults to the plugin's short name.
	 */
	aarName?: string;
	/**
	 * The project keeps node_modules read-only, so `aarOutputDir` is a CLI-owned
	 * copy of the plugin's platforms/android.
	 */
	readOnlyNodeModules?: boolean;
	/**
	 * The project's nativescript-gradle.json, passed to the plugin's Gradle build when it exists.
	 */
	gradleFactsFile?: string;
}

interface IAndroidBuildOptions {
	platformsAndroidDirPath: string;
	pluginName: string;
	aarOutputDir: string;
	tempPluginDirPath: string;
	gradlePath?: string;
	gradleArgs?: string;
}

interface IAndroidPluginBuildService {
	buildAar(options: IPluginBuildOptions): Promise<boolean>;
	migrateIncludeGradle(options: IPluginBuildOptions): boolean;
	/**
	 * Whether the plugin has sources to build but `aarOutputDir` lacks its aar
	 * or still holds one under another of its candidate names.
	 */
	hasOutdatedAar(options: IPluginBuildOptions): boolean;
}

interface IAndroidPluginMirror {
	pluginName: string;
	/**
	 * The installed npm package.
	 */
	packageDir: string;
	mirrorDir: string;
	/**
	 * Paths relative to the package's platforms/android that are not copied.
	 */
	excludedNativeFiles?: string[];
}

interface IAndroidPluginMirrorService {
	/**
	 * Brings `<mirrorsRoot>/<dir>` in line with each plugin's package.json and
	 * platforms/android, and removes mirrors of plugins not in `mirrors`.
	 * @returns The names of the plugins whose mirror changed.
	 */
	syncMirrors(mirrorsRoot: string, mirrors: IAndroidPluginMirror[]): string[];
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
	 * The project keeps node_modules read-only (`android.readOnlyNodeModules`).
	 */
	readOnlyNodeModules?: boolean;

	/**
	 * Absolute path of the project's nativescript-gradle.json, when it exists.
	 */
	gradleFactsFile?: string;
}
