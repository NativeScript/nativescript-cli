import { EventEmitter } from "events";
import {
	INativePrepare,
	IValidatePlatformOutput,
	IProjectData,
} from "./project";
import { IBuildPlatformAction } from "./platform";
import { IDebugOptions } from "./debug";
import { IBuildData } from "./build";
import { IEnvOptions } from "../declarations";
import {
	IPlatform,
	IProjectDir,
	IRelease,
	IQrCodeImageData,
	IDictionary,
} from "../common/declarations";

declare global {
	interface ILiveSyncProcessData {
		timer: NodeJS.Timer;
		actionsChain: Promise<any>;
		isStopped: boolean;
		deviceDescriptors: ILiveSyncDeviceDescriptor[];
		currentSyncAction: Promise<any>;
		syncToPreviewApp: boolean;
		platforms: string[];
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
	 * Describes action used whenever building a project.
	 */
	interface IBuildAction {
		/**
		 * @returns {Promise<string>} Path to build artifact (.ipa, .apk or .zip).
		 */
		(): Promise<string>;
	}

	/**
	 * Describes options that can be passed in order to specify the exact location of the built package.
	 */
	interface IOutputDirectoryOptions extends IPlatform {
		/**
		 * Directory where the project is located.
		 */
		projectDir: string;

		/**
		 * Whether the build is for emulator or not.
		 */
		emulator?: boolean;
	}

	/**
	 * Describes information for LiveSync on a device.
	 */
	interface ILiveSyncDeviceDescriptor extends IOptionalDebuggingOptions {
		/**
		 * Device identifier.
		 */
		identifier: string;

		/**
		 * Action that will rebuild the application. The action must return a Promise, which is resolved with at path to build artifact.
		 */
		buildAction: IBuildAction;

		/**
		 * Whether to skip preparing the native platform.
		 */
		skipNativePrepare?: boolean;

		/**
		 * Whether debugging has been enabled for this device or not
		 */
		debuggingEnabled?: boolean;

		/**
		 * Describes the data used for building the application
		 */
		buildData: IBuildData;
	}

	/**
	 * Describes a LiveSync operation.
	 */
	interface ILiveSyncInfo
		extends IProjectDir,
			IEnvOptions,
			IRelease,
			IHasUseHotModuleReloadOption {
		emulator?: boolean;

		/**
		 * Defines if the watcher should be skipped. If not passed, fs.Watcher will be started.
		 */
		skipWatcher?: boolean;

		/**
		 * Forces a build before the initial livesync.
		 */
		clean?: boolean;

		/**
		 * Defines if initial sync will be forced.
		 * In case it is true, transfers all project's directory on device
		 * In case it is false, transfers only changed files.
		 */
		force?: boolean;

		/**
		 * Defines the timeout in seconds {N} CLI will wait to find the inspector socket port from device's logs.
		 * If not provided, defaults to 10seconds.
		 */
		timeout?: string;

		nativePrepare?: INativePrepare;
	}

	interface IHasUseHotModuleReloadOption {
		/**
		 * Defines if the hot module reload should be used.
		 */
		useHotModuleReload: boolean;
	}

	interface ILiveSyncEventData {
		deviceIdentifier: string;
		applicationIdentifier?: string;
		projectDir: string;
		syncedFiles?: string[];
		error?: Error;
		notification?: string;
		isFullSync?: boolean;
	}

	interface IIsEmulator {
		isEmulator: boolean;
	}

	interface IProjectDataComposition {
		projectData: IProjectData;
	}

	/**
	 * Describes LiveSync operations.
	 */
	interface ILiveSyncService extends EventEmitter {
		/**
		 * Starts LiveSync operation by rebuilding the application if necessary and starting watcher.
		 * @param {ILiveSyncDeviceDescriptor[]} deviceDescriptors Describes each device for which we would like to sync the application - identifier, outputPath and action to rebuild the app.
		 * @param {ILiveSyncInfo} liveSyncData Describes the LiveSync operation - for which project directory is the operation and other settings.
		 * @returns {Promise<void>}
		 */
		liveSync(
			deviceDescriptors: ILiveSyncDeviceDescriptor[],
			liveSyncData: ILiveSyncInfo
		): Promise<void>;

		/**
		 * Starts LiveSync operation to Preview app.
		 * @param {IPreviewAppLiveSyncData} data Describes information about the current operation.
		 * @returns {Promise<IQrCodeImageData>} Data of the QR code that should be used to start the LiveSync operation.
		 */
		liveSyncToPreviewApp(
			data: IPreviewAppLiveSyncData
		): Promise<IQrCodeImageData>;

		/**
		 * Stops LiveSync operation for specified directory.
		 * @param {string} projectDir The directory for which to stop the operation.
		 * @param {string[]} @optional deviceIdentifiers Device ids for which to stop the application. In case nothing is passed, LiveSync operation will be stopped for all devices.
		 * @param { shouldAwaitAllActions: boolean } @optional stopOptions Specifies whether we should await all actions.
		 * @returns {Promise<void>}
		 */
		stopLiveSync(
			projectDir: string,
			deviceIdentifiers?: string[],
			stopOptions?: { shouldAwaitAllActions: boolean }
		): Promise<void>;

		/**
		 * Returns the device information for current LiveSync operation of specified project.
		 * In case LiveSync has been started on many devices, but stopped for some of them at a later point,
		 * calling the method after that will return information only for devices for which LiveSync operation is in progress.
		 * @param {string} projectDir The path to project for which the LiveSync operation is executed
		 * @returns {ILiveSyncDeviceDescriptor[]} Array of elements describing parameters used to start LiveSync on each device.
		 */
		getLiveSyncDeviceDescriptors(
			projectDir: string
		): ILiveSyncDeviceDescriptor[];
	}

	/**
	 * Describes settings used when disabling debugging.
	 */
	interface IDisableDebuggingDeviceOptions extends Mobile.IDeviceIdentifier {}

	interface IOptionalDebuggingOptions {
		/**
		 * Optional debug options - can be used to control the start of a debug process.
		 */
		debugOptions?: IDebugOptions;
	}

	interface IEnableDebuggingData
		extends IProjectDir,
			IOptionalDebuggingOptions {
		deviceIdentifiers: string[];
	}

	interface IDisableDebuggingData extends IProjectDir {
		deviceIdentifiers: string[];
	}

	interface IAttachDebuggerData
		extends IProjectDir,
			Mobile.IDeviceIdentifier,
			IOptionalDebuggingOptions,
			IIsEmulator,
			IPlatform,
			IOptionalOutputPath {}

	/**
	 * Describes settings passed to livesync service in order to control event emitting during refresh application.
	 */
	interface IRefreshApplicationSettings {
		shouldSkipEmitLiveSyncNotification: boolean;
		shouldCheckDeveloperDiscImage: boolean;
	}

	interface IConnectTimeoutOption {
		/**
		 * Time to wait for successful connection. Defaults to 30000 miliseconds.
		 */
		connectTimeout?: number;
	}

	interface ILiveSyncWatchInfo
		extends IProjectDataComposition,
			IHasUseHotModuleReloadOption,
			IConnectTimeoutOption {
		filesToRemove: string[];
		filesToSync: string[];
		liveSyncDeviceData: ILiveSyncDeviceDescriptor;
		hmrData: IPlatformHmrData;
		force?: boolean;
	}

	interface ILiveSyncResultInfo extends IHasUseHotModuleReloadOption {
		modifiedFilesData: Mobile.ILocalToDevicePathData[];
		isFullSync: boolean;
		waitForDebugger?: boolean;
		deviceAppData: Mobile.IDeviceAppData;
		didRecover?: boolean;
		forceRefreshWithSocket?: boolean;
	}

	interface IAndroidLiveSyncResultInfo
		extends ILiveSyncResultInfo,
			IAndroidLivesyncSyncOperationResult {}

	interface IFullSyncInfo
		extends IProjectDataComposition,
			IHasUseHotModuleReloadOption,
			IConnectTimeoutOption {
		device: Mobile.IDevice;
		watch: boolean;
		liveSyncDeviceData: ILiveSyncDeviceDescriptor;
		force?: boolean;
	}

	interface IPlatformHmrData {
		hash: string;
		fallbackFiles: string[];
	}

	interface ITransferFilesOptions {
		isFullSync: boolean;
		force?: boolean;
	}

	interface IPlatformLiveSyncService {
		fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo>;
		liveSyncWatchAction(
			device: Mobile.IDevice,
			liveSyncInfo: ILiveSyncWatchInfo
		): Promise<ILiveSyncResultInfo>;
		tryRefreshApplication(
			projectData: IProjectData,
			liveSyncInfo: ILiveSyncResultInfo
		): Promise<boolean>;
		restartApplication(
			projectData: IProjectData,
			liveSyncInfo: ILiveSyncResultInfo
		): Promise<void>;
		shouldRestart(
			projectData: IProjectData,
			liveSyncInfo: ILiveSyncResultInfo
		): Promise<boolean>;
		getDeviceLiveSyncService(
			device: Mobile.IDevice,
			projectData: IProjectData
		): INativeScriptDeviceLiveSyncService;
		getAppData(syncInfo: IFullSyncInfo): Promise<Mobile.IDeviceAppData>;
		syncAfterInstall(
			device: Mobile.IDevice,
			liveSyncInfo: ILiveSyncWatchInfo
		): Promise<void>;
	}

	interface IRestartApplicationInfo {
		didRestart: boolean;
	}

	interface INativeScriptDeviceLiveSyncService {
		/**
		 * Specifies some action that will be executed before every sync operation
		 */
		beforeLiveSyncAction?(deviceAppData: Mobile.IDeviceAppData): Promise<void>;

		/**
		 * Tries to refresh the application's content on the device
		 */
		tryRefreshApplication(
			projectData: IProjectData,
			liveSyncInfo: ILiveSyncResultInfo
		): Promise<boolean>;

		/**
		 * Restarts the specified application
		 */
		restartApplication(
			projectData: IProjectData,
			liveSyncInfo: ILiveSyncResultInfo
		): Promise<void>;

		/**
		 * Returns if the application have to be restarted in order to apply the specified livesync changes
		 */
		shouldRestart(
			projectData: IProjectData,
			liveSyncInfo: ILiveSyncResultInfo
		): Promise<boolean>;

		/**
		 * Removes specified files from a connected device
		 * @param  {Mobile.IDeviceAppData} deviceAppData Data about device and app.
		 * @param  {Mobile.ILocalToDevicePathData[]} localToDevicePaths Object containing a mapping of file paths from the system to the device.
		 * @param  {string} projectFilesPath The Path to the app folder inside platforms folder
		 * @return {Promise<void>}
		 */
		removeFiles(
			deviceAppData: Mobile.IDeviceAppData,
			localToDevicePaths: Mobile.ILocalToDevicePathData[],
			projectFilesPath?: string
		): Promise<void>;

		/**
		 * Transfers specified files to a connected device
		 * @param  {Mobile.IDeviceAppData} deviceAppData Data about device and app.
		 * @param  {Mobile.ILocalToDevicePathData[]} localToDevicePaths Object containing a mapping of file paths from the system to the device.
		 * @param  {string} projectFilesPath The Path to the app folder inside platforms folder
		 * @param  {boolean} isFullSync Indicates if the operation is part of a fullSync
		 * @return {Promise<Mobile.ILocalToDevicePathData[]>} Returns the ILocalToDevicePathData of all transfered files
		 */
		transferFiles(
			deviceAppData: Mobile.IDeviceAppData,
			localToDevicePaths: Mobile.ILocalToDevicePathData[],
			projectFilesPath: string,
			projectData: IProjectData,
			liveSyncDeviceData: ILiveSyncDeviceDescriptor,
			options: ITransferFilesOptions
		): Promise<Mobile.ILocalToDevicePathData[]>;
	}

	interface IAndroidNativeScriptDeviceLiveSyncService
		extends INativeScriptDeviceLiveSyncService {
		/**
		 * Guarantees all remove/update operations have finished
		 * @param  {ILiveSyncResultInfo} liveSyncInfo Describes the LiveSync operation - for which project directory is the operation and other settings.
		 * @return {Promise<IAndroidLiveSyncResultInfo>}
		 */
		finalizeSync(
			liveSyncInfo: ILiveSyncResultInfo,
			projectData: IProjectData
		): Promise<IAndroidLivesyncSyncOperationResult>;
	}

	interface ILiveSyncSocket extends INetSocket {
		uid: string;
		writeAsync(data: Buffer): Promise<Boolean>;
	}

	interface IAndroidLivesyncTool {
		/**
		 * The protocol version the current app(adnroid runtime) is using.
		 */
		protocolVersion: string;

		/**
		 * Creates new socket connection.
		 * @param configuration - The configuration to the socket connection.
		 * @returns {Promise<void>}
		 */
		connect(configuration: IAndroidLivesyncToolConfiguration): Promise<void>;
		/**
		 * Sends a file through the socket.
		 * @param filePath - The full path to the file.
		 * @returns {Promise<void>}
		 */
		sendFile(filePath: string): Promise<void>;
		/**
		 * Sends files through the socket.
		 * @param filePaths - Array of files that will be send by the socket.
		 * @returns {Promise<void>}
		 */
		sendFiles(filePaths: string[]): Promise<void>;
		/**
		 * Sends all files from directory by the socket.
		 * @param directoryPath - The path to the directory which files will be send by the socket.
		 * @returns {Promise<void>}
		 */
		sendDirectory(directoryPath: string): Promise<void>;
		/**
		 * Removes file
		 * @param filePath - The full path to the file.
		 * @returns {Promise<boolean>}
		 */
		removeFile(filePath: string): Promise<void>;
		/**
		 * Removes files
		 * @param filePaths - Array of files that will be removed.
		 * @returns {Promise<boolean[]>}
		 */
		removeFiles(filePaths: string[]): Promise<void>;
		/**
		 * Sends doSyncOperation that will be handled by the runtime.
		 * @param options
		 * @returns {Promise<void>}
		 */
		sendDoSyncOperation(
			options?: IDoSyncOperationOptions
		): Promise<IAndroidLivesyncSyncOperationResult>;
		/**
		 * Generates new operation identifier.
		 */
		generateOperationIdentifier(): string;
		/**
		 * Checks if the current operation is in progress.
		 * @param operationId - The identifier of the operation.
		 */
		isOperationInProgress(operationId: string): boolean;

		/**
		 * Closes the current socket connection.
		 * @param error - Optional error for rejecting pending sync operations
		 */
		end(error?: Error): void;

		/**
		 * Returns true if a connection has been already established
		 */
		hasConnection(): boolean;
	}

	/**
	 * doRefresh - Indicates if the application should be refreshed. Defaults to true.
	 * operationId - The identifier of the operation
	 * timeout - The timeout in milliseconds
	 */
	interface IDoSyncOperationOptions {
		doRefresh?: boolean;
		timeout?: number;
		operationId?: string;
	}

	interface IAndroidLivesyncToolConfiguration extends IConnectTimeoutOption {
		/**
		 * The application identifier.
		 */
		appIdentifier: string;
		/**
		 * The device identifier.
		 */
		deviceIdentifier: string;
		/**
		 * The path to app folder inside platforms folder: platforms/android/app/src/main/assets/app/
		 */
		appPlatformsPath: string;
		/**
		 * If not provided, defaults to 127.0.0.1
		 */
		localHostAddress?: string;
		/**
		 * If provider will call it when an error occurs.
		 */
		errorHandler?: any;
	}

	interface IAndroidLivesyncSyncOperationResult {
		operationId: string;
		didRefresh: boolean;
	}

	interface IDeviceProjectRootOptions {
		appIdentifier: string;
		getDirname?: boolean;
		watch?: boolean;
	}

	interface IDevicePathProvider {
		getDeviceProjectRootPath(
			device: Mobile.IDevice,
			options: IDeviceProjectRootOptions
		): Promise<string>;
		getDeviceSyncZipPath(device: Mobile.IDevice): string;
	}

	/**
	 * Describes additional options, that can be passed to LiveSyncCommandHelper.
	 */
	interface ILiveSyncCommandHelperAdditionalOptions
		extends IBuildPlatformAction,
			INativePrepare {
		/**
		 * A map representing devices which have debugging enabled initially.
		 */
		deviceDebugMap?: IDictionary<boolean>;

		/**
		 * Returns the path to the directory where the build output may be found.
		 * @param {IOutputDirectoryOptions} options Options that are used to determine the build output directory.
		 * @returns {string} The build output directory.
		 */
		getOutputDirectory?(options: IOutputDirectoryOptions): string;
	}

	interface ILiveSyncCommandHelper {
		/**
		 * Method sets up configuration, before calling livesync and expects that devices are already discovered.
		 * @param {Mobile.IDevice[]} devices List of discovered devices
		 * @param {string} platform The platform for which the livesync will be ran
		 * @param {ILiveSyncCommandHelperAdditionalOptions} additionalOptions @optional Additional options to control LiveSync.
		 * @returns {Promise<void>}
		 */
		executeLiveSyncOperation(
			devices: Mobile.IDevice[],
			platform: string,
			additionalOptions?: ILiveSyncCommandHelperAdditionalOptions
		): Promise<void>;
		getPlatformsForOperation(platform: string): string[];

		/**
		 * Validates the given platform's data - bundle identifier, etc.
		 * @param {string} platform The platform to be validated.
		 * @return {Promise<void>}
		 */
		validatePlatform(
			platform: string
		): Promise<IDictionary<IValidatePlatformOutput>>;

		/**
		 * Executes livesync operation. Meant to be called from within a command.
		 * @param {string} platform @optional platform for whith to run the livesync operation
		 * @param {ILiveSyncCommandHelperAdditionalOptions} additionalOptions @optional Additional options to control LiveSync.
		 * @returns {Promise<void>}
		 */
		executeCommandLiveSync(
			platform?: string,
			additionalOptions?: ILiveSyncCommandHelperAdditionalOptions
		): Promise<void>;
		createDeviceDescriptors(
			devices: Mobile.IDevice[],
			platform: string,
			additionalOptions?: ILiveSyncCommandHelperAdditionalOptions
		): Promise<ILiveSyncDeviceDescriptor[]>;
		getDeviceInstances(platform?: string): Promise<Mobile.IDevice[]>;
		getLiveSyncData(projectDir: string): ILiveSyncInfo;
	}

	interface ILiveSyncServiceResolver {
		resolveLiveSyncService(platform: string): IPlatformLiveSyncService;
	}

	interface ILiveSyncProcessDataService {
		getPersistedData(projectDir: string): ILiveSyncProcessData;
		getDeviceDescriptors(projectDir: string): ILiveSyncDeviceDescriptor[];
		getAllPersistedData(): IDictionary<ILiveSyncProcessData>;
		persistData(
			projectDir: string,
			deviceDescriptors: ILiveSyncDeviceDescriptor[],
			platforms: string[]
		): void;
		hasDeviceDescriptors(projectDir: string): boolean;
		getPlatforms(projectDir: string): string[];
	}
}
