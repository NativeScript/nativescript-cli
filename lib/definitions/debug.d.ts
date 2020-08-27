import { IProjectData } from "./project";
import { IDebugInformation } from "../declarations";
import { IProjectDir, IPlatform } from "../common/declarations";

interface IDebugData
	extends IProjectDir,
		Mobile.IDeviceIdentifier,
		IOptionalDebuggingOptions {
	applicationIdentifier: string;
	projectName?: string;
}

/**
 * Describes all options that define the behavior of debug.
 */
interface IDebugOptions {
	/**
	 * Defines if Chrome DevTools should be used for debugging.
	 */
	chrome?: boolean;

	/**
	 * Defines if thе application is already started on device.
	 */
	start?: boolean;

	/**
	 * Defines if we should stop the currently running debug process.
	 */
	stop?: boolean;

	/**
	 * Defines if the debug process should break on the first line.
	 */
	debugBrk?: boolean;

	/**
	 * Defines if the debug process will not have a client attached (i.e. the process will be started, but NativeScript Inspector will not be started and it will not attach to the running debug process).
	 */
	client?: boolean;

	/**
	 * Defines if the process will watch for further changes in the project and transferrs them to device immediately, resulting in restar of the debug process.
	 */
	justlaunch?: boolean;

	/**
	 * Defines if bundled Chrome DevTools should be used or specific commit.
	 * Default value is true for Android and false for iOS.
	 */
	useBundledDevTools?: boolean;

	/**
	 * Defines if https://chrome-devtools-frontend.appspot.com should be used instead of chrome-devtools://devtools
	 * In case it is passed, the value of `useBundledDevTools` is disregarded.
	 * Default value is false.
	 */
	useHttpUrl?: boolean;

	/**
	 * Defines the commit that will be used in cases where remote protocol is required.
	 * For Android this is the case when useHttpUrl is set to true or useBundledDevTools is set to false.
	 * For iOS the value is used by default and when useHttpUrl is set to true.
	 * Default value is 02e6bde1bbe34e43b309d4ef774b1168d25fd024 which corresponds to 55.0.2883 Chrome version
	 */
	devToolsCommit?: string;

	/**
	 * Defines if the iOS App Inspector should be used instead of providing URL to debug the application with Chrome DevTools
	 */
	inspector?: boolean;
	/**
	 * Defines if should print all availableDevices
	 */
	availableDevices?: boolean;
	/**
	 * Defines the timeout in seconds {N} CLI will wait to find the inspector socket port from device's logs.
	 * If not provided, defaults to 10 seconds.
	 */
	timeout?: string;
	/**
	 * The sdk version of the emulator.
	 */
	sdk?: string;
	/**
	 * Forces the debugger attach event to be emitted.
	 */
	forceDebuggerAttachedEvent?: boolean;
}

/**
 * Describes methods to create debug data object used by other methods.
 */
interface IDebugDataService {
	/**
	 * Creates the debug data based on specified options.
	 * @param {string} deviceIdentifier The identifier of the device
	 * @param {IProjectData} projectData The data describing project that will be debugged.
	 * @param {IDebugOptions} debugOptions The debug options
	 * @returns {IDebugData} Data describing the required information for starting debug process.
	 */
	getDebugData(
		deviceIdentifier: string,
		projectData: IProjectData,
		debugOptions: IDebugOptions
	): IDebugData;
}

/**
 * Describes actions required for debugging on specific platform (Android or iOS).
 */
interface IDeviceDebugService extends IPlatform, NodeJS.EventEmitter {
	/**
	 * Stops debug operation.
	 * @returns {Promise<void>}
	 */
	debugStop(): Promise<void>;

	/**
	 * Starts debug operation based on the specified debug data.
	 * @param {IAppDebugData} debugData Describes information for application that will be debugged.
	 * @param {IDebugOptions} debugOptions Describe possible options to modify the behaivor of the debug operation, for example stop on the first line.
	 * @returns {Promise<string>} Full url where the frontend client may be connected.
	 */
	debug(
		debugData: IAppDebugData,
		debugOptions: IDebugOptions
	): Promise<IDebugResultInfo>;
}

interface IDebugResultInfo {
	debugUrl: string;
}

interface IAppDebugData extends IProjectDir {
	/**
	 * Application identifier of the app that it will be debugged.
	 */
	applicationIdentifier: string;

	/**
	 * The name of the application, for example `MyProject`.
	 */
	projectName?: string;
}

interface IDebugController {
	startDebug(debugData: IDebugData): Promise<IDebugInformation>;
	stopDebug(deviceIdentifier: string): Promise<void>;
	printDebugInformation(
		debugInformation: IDebugInformation,
		fireDebuggerAttachedEvent?: boolean
	): IDebugInformation;
	enableDebuggingCoreWithoutWaitingCurrentAction(
		projectDir: string,
		deviceIdentifier: string,
		debugOptions: IDebugOptions
	): Promise<IDebugInformation>;
	enableDebugging(
		enableDebuggingData: IEnableDebuggingData
	): Promise<IDebugInformation>[];
	disableDebugging(disableDebuggingData: IDisableDebuggingData): Promise<void>;
	attachDebugger(
		attachDebuggerData: IAttachDebuggerData
	): Promise<IDebugInformation>;
}
