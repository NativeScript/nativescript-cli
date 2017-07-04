// This interface is a mashup of NodeJS' along with Chokidar's event watchers
interface IFSWatcher extends NodeJS.EventEmitter {
	// from fs.FSWatcher
	close(): void;

	/**
	 * events.EventEmitter
	 *   1. change
	 *   2. error
	 */
	addListener(event: string, listener: Function): this;
	addListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
	addListener(event: "error", listener: (code: number, signal: string) => void): this;

	on(event: string, listener: Function): this;
	on(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
	on(event: "error", listener: (code: number, signal: string) => void): this;

	once(event: string, listener: Function): this;
	once(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
	once(event: "error", listener: (code: number, signal: string) => void): this;

	prependListener(event: string, listener: Function): this;
	prependListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
	prependListener(event: "error", listener: (code: number, signal: string) => void): this;

	prependOnceListener(event: string, listener: Function): this;
	prependOnceListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
	prependOnceListener(event: "error", listener: (code: number, signal: string) => void): this;

	// From chokidar FSWatcher

	/**
     * Add files, directories, or glob patterns for tracking. Takes an array of strings or just one
     * string.
     */
	add(paths: string | string[]): void;

    /**
     * Stop watching files, directories, or glob patterns. Takes an array of strings or just one
     * string.
     */
	unwatch(paths: string | string[]): void;

    /**
     * Returns an object representing all the paths on the file system being watched by this
     * `FSWatcher` instance. The object's keys are all the directories (using absolute paths unless
     * the `cwd` option was used), and the values are arrays of the names of the items contained in
     * each directory.
     */
	getWatched(): IDictionary<string[]>;

    /**
     * Removes all listeners from watched files.
     */
	close(): void;
}

interface ILiveSyncProcessInfo {
	timer: NodeJS.Timer;
	watcherInfo: {
		watcher: IFSWatcher,
		pattern: string | string[]
	};
	actionsChain: Promise<any>;
	isStopped: boolean;
	deviceDescriptors: ILiveSyncDeviceInfo[];
}

/**
 * Describes information for LiveSync on a device.
 */
interface ILiveSyncDeviceInfo {
	/**
	 * Device identifier.
	 */
	identifier: string;

	/**
	 * Action that will rebuild the application. The action must return a Promise, which is resolved with at path to build artifact.
	 * @returns {Promise<string>} Path to build artifact (.ipa, .apk or .zip).
	 */
	buildAction: () => Promise<string>;

	/**
	 * Path where the build result is located (directory containing .ipa, .apk or .zip).
	 * This is required for initial checks where LiveSync will skip the rebuild in case there's already a build result and no change requiring rebuild is made since then.
	 * In case it is not passed, the default output for local builds will be used.
	 */
	outputPath?: string;
}

/**
 * Describes a LiveSync operation.
 */
interface ILiveSyncInfo {
	/**
	 * Directory of the project that will be synced.
	 */
	projectDir: string;

	/**
	 * Defines if the watcher should be skipped. If not passed, fs.Watcher will be started.
	 */
	skipWatcher?: boolean;

	/**
	 * Defines if all project files should be watched for changes. In case it is not passed, only `app` dir of the project will be watched for changes.
	 * In case it is set to true, the package.json of the project and node_modules directory will also be watched, so any change there will be transferred to device(s).
	 */
	watchAllFiles?: boolean;

	/**
	 * Defines if the liveEdit functionality should be used, i.e. LiveSync of .js files without restart.
	 * NOTE: Currently this is available only for iOS.
	 */
	useLiveEdit?: boolean;

	/**
	 * Forces a build before the initial livesync.
	 */
	clean?: boolean;
}

interface ILatestAppPackageInstalledSettings extends IDictionary<IDictionary<boolean>> { /* empty */ }

interface ILiveSyncBuildInfo {
	platform: string;
	isEmulator: boolean;
	pathToBuildItem: string;
}

/**
 * Desribes object that can be passed to ensureLatestAppPackageIsInstalledOnDevice method.
 */
interface IEnsureLatestAppPackageIsInstalledOnDeviceOptions {
	device: Mobile.IDevice;
	preparedPlatforms: string[];
	rebuiltInformation: ILiveSyncBuildInfo[];
	projectData: IProjectData;
	deviceBuildInfoDescriptor: ILiveSyncDeviceInfo;
	settings: ILatestAppPackageInstalledSettings;
	liveSyncData?: ILiveSyncInfo;
	modifiedFiles?: string[];
}

/**
 * Describes LiveSync operations.
 */
interface ILiveSyncService {
	/**
	 * Starts LiveSync operation by rebuilding the application if necessary and starting watcher.
	 * @param {ILiveSyncDeviceInfo[]} deviceDescriptors Describes each device for which we would like to sync the application - identifier, outputPath and action to rebuild the app.
	 * @param {ILiveSyncInfo} liveSyncData Describes the LiveSync operation - for which project directory is the operation and other settings.
	 * @returns {Promise<void>}
	 */
	liveSync(deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void>;

	/**
	 * Stops LiveSync operation for specified directory.
	 * @param {string} projectDir The directory for which to stop the operation.
	 * @param {string[]} @optional deviceIdentifiers Device ids for which to stop the application. In case nothing is passed, LiveSync operation will be stopped for all devices.
	 * @returns {Promise<void>}
	 */
	stopLiveSync(projectDir: string, deviceIdentifiers?: string[]): Promise<void>;
}

/**
 * Describes LiveSync operations while debuggging.
 */
interface IDebugLiveSyncService extends ILiveSyncService {
	/**
	 * Prints debug information.
	 * @param {string[]} information Array of information to be printed. Note that false-like values will be stripped from the array.
	 * @returns {void}
	 */
	printDebugInformation(information: string): void;
}

interface ILiveSyncWatchInfo {
	projectData: IProjectData;
	filesToRemove: string[];
	filesToSync: string[];
	isRebuilt: boolean;
	syncAllFiles: boolean;
	useLiveEdit?: boolean;
}

interface ILiveSyncResultInfo {
	modifiedFilesData: Mobile.ILocalToDevicePathData[];
	isFullSync: boolean;
	deviceAppData: Mobile.IDeviceAppData;
	useLiveEdit?: boolean;
}

interface IFullSyncInfo {
	projectData: IProjectData;
	device: Mobile.IDevice;
	watch: boolean;
	syncAllFiles: boolean;
	useLiveEdit?: boolean;
}

interface IPlatformLiveSyncService {
	fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo>;
	liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<ILiveSyncResultInfo>;
	refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void>;
}

interface INativeScriptDeviceLiveSyncService extends IDeviceLiveSyncServiceBase {
	/**
	 * Refreshes the application's content on a device
	 * @param  {Mobile.IDeviceAppData} deviceAppData Information about the application and the device.
	 * @param  {Mobile.ILocalToDevicePathData[]} localToDevicePaths Object containing a mapping of file paths from the system to the device.
	 * @param  {boolean} forceExecuteFullSync If this is passed a full LiveSync is performed instead of an incremental one.
	 * @param  {IProjectData} projectData Project data.
	 * @return {Promise<void>}
	 */
	refreshApplication(projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo): Promise<void>;

	/**
	 * Removes specified files from a connected device
	 * @param  {Mobile.IDeviceAppData} deviceAppData Data about device and app.
	 * @param  {Mobile.ILocalToDevicePathData[]} localToDevicePaths Object containing a mapping of file paths from the system to the device.
	 * @return {Promise<void>}
	 */
	removeFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void>;
}

interface IAndroidNativeScriptDeviceLiveSyncService {
	/**
	 * Retrieves the android device's hash service.
	 * @param  {string} appIdentifier Application identifier.
	 * @return {Promise<Mobile.IAndroidDeviceHashService>} The hash service
	 */
	getDeviceHashService(appIdentifier: string): Mobile.IAndroidDeviceHashService;
}

interface IDeviceProjectRootOptions {
	appIdentifier: string;
	getDirname?: boolean;
	syncAllFiles?: boolean;
	watch?: boolean;
}

interface IDevicePathProvider {
	getDeviceProjectRootPath(device: Mobile.IDevice, options: IDeviceProjectRootOptions): Promise<string>;
	getDeviceSyncZipPath(device: Mobile.IDevice): string;
}
