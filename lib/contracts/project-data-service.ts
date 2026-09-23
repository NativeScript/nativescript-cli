import { Contract } from "../common/di/contract";
import type { SupportedPlatform } from "../constants";
import type { IProjectDir } from "../common/declarations";
import type { IBasePluginData } from "../definitions/plugins";
import type {
	IAssetGroup,
	IAssetsStructure,
	IProjectData,
} from "../definitions/project";

/**
 * Reads and mutates the metadata of a NativeScript project - the `nativescript`
 * key in package.json, `nativescript.config` and the App_Resources assets.
 */
@Contract({ name: "projectDataService" })
export abstract class ProjectDataService {
	/**
	 * Returns a value from `nativescript` key in project's package.json.
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} propertyName The name of the property to be checked in `nativescript` key.
	 * @returns {any} The value of the property.
	 */
	abstract getNSValue(projectDir: string, propertyName: string): any;

	/**
	 * Sets a value in the `nativescript` key in a project's package.json.
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} key Key to be added to `nativescript` key in project's package.json.
	 * @param {any} value Value of the key to be added to `nativescript` key in project's package.json.
	 * @returns {void}
	 */
	abstract setNSValue(projectDir: string, key: string, value: any): void;

	/**
	 * Removes a property from `nativescript` key in project's package.json.
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} propertyName The name of the property to be removed from `nativescript` key.
	 * @returns {void}
	 */
	abstract removeNSProperty(projectDir: string, propertyName: string): void;

	/**
	 * Removes a property from `nativescript.config`.
	 * @param {string} projectDir The project directory - the place where the `nativescript.config` is located.
	 * @param {string} propertyName The name of the property to be removed.
	 * @returns {void}
	 */
	abstract removeNSConfigProperty(
		projectDir: string,
		propertyName: string,
	): void;

	/**
	 * Removes dependency from package.json
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} dependencyName Name of the dependency that has to be removed.
	 * @returns {void}
	 */
	abstract removeDependency(projectDir: string, dependencyName: string): void;

	abstract getProjectData(projectDir?: string): IProjectData;

	/**
	 * Builds the project data from an in-memory package.json instead of reading
	 * it from disk. Used when the package.json content is not (yet) written out.
	 * @param {string} packageJsonContent The content of the project's package.json.
	 * @param {string} projectDir The project directory. Defaults to the current project directory.
	 * @returns {IProjectData} The project data described by the passed content.
	 */
	abstract getProjectDataFromContent(
		packageJsonContent: string,
		projectDir?: string,
	): IProjectData;

	/**
	 * Serializes the default `nativescript.config` content, optionally merged
	 * with the passed overrides.
	 * @param {Object} data Values to merge on top of the defaults.
	 * @returns {string} The configuration as a JSON string.
	 */
	abstract getNsConfigDefaultContent(data?: Object): string;

	/**
	 * Gives information about the whole assets structure for both iOS and Android.
	 * For each of the platforms, the returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages (only for iOS).
	 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 * @returns {Promise<IAssetsStructure>} An object describing the current asset structure.
	 */
	abstract getAssetsStructure(opts: IProjectDir): Promise<IAssetsStructure>;

	/**
	 * Gives information about the whole assets structure for iOS.
	 * The returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages.
	 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 * @returns {Promise<IAssetGroup>} An object describing the current asset structure for iOS.
	 */
	abstract getIOSAssetsStructure(opts: IProjectDir): Promise<IAssetGroup>;

	/**
	 * Gives information about the whole assets structure for Android.
	 * The returned object will contain icons, splashBackgrounds and splashCenterImages.
	 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 * @returns {Promise<IAssetGroup>} An object describing the current asset structure for Android.
	 */
	abstract getAndroidAssetsStructure(opts: IProjectDir): Promise<IAssetGroup>;

	/**
	 * Returns array with paths to all `.js` or `.ts` files in application's app directory.
	 * @param {string} projectDir Path to application.
	 * @returns {string[]} Array of paths to `.js` or `.ts` files.
	 */
	abstract getAppExecutableFiles(projectDir: string): string[];

	/**
	 * Returns package details for runtime, respecting the nativescript key for legacy projects
	 * @param {string} projectDir Path to application.
	 * @param {string} platform Platform key
	 */
	abstract getRuntimePackage(
		projectDir: string,
		platform: SupportedPlatform,
	): IBasePluginData;

	/**
	 * Returns a value from `nativescript` key in project's package.json.
	 * @param {string} jsonData The project directory - the place where the root package.json is located.
	 * @param {string} propertyName The name of the property to be checked in `nativescript` key.
	 * @returns {any} The value of the property.
	 * @deprecated no longer used - will be removed in 8.0.
	 */
	abstract getNSValueFromContent(jsonData: Object, propertyName: string): any;
}
