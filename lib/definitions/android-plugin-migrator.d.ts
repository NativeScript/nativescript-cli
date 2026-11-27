import { IAndroidToolsInfoData } from "../declarations";
import { IProjectDir } from "../common/declarations";
import { AndroidPluginBuildLocation } from "./project";

interface IPluginBuildOptions extends IAndroidBuildOptions {
	projectDir?: string;
	/**
	 * File name (without extension) of the built aar and of its temp build dir.
	 * Defaults to the plugin's short name.
	 */
	aarName?: string;
	/**
	 * When `"platforms"`, `aarOutputDir` is a CLI-owned copy of the plugin's
	 * platforms/android. Absent means `"node_modules"`.
	 */
	pluginBuildLocation?: AndroidPluginBuildLocation;
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
	 * Whether `aarOutputDir` lacks the aar of a plugin with sources to build, or
	 * still holds one of `getStaleAars`.
	 */
	hasOutdatedAar(options: IPluginBuildOptions): boolean;
	/**
	 * Aars in `dir` (default: `aarOutputDir`) that the CLI built for this plugin
	 * under another of its candidate aar names. Aars the package ships are not
	 * included.
	 */
	getStaleAars(options: IPluginBuildOptions, dir?: string): IStaleAar[];
}

interface IStaleAar {
	aarPath: string;
	/**
	 * The CLI's previous build output under that name, when the leftover is
	 * recognised by it rather than by its name alone.
	 */
	previousOutputPath?: string;
	/**
	 * The file differs from `previousOutputPath`.
	 */
	differs: boolean;
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
	 * The project's `android.pluginBuildLocation`. Absent means `"node_modules"`.
	 */
	pluginBuildLocation?: AndroidPluginBuildLocation;

	/**
	 * Absolute path of the project's nativescript-gradle.json, when it exists.
	 */
	gradleFactsFile?: string;
}
