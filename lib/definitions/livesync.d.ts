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
		patterns: string[]
	};
	actionsChain: Promise<any>;
	isStopped: boolean;
	deviceDescriptors: ILiveSyncDeviceInfo[];
	currentSyncAction: Promise<any>;
}

interface IOptionalOutputPath {
	/**
	 * Path where the build result is located (directory containing .ipa, .apk or .zip).
	 * This is required for initial checks where LiveSync will skip the rebuild in case there's already a build result and no change requiring rebuild is made since then.
	 * In case it is not passed, the default output for local builds will be used.
	 */
	outputPath?: string;
}

/**
 * Describes information for LiveSync on a device.
 */
interface ILiveSyncDeviceInfo extends IOptionalOutputPath, IOptionalDebuggingOptions {
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
	 * Whether to skip preparing the native platform.
	 */
	skipNativePrepare?: boolean;

	/**
	 * Whether debugging has been enabled for this device or not
	 */
	debugggingEnabled?: boolean;

	/**
	 * Describes options specific for each platform, like provision for iOS, target sdk for Android, etc.
	 */
	platformSpecificOptions?: IPlatformOptions;
}

interface IOptionalSkipWatcher {
	/**
	 * Defines if the watcher should be skipped. If not passed, fs.Watcher will be started.
	 */
	skipWatcher?: boolean;
}

/**
 * Describes a LiveSync operation.
 */
interface ILiveSyncInfo extends IProjectDir, IEnvOptions, IBundle, IRelease, IOptionalSkipWatcher {
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

interface IIsEmulator {
	isEmulator: boolean;
}

interface ILiveSyncBuildInfo extends IIsEmulator, IPlatform {
	pathToBuildItem: string;
}

interface IProjectDataComposition {
	projectData: IProjectData;
}

/**
 * Desribes object that can be passed to ensureLatestAppPackageIsInstalledOnDevice method.
 */
interface IEnsureLatestAppPackageIsInstalledOnDeviceOptions extends IProjectDataComposition, IEnvOptions, IBundle, IRelease, ISkipNativeCheckOptional, IOptionalFilesToRemove, IOptionalFilesToSync {
	device: Mobile.IDevice;
	preparedPlatforms: string[];
	rebuiltInformation: ILiveSyncBuildInfo[];
	deviceBuildInfoDescriptor: ILiveSyncDeviceInfo;
	settings: ILatestAppPackageInstalledSettings;
	liveSyncData?: ILiveSyncInfo;
	modifiedFiles?: string[];
}

/**
 * Describes the action that has been executed during ensureLatestAppPackageIsInstalledOnDevice execution.
 */
interface IAppInstalledOnDeviceResult {
	/**
	 * Defines if the app has been installed on device from the ensureLatestAppPackageIsInstalledOnDevice method.
	 */
	appInstalled: boolean;
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
	 * @param { shouldAwaitAllActions: boolean } @optional stopOptions Specifies whether we should await all actions.
	 * @returns {Promise<void>}
	 */
	stopLiveSync(projectDir: string, deviceIdentifiers?: string[], stopOptions?: { shouldAwaitAllActions: boolean }): Promise<void>;

	/**
	 * Returns the device information for current LiveSync operation of specified project.
	 * In case LiveSync has been started on many devices, but stopped for some of them at a later point,
	 * calling the method after that will return information only for devices for which LiveSync operation is in progress.
	 * @param {string} projectDir The path to project for which the LiveSync operation is executed
	 * @returns {ILiveSyncDeviceInfo[]} Array of elements describing parameters used to start LiveSync on each device.
	 */
	getLiveSyncDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[];
}

/**
 * Describes LiveSync operations while debuggging.
 */
interface IDebugLiveSyncService extends ILiveSyncService {
	/**
	 * Method used to retrieve the glob patterns which CLI will watch for file changes. Defaults to the whole app directory.
	 * @param {ILiveSyncInfo} liveSyncData Information needed for livesync - for example if bundle is passed or if a release build should be performed.
	 * @returns {Promise<string[]>} The glob patterns.
	 */
	getWatcherPatterns(liveSyncData: ILiveSyncInfo, projectData: IProjectData): Promise<string[]>;

	/**
	 * Prints debug information.
	 * @param {IDebugInformation} debugInformation Information to be printed.
	 * @returns {IDebugInformation} Full url and port where the frontend client can be connected.
	 */
	printDebugInformation(debugInformation: IDebugInformation): IDebugInformation;

	/**
	 * Enables debugging for the specified devices
	 * @param {IEnableDebuggingDeviceOptions[]} deviceOpts Settings used for enabling debugging for each device.
	 * @param {IDebuggingAdditionalOptions} enableDebuggingOptions Settings used for enabling debugging.
	 * @returns {Promise<IDebugInformation>[]} Array of promises for each device.
	 */
	enableDebugging(deviceOpts: IEnableDebuggingDeviceOptions[], enableDebuggingOptions: IDebuggingAdditionalOptions): Promise<IDebugInformation>[];

	/**
	 * Disables debugging for the specified devices
	 * @param {IDisableDebuggingDeviceOptions[]} deviceOptions Settings used for disabling debugging for each device.
	 * @param {IDebuggingAdditionalOptions} debuggingAdditionalOptions Settings used for disabling debugging.
	 * @returns {Promise<void>[]} Array of promises for each device.
	 */
	disableDebugging(deviceOptions: IDisableDebuggingDeviceOptions[], debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<void>[];

	/**
	 * Attaches a debugger to the specified device.
	 * @param {IAttachDebuggerOptions} settings Settings used for controling the attaching process.
	 * @returns {Promise<IDebugInformation>} Full url and port where the frontend client can be connected.
	 */
	attachDebugger(settings: IAttachDebuggerOptions): Promise<IDebugInformation>;
}

/**
 * Describes additional debugging settings.
 */
interface IDebuggingAdditionalOptions extends IProjectDir { }

/**
 * Describes settings used when disabling debugging.
 */
interface IDisableDebuggingDeviceOptions extends Mobile.IDeviceIdentifier { }

interface IOptionalDebuggingOptions {
	/**
	 * Optional debug options - can be used to control the start of a debug process.
	*/
	debugOptions?: IDebugOptions;
}

/**
 * Describes settings used when enabling debugging.
 */
interface IEnableDebuggingDeviceOptions extends Mobile.IDeviceIdentifier, IOptionalDebuggingOptions { }

/**
 * Describes settings passed to livesync service in order to control event emitting during refresh application.
 */
interface IShouldSkipEmitLiveSyncNotification {
	/**
 	* Whether to skip emitting an event during refresh. Default is false.
 	*/
	shouldSkipEmitLiveSyncNotification: boolean;
}

/**
 * Describes settings used for attaching a debugger.
 */
interface IAttachDebuggerOptions extends IDebuggingAdditionalOptions, IEnableDebuggingDeviceOptions, IIsEmulator, IPlatform, IOptionalOutputPath {
}

interface ILiveSyncWatchInfo extends IProjectDataComposition {
	filesToRemove: string[];
	filesToSync: string[];
	isReinstalled: boolean;
	syncAllFiles: boolean;
	useLiveEdit?: boolean;
}

interface ILiveSyncResultInfo {
	modifiedFilesData: Mobile.ILocalToDevicePathData[];
	isFullSync: boolean;
	deviceAppData: Mobile.IDeviceAppData;
	useLiveEdit?: boolean;
}

interface IFullSyncInfo extends IProjectDataComposition {
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

interface ILiveSyncCommandHelper {
	/**
	 * Method sets up configuration, before calling livesync and expects that devices are already discovered.
	 * @param {Mobile.IDevice[]} devices List of discovered devices
	 * @param {string} platform The platform for which the livesync will be ran
	 * @param {IDictionary<boolean>} deviceDebugMap @optional A map representing devices which have debugging enabled initially.
	 * @returns {Promise<void>}
	 */
	executeLiveSyncOperation(devices: Mobile.IDevice[], platform: string, deviceDebugMap?: IDictionary<boolean>): Promise<void>;
	getPlatformsForOperation(platform: string): string[];
}
