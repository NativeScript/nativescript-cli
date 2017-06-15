/**
 * Describes information for starting debug process.
 */
interface IDebugData {
	/**
	 * Id of the device on which the debug process will be started.
	 */
	deviceIdentifier: string;

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
	 * Defines if bundled Chrome DevTools should be used or specific commit. Valid for iOS only.
	 */
	useBundledDevTools?: boolean;
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
	createDebugData(projectData: IProjectData, options: IOptions): IDebugData;
}

/**
 * Describes methods for debug operation.
 */
interface IDebugServiceBase extends NodeJS.EventEmitter {
	/**
	 * Starts debug operation based on the specified debug data.
	 * @param {IDebugData} debugData Describes information for device and application that will be debugged.
	 * @param {IDebugOptions} debugOptions Describe possible options to modify the behaivor of the debug operation, for example stop on the first line.
	 * @returns {Promise<T>} Array of URLs that can be used for debugging or a string representing a single url that can be used for debugging.
	 */
	debug<T>(debugData: IDebugData, debugOptions: IDebugOptions): Promise<T>;
}

interface IDebugService {
	getDebugService(device: Mobile.IDevice): IPlatformDebugService;
}

/**
 * Describes actions required for debugging on specific platform (Android or iOS).
 */
interface IPlatformDebugService extends IDebugServiceBase {
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
	debugStop(): Promise<void>

	/**
	 * Mobile platform of the device - Android or iOS.
	 */
	platform: string;
}
