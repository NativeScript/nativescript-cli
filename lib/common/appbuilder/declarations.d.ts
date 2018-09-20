interface ILiveSyncDeviceAppData extends Mobile.IDeviceAppData {
	liveSyncFormat: string;
	encodeLiveSyncHostUri(hostUri: string): string;
	getLiveSyncNotSupportedError(): string;
}

interface IDeployHelper {
	deploy(platform?: string): Promise<void>;
}

declare module Project {
	interface IConstants {
		ADDITIONAL_FILES_DIRECTORY: string;
		ADDITIONAL_FILE_DISPOSITION: string;
		APPBUILDER_PROJECT_PLATFORMS_NAMES: IDictionary<string>;
		APPIDENTIFIER_PROPERTY_NAME: string;
		CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME: string;
		CORE_PLUGINS_PROPERTY_NAME: string;
		DEBUG_CONFIGURATION_NAME: string;
		DEBUG_PROJECT_FILE_NAME: string;
		EXPERIMENTAL_TAG: string;
		IMAGE_DEFINITIONS_FILE_NAME: string;
		IONIC_PROJECT_PLATFORMS_NAMES: IDictionary<string>;
		NATIVESCRIPT_APP_DIR_NAME: string;
		PACKAGE_JSON_NAME: string;
		PROJECT_FILE: string;
		PROJECT_IGNORE_FILE: string;
		BUILD_RESULT_DISPOSITION: string;
		REFERENCES_FILE_NAME: string;
		OLD_REFERENCES_FILE_NAME: string;
		RELEASE_CONFIGURATION_NAME: string;
		RELEASE_PROJECT_FILE_NAME: string;
		ANDROID_PLATFORM_NAME: string;
		IOS_PLATFORM_NAME: string;
		WP8_PLATFORM_NAME: string;
		TSCONFIG_JSON_NAME: string;
	}

	interface ICapabilities {
		build: boolean;
		buildCompanion: boolean;
		deploy: boolean
		simulate: boolean;
		livesync: boolean;
		livesyncCompanion: boolean;
		updateKendo: boolean;
		emulate: boolean;
		publish: boolean;
		uploadToAppstore: boolean;
		canChangeFrameworkVersion: boolean;
		imageGeneration: boolean;
		wp8Supported: boolean;
	}

	interface IData extends IDictionary<any> {
		ProjectName: string;
		ProjectGuid: string;
		projectVersion: number;
		AppIdentifier: string;
		DisplayName: string;
		Author: string;
		Description: string;
		BundleVersion: string;
		Framework: string;
		FrameworkVersion: string;
		CorePlugins: string[];
		AndroidPermissions: string[];
		DeviceOrientations: string[];
		AndroidHardwareAcceleration: string;
		AndroidVersionCode: string;
		iOSStatusBarStyle: string;
		iOSDeviceFamily: string[];
		iOSBackgroundMode: string[];
		iOSDeploymentTarget: string;
		WP8ProductID: string;
		WP8PublisherID: string;
		WP8Publisher: string;
		WP8TileTitle: string;
		WP8Capabilities: string[];
		WP8Requirements: string[];
		WP8SupportedResolutions: string[];
		WPSdk?: string;
		WP8PackageIdentityName?: string;
		WP8WindowsPublisherName?: string;
		CordovaPluginVariables?: any;
	}

	interface IProjectBase {
		projectDir: string;

		/**
		 * Determines path to project dir.
		 * @returns {string} Path to project directory.
		 */
		getProjectDir(): string;

		projectData: IData;
		/**
		 * Describes whether the project has separate debug/release build configurations.
		 * @type {boolean}
		 */
		hasBuildConfigurations: boolean;
		capabilities: ICapabilities;
		/**
		 * Information about the current project.
		 * @type {Project.IProjectInformation}
		 */
		projectInformation: Project.IProjectInformation;

		/**
		 * Gets the app identifier which is going to be used to build the application.
		 * @parameter Optional parameter the platform for which the app identifier will be returned.
		 * @return {string} the app identifier which will be used to build the application.
		 */
		getAppIdentifierForPlatform(platform?: string): string;
	}

	/**
	 * Describes information gathered about the current project.
	 */
	interface IProjectInformation {
		/**
		 * The data parsed from the project's configuration file
		 * @type {Project.IData}
		 */
		projectData: Project.IData;
		/**
		 * Data parsed from the project's configuration specific configuration files(e.g. .debug.abproject, .test.abproject, etc.).
		 * @type {IDictionary<Project.IData>}
		 */
		configurationSpecificData: IDictionary<Project.IData>;
		/**
		 * Whether or not the project has separate debug/release build configurations.
		 * @type {boolean}
		 */
		hasBuildConfigurations: boolean;
		/**
		 * The project's configurations - usually only debug and release, but the user may specify more by creating multiple custom configuration files.
		 * @type {string[]}
		 */
		configurations: string[];
	}
}

interface IPathFilteringService {
	getRulesFromFile(file: string): string[];
	filterIgnoredFiles(files: string[], rules: string[], rootDir: string): string[];
	isFileExcluded(file: string, rules: string[], rootDir: string): boolean
}

/**
 * Describes available methods for LiveSync operation from Proton.
 */
interface IProtonLiveSyncService {
	/**
	 * Sends files to specified devices.
	 * @param {IDeviceLiveSyncInfo[]} deviceDescriptors Descriptions of the devices, which includes device identifiers and what should be synced.
	 * @param {string} projectDir Project directory.
	 * @param {string[]} filePaths Passed only in cases when only some of the files must be synced.
	 * @return {IDeviceLiveSyncResult[]} Information about each LiveSync operation.
	 */
	livesync(deviceDescriptors: IDeviceLiveSyncInfo[], projectDir: string, filePaths?: string[]): Promise<IDeviceLiveSyncResult>[];
}

/**
 * Describes the result of a single livesync operation started by Proton.
 */
interface ILiveSyncOperationResult {
	/**
	 * Defines if the operation is successful (set to true) or not (value is false).
	 */
	isResolved: boolean;

	/**
	 * Error when livesync operation fails. If `isResolved` is true, error will be undefined.
	 */
	error?: Error;
}

/**
 * Describes result of all LiveSync operations per device.
 */
interface IDeviceLiveSyncResult {
	/**
	 * Identifier of the device.
	 */
	deviceIdentifier: string;

	/**
	 * Result of LiveSync operation for application.
	 */
	liveSyncToApp?: ILiveSyncOperationResult;

	/**
	 * Result of LiveSync operation to companion app.
	 */
	liveSyncToCompanion?: ILiveSyncOperationResult;
}

/**
 * Describes device's LiveSync information.
 */
interface IDeviceLiveSyncInfo {
	/**
	 * Unique identifier of the device.
	 */
	deviceIdentifier: string;

	/**
	 * Defines if changes have to be synced to installed application.
	 */
	syncToApp: boolean;

	/**
	 * Defines if changes have to be synced to companion app.
	 */
	syncToCompanion: boolean;
}

/**
 * Describes if LiveSync is supported for specific device and application.
 */
interface ILiveSyncSupportedInfo extends Mobile.IDeviceApplicationInformationBase {
	/**
	 * Result, indicating is livesync supported for specified device and specified application.
	 * `true` in case livesync is supported and false otherwise.
	 */
	isLiveSyncSupported: boolean;
}

/**
 * Describes if LiveSync is supported for specific device and application.
 */
interface IAppInstalledInfo extends ILiveSyncSupportedInfo {
	/**
	 * Defines if application is installed on device.
	 */
	isInstalled: boolean;
}

/**
 * Describes information about Telerik Companion Apps.
 */
interface ICompanionAppsService {
	/**
	 * Returns application identifier of the companion app for specified platform and framework.
	 * @param {string} framework The framework for which Companion app identfier should be checked. Valid values are cordova and nativescript
	 * @param {string} platform The device platform. Valid values are android, ios and wp8.
	 * @return {string} Companion appIdentifier or null.
	 */
	getCompanionAppIdentifier(framework: string, platform: string): string;

	/**
	 * Returns all companion application identifiers in a dictionary where the top level keys are framwork identifiers.
	 * For each framework there are three values, specified in a dictionary. The keys of the dictionary are platforms (android, ios and wp8).
	 * @return {IDictionary<IStringDictionary>} Companion appIdentifiers separated in different properties of object.
	 */
	getAllCompanionAppIdentifiers(): IDictionary<IStringDictionary>;
}

/**
 * Describes information for single npm dependency that has to be installed.
 */
interface INpmDependency {
	/**
	 * Name of the dependency.
	 */
	name: string;

	/**
	 * @optional The version of the dependency that has to be installed.
	 */
	version?: string;

	/**
	 * Defines if @types/<name> should be installed as well.
	 */
	installTypes: boolean;
}


/**
 * Describes the result of npm install <dependency> and npm install @types/<dependency> command.
 */
interface INpmInstallDependencyResult {
	/**
	 * Defines if the dependency is installed successfully.
	 */
	isInstalled: boolean;
	/**
	 * Defines if the @types/<dependency> is installed successfully.
	 */
	isTypesInstalled: boolean;
}

/**
 * Describes the result of npm install command.
 */
interface INpmInstallResult {
	/**
	 * The result of installing a single dependency.
	 */
	result?: INpmInstallDependencyResult,

	/**
	 * The error that occurred during the operation.
	 */
	error?: Error;
}

/**
 * Describes methods for working with npm.
 */
interface INpmService {
	/**
	 * Uninstalls the dependency and the @types/<dependency> devDependency.
	 * The method will remove them from package.json and from node_modules dir.
	 * @param {string} projectDir Directory of the project, where package.json is located.
	 * @param {string} dependency The name of the dependency that has to be removed.
	 * @return {Promise<void>}
	 */
	uninstall(projectDir: string, dependency: string): Promise<void>;

	/**
	 * Installs everything from package.json or specified dependency.
	 * In case there's information which dependency to install, the method will check it and install only this dependency and possibly its @types.
	 * @param {string} projectDir Directory of the project, where package.json is located.
	 * @param @optional {INpmDependency} dependency Description of the dependency that has to be installed.
	 * @return {Promise<INpmInstallResult>} Returns object that will have error in case something fails.
	 * In case there's no specific dependency that has to be installed and everything is installed successfully, the result will be empty object.
	 * In case there's dependency that has to be installed, the result object will contain information for the successfull installation of the dependency and the @types reference.
	 */
	install(projectDir: string, dependencyToInstall?: INpmDependency): Promise<INpmInstallResult>;

	/**
	 * Searches for plugins in npm.
	 * @param {string} projectDir The project directory.
	 * @param {string[]} keywords The keywords for the search.
	 * @param @optional {string[]} args Additional flags for the npm search command.
	 * @return {Promise<IBasicPluginInformation[]>} Array of basic plugin information for the search results.
	 */
	search(projectDir: string, keywords: string[], args?: string[]): Promise<IBasicPluginInformation[]>;

	/**
	 * Gets package.json of a specific dependency from registry.npmjs.org.
	 * @param {string} packageName The name of the dependency.
	 * @param {string} version The version that has to be taken from registry. "latest" will be used in case there's no version passed.
	 * @return {any} package.json of a dependency or null in case such dependency or version does not exist.
	 */
	getPackageJsonFromNpmRegistry(packageName: string, version?: string): Promise<any>;

	/**
	 * Checks if dependency is scoped.
	 * @param {string} dependency The dependency to check.
	 * @return {boolean} true if the dependency is scoped and false if it's not.
	 */
	isScopedDependency(dependency: string): boolean;

	/**
	 * Gets the name of dependency and the version if it is specified.
	 * @param {string} dependency The dependency to check.
	 * @return {IScopedDependencyInformation} the name of the dependency and the version if it is specified.
	*/
	getDependencyInformation(dependency: string): IDependencyInformation;
}

/**
 * Describes methods for searching for npm plugins.
 */
interface INpmPluginsService {
	/**
	 * Searches for plugins in http://npmjs.org, if this search fails will try to find plugin in http://registry.npmjs.org.
	 * If this search does not find anything this method will use the npm binary.
	 * @param {string} projectDir The directory of the project.
	 * @param {string[]} keywords The keywords for the search.
	 * @param @optional {(keywords: string[]) => string[]} modifySearchQuery Function which will be used to modify the search query when using the npm binary.
	 * @return {Promise<IPluginsSource>} The plugins source which can be used to get the result.
	 */
	search(projectDir: string, keywords: string[], modifySearchQuery?: (keywords: string[]) => string[]): Promise<IPluginsSource>;

	/**
	 * Searches for plugin in http://registry.npmjs.org plugins and if plugin is not found will continue the search in http://npmjs.org and the npm binary.
	 * @param {string} projectDir The directory of the project.
	 * @param {string[]} keywords The keywords for the search.
	 * @param @optional {(keywords: string[]) => string[]} modifySearchQuery Function which will be used to modify the search query when using the npm binary.
	 * @return {Promise<IPluginsSource>} The plugins source which can be used to get the result.
	 */
	optimizedSearch(projectDir: string, keywords: string[], modifySearchQuery?: (keywords: string[]) => string[]): Promise<IPluginsSource>;
}
