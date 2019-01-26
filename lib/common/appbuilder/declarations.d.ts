interface IDeployHelper {
	deploy(platform?: string): Promise<void>;
}

declare module Project {
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
