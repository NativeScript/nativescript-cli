/**
 * Describes information for starting debug process.
 */
interface IDebugData extends Mobile.IDeviceIdentifier {
	/**
	 * Application identifier of the app that it will be debugged.
	 */
	applicationIdentifier: string;

	/**
	 * Path to .app built for iOS Simulator.
	 */
	pathToAppPackage?: string;

	/**
	 * The name of the application, for example `MyProject`.
	 */
	projectName?: string;

	/**
	 * Path to project.
	 */
	projectDir?: string;
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
	 * Defines if debug process is for emulator (not for real device).
	 */
	emulator?: boolean;

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
}

/**
 * Describes methods to create debug data object used by other methods.
 */
interface IDebugDataService {
	/**
	 * Creates the debug data based on specified options.
	 * @param {IProjectData} projectData The data describing project that will be debugged.
	 * @param {IOptions} options The options based on which debugData will be created
	 * @returns {IDebugData} Data describing the required information for starting debug process.
	 */
	createDebugData(projectData: IProjectData, options: IDeviceIdentifier): IDebugData;
}

/**
 * Describes methods for debug operation.
 */
interface IDebugServiceBase extends NodeJS.EventEmitter {
	/**
	 * Starts debug operation based on the specified debug data.
	 * @param {IDebugData} debugData Describes information for device and application that will be debugged.
	 * @param {IDebugOptions} debugOptions Describe possible options to modify the behaivor of the debug operation, for example stop on the first line.
	 * @returns {Promise<IDebugInformation>} Device Identifier, full url and port where the frontend client can be connected.
	 */
	debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugInformation>;
}

interface IDebugService extends IDebugServiceBase {
	/**
	 * Stops debug operation for a specific device.
	 * @param {string} deviceIdentifier Identifier of the device fo which debugging will be stopped.
	 * @returns {Promise<void>}
	 */
	debugStop(deviceIdentifier: string): Promise<void>;
}

/**
 * Describes actions required for debugging on specific platform (Android or iOS).
 */
interface IPlatformDebugService extends IPlatform, NodeJS.EventEmitter {
	/**
	 * Starts debug operation.
	 * @param {IDebugData} debugData Describes information for device and application that will be debugged.
	 * @param {IDebugOptions} debugOptions Describe possible options to modify the behaivor of the debug operation, for example stop on the first line.
	 * @returns {Promise<void>}
	 */
	debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void>;

	/**
	 * Stops debug operation.
	 * @returns {Promise<void>}
	 */
	debugStop(): Promise<void>;

	/**
	 * Starts debug operation based on the specified debug data.
	 * @param {IDebugData} debugData Describes information for device and application that will be debugged.
	 * @param {IDebugOptions} debugOptions Describe possible options to modify the behaivor of the debug operation, for example stop on the first line.
	 * @returns {Promise<string>} Full url where the frontend client may be connected.
	 */
	debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string>;
}
