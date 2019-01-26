interface IDeployHelper {
	deploy(platform?: string): Promise<void>;
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
