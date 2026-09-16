import { Contract } from "../common/di/contract";
import type {
	IPackageInstallOptions,
	IPackageUninstallOptions,
	INpmInstallResultInfo,
	INpmPackageNameParts,
	INpmsResult,
} from "../declarations";

/**
 * Dispatches package operations to the package manager selected for the current
 * process (npm, yarn, yarn2, pnpm or bun).
 */
@Contract({ name: "packageManager" })
export abstract class PackageManager {
	/**
	 * Installs dependency
	 * @param  {string}                            packageName The name of the dependency - can be a path, a url or a string.
	 * @param  {string}                            pathToSave  The destination of the installation.
	 * @param  {IPackageInstallOptions}            options     Package-manager-agnostic installation options.
	 * @return {Promise<INpmInstallResultInfo>}                Information about installed package.
	 */
	abstract install(
		packageName: string,
		pathToSave: string,
		options: IPackageInstallOptions,
	): Promise<INpmInstallResultInfo>;

	/**
	 * Uninstalls a dependency
	 * @param  {string}                            packageName The name of the dependency.
	 * @param  {IPackageUninstallOptions}          options     Package-manager-agnostic uninstallation options.
	 * @param  {string}                            path  The destination of the uninstallation.
	 * @return {Promise<string>}                The output of the uninstallation.
	 */
	abstract uninstall(
		packageName: string,
		options?: IPackageUninstallOptions,
		path?: string,
	): Promise<string>;

	/**
	 * Provides information about a given package.
	 * @param  {string} packageName The name of the package, optionally with a version.
	 * @param  {string} field       @optional A single registry field (e.g. "versions" or "dist-tags") to return instead of the whole document.
	 * @return {Promise<any>} The parsed registry data, or null when it cannot be parsed.
	 */
	abstract view(packageName: string, field?: string): Promise<any>;

	/**
	 * Checks if the specified string is name of a packaged published in the NPM registry.
	 * @param  {string} packageName The string to be checked.
	 * @return {Promise<boolean>} True if the specified string is a registered package name, false otherwise.
	 */
	abstract isRegistered(packageName: string): Promise<boolean>;

	/**
	 * Separates the package name and version from a specified fullPackageName.
	 * @param  {string} fullPackageName The full name of the package like nativescript@10.0.0.
	 * @return {INpmPackageNameParts} An object containing the separated package name and version.
	 */
	abstract getPackageNameParts(
		fullPackageName: string,
	): Promise<INpmPackageNameParts>;

	/**
	 * Returns the full name of an npm package based on the provided name and version.
	 * @param  {INpmPackageNameParts} packageNameParts An object containing the package name and version.
	 * @return {string} The full name of the package like nativescript@10.0.0.
	 */
	abstract getPackageFullName(
		packageNameParts: INpmPackageNameParts,
	): Promise<string>;

	/**
	 * Searches for a package.
	 * @param  {string[]} filter Keywords with which to perform the search.
	 * @return {Promise<string>} The raw search output.
	 */
	abstract search(filter: string[]): Promise<string>;

	/**
	 * Searches for npm packages in npms by keyword.
	 * @param {string} keyword The keyword based on which the search action will be executed.
	 * @returns {INpmsResult} The information about found npm packages.
	 */
	abstract searchNpms(keyword: string): Promise<INpmsResult>;

	/**
	 * Gets information for a specified package from registry.npmjs.org.
	 * @param {string} packageName The name of the package.
	 * @returns {any} The full data from registry.npmjs.org for this package.
	 */
	abstract getRegistryPackageData(packageName: string): Promise<any>;

	/**
	 * Gets the path to npm cache directory.
	 * @returns {string} The full path to npm cache directory
	 */
	abstract getCachePath(): Promise<string>;

	/**
	 * Locates a package the way the package manager laid it out on disk.
	 * @param  {string} packageName The name of the package.
	 * @param  {string} fromDir     The directory whose dependencies are searched, usually the project directory.
	 * @return {string} The absolute path of the package directory, or null when it is not installed.
	 */
	abstract getInstalledPackagePath(
		packageName: string,
		fromDir: string,
	): string;

	/**
	 * Gets the name of the package manager used for the current process.
	 * It can be read from the user settings or by passing -- option.
	 */
	abstract getPackageManagerName(): Promise<string>;

	/**
	 * Gets the version corresponding to the tag for the package
	 * @param {string} packageName The name of the package.
	 * @param {string} tag The tag which we need the version of.
	 * @returns {string} The version corresponding to the tag
	 */
	abstract getTagVersion(packageName: string, tag: string): Promise<string>;
}
