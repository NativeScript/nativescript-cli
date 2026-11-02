import { Contract } from "../common/di/contract";
import type { IStringDictionary } from "../common/declarations";
import type { BundlerType, INsConfig } from "../definitions/project";

/**
 * Describes a NativeScript project — its layout on disk, its resolved
 * configuration and the dependencies declared in its package.json.
 */
@Contract({ name: "projectData" })
export abstract class ProjectData {
	/** Root directory of the project. */
	abstract projectDir: string;

	/** Name of the application. */
	abstract projectName: string;

	abstract platformsDir: string;
	abstract projectFilePath: string;

	/**
	 * @deprecated Use `projectIdentifiers[platform]` instead.
	 */
	abstract projectId: string;

	abstract projectIdentifiers?: Mobile.IProjectIdentifier;
	abstract dependencies: any;
	abstract ignoredDependencies?: string[];

	abstract getIgnoredDependencies(platform?: string): string[];
	abstract devDependencies: IStringDictionary;
	abstract appDirectoryPath: string;
	abstract appResourcesDirectoryPath: string;
	abstract projectType: string;
	abstract packageJsonData: any;
	abstract nsConfig: INsConfig;
	abstract androidManifestPath: string;
	abstract appGradlePath: string;
	abstract gradleFilesDirectoryPath: string;
	abstract infoPlistPath: string;
	abstract buildXcconfigPath: string;
	abstract podfilePath: string;
	abstract initialized?: boolean;

	/**
	 * Defines if the project is a code sharing one.
	 * Value is true when project has nativescript.config and it has `shared: true` in it.
	 */
	abstract isShared: boolean;

	/**
	 * Specifies the bundler used to build the application.
	 *
	 * - `"webpack"`: Uses Webpack for traditional bundling.
	 * - `"rspack"`: Uses Rspack for fast bundling.
	 * - `"vite"`: Uses Vite for fast bundling.
	 *
	 * @default "webpack"
	 */
	abstract bundler: BundlerType;

	/**
	 * @deprecated Use bundlerConfigPath
	 * Defines the path to the configuration file passed to webpack process.
	 * By default this is the webpack.config.js at the root of the application.
	 * The value can be changed by setting `webpackConfigPath` in nativescript.config.
	 */
	abstract webpackConfigPath: string;

	/**
	 * Defines the path to the bundler configuration file passed to the compiler.
	 * The value can be changed by setting `bundlerConfigPath` in nativescript.config.
	 */
	abstract bundlerConfigPath: string;

	/**
	 * Initializes project data with the given project directory. If none supplied defaults to --path option or cwd.
	 * @param {string} projectDir Project root directory.
	 * @returns {void}
	 */
	abstract initializeProjectData(projectDir?: string): void;

	abstract initializeProjectDataFromContent(
		packageJsonContent: string,
		projectDir?: string,
	): void;

	abstract getAppDirectoryPath(projectDir?: string): string;

	abstract getAppDirectoryRelativePath(): string;

	abstract getAppResourcesDirectoryPath(projectDir?: string): string;

	abstract getAppResourcesRelativeDirectoryPath(): string;

	abstract getBuildRelativeDirectoryPath(): string;
}
