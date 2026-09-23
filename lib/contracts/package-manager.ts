import { Contract } from "../common/di/contract";
import type { IDictionary } from "../common/declarations";
import type {
	INodePackageManagerInstallOptions,
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
	 * @param  {INodePackageManagerInstallOptions} config      Additional options that can be passed to manipulate installation.
	 * @return {Promise<INpmInstallResultInfo>}                Information about installed package.
	 */
	abstract install(
		packageName: string,
		pathToSave: string,
		config: INodePackageManagerInstallOptions,
	): Promise<INpmInstallResultInfo>;

	/**
	 * Uninstalls a dependency
	 * @param  {string}                            packageName The name of the dependency.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate uninstallation.
	 * @param  {string}                            path  The destination of the uninstallation.
	 * @return {Promise<string>}                The output of the uninstallation.
	 */
	abstract uninstall(
		packageName: string,
		config?: IDictionary<string | boolean>,
		path?: string,
	): Promise<string>;

	/**
	 * Provides information about a given package.
	 * @param  {string}                            packageName The name of the package.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate view.
	 * @return {Promise<any>}                Object, containing information about the package.
	 */
	abstract view(packageName: string, config: Object): Promise<any>;

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
	 * @param  {string[]}                            filter Keywords with which to perform the search.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate search.
	 * @return {Promise<string>}                The output of the uninstallation.
	 */
	abstract search(
		filter: string[],
		config: IDictionary<string | boolean>,
	): Promise<string>;

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
