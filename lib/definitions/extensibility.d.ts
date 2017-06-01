/**
 * Describes each extension.
 */
interface IExtensionData {
	/**
	 * The name of the extension.
	 */
	extensionName: string;
}

/**
 * Defines methods for working with CLI's extensions.
 */
interface IExtensibilityService {
	/**
	 * Installs a specified extension.
	 * @param {string} extensionName Name of the extension to be installed. It may contain version as well, i.e. myPackage, myPackage@1.0.0,
	 * myPackage.tgz, https://github.com/myOrganization/myPackage/tarball/master, https://github.com/myOrganization/myPackage, etc.
	 * @returns {Promise<IExtensionData>} Information about installed extensions.
	 */
	installExtension(extensionName: string): Promise<IExtensionData>;

	/**
	 * Uninstalls extension from the installation.
	 * @param {string} extensionName Name of the extension to be uninstalled.
	 * @returns {Promise<void>}
	 */
	uninstallExtension(extensionName: string): Promise<void>;

	/**
	 * Loads all extensions, so their methods and commands can be used from CLI.
	 * For each of the extensions, a new Promise is returned. It will be rejected in case the extension cannot be loaded. However other promises will not be reflected by this failure.
	 * In case a promise is rejected, the error will have additional property (extensionName) that shows which is the extension that cannot be loaded in the process.
	 * @returns {Promise<IExtensionData>[]} Array of promises, each is resolved with information about loaded extension.
	 */
	loadExtensions(): Promise<IExtensionData>[];

	/**
	 * Loads a single extension, so its methods and commands can be used from CLI.
	 * @param {string} extensionName Name of the extension to be installed. It may contain version as well, i.e. myPackage, myPackage@1.0.0
	 * A Promise is returned. It will be rejected in case the extension cannot be loaded.
	 * @returns {Promise<IExtensionData>} Promise, resolved with IExtensionData.
	 */
	loadExtension(extensionName: string): Promise<IExtensionData>;

	/**
	 * Gets information about installed dependencies - names and versions.
	 * @returns {IStringDictionary}
	 */
	getInstalledExtensions(): IStringDictionary;
}

/**
 * Describes the error that will be raised when a problem with extension is detected.
 */
interface IExtensionLoadingError extends Error, IExtensionData { }