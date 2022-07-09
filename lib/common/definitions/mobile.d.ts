import { DeviceConnectionType } from "../../constants";
import { IProjectData } from "../../definitions/project";
import { IBuildData } from "../../definitions/build";
import {
	IPlatform,
	IDictionary,
	IProjectDir,
	IShouldDispose,
	IStringDictionary,
	IAppInstalledInfo,
	IHasEmulatorOption,
	IDisposable,
} from "../declarations";

declare global {
	export module Mobile {
		/**
		 * Describes available information for a device.
		 */
		interface IDeviceInfo extends IPlatform {
			/**
			 * Unique identifier of the device.
			 */
			identifier: string;

			/**
			 * The way we've discovered the device
			 */
			connectionTypes: DeviceConnectionType[];

			/**
			 * The name of the device.
			 * For Android this is the value of device's 'ro.product.name' property.
			 * For iOS this is the value of device's 'DeviceName' property.
			 */
			displayName: string;

			/**
			 * Device model.
			 * For Android this is the value of device's 'ro.product.model' property.
			 * For iOS this is the value of device's 'ProductType' property.
			 */
			model: string;

			/**
			 * Version of the OS.
			 * For Android this is the value of device's 'ro.build.version.release' property.
			 * For iOS this is the value of device's 'ProductVersion' property.
			 */
			version: string;

			/**
			 * Vendor of the device.
			 * For Android this is the value of device's 'ro.product.brand' property.
			 * For iOS the value is always "Apple".
			 */
			vendor: string;

			/**
			 * Status of device describing if you can work with this device or there's communication error.
			 * Can be Connected or Unauthorized.
			 */
			status: string;

			/**
			 * Additional information for errors that prevents working with this device.
			 * It will be null when status is Connected.
			 */
			errorHelp: string;

			/**
			 * Defines if the device is tablet or not.
			 * For Android the value will be true when device's 'ro.build.characteristics' property contains "tablet" word or when the 'ro.build.version.release' is 3.x
			 * For iOS the value will be true when device's 'ProductType' property contains "ipad" word.
			 */
			isTablet: boolean;

			/**
			 * Defines if the device is emulator or not.
			 * Can be "Device" or "Emulator"
			 */
			type: string;

			/**
			 * Optional property describing the color of the device.
			 * Available for iOS only - the value of device's 'DeviceColor' property.
			 */
			color?: string;

			/**
			 *  Optional property describing the architecture of the device
			 *  Available for iOS only - can be "armv7" or "arm64"
			 */
			activeArchitecture?: string;
			/**
			 * Available only for emulators. Should be null for devices.
			 * The identifier of the image. For geny emulators - the vm's identifier
			 * For avd emulators - the name of the .ini file
			 * For iOS simulators - same as the identifier.
			 */
			imageIdentifier?: string;
		}

		interface IDeviceError extends Error, IDeviceIdentifier {}

		interface IDeviceIdentifier {
			deviceIdentifier: string;
		}

		interface IDevicesOperationError extends Error {
			allErrors: IDeviceError[];
		}

		interface IDevice {
			deviceInfo: Mobile.IDeviceInfo;
			applicationManager: Mobile.IDeviceApplicationManager;
			fileSystem: Mobile.IDeviceFileSystem;
			isEmulator: boolean;
			isOnlyWiFiConnected: boolean;
			openDeviceLogStream(): Promise<void>;

			/**
			 * Called when device is lost. Its purpose is to clean any resources used by the instance.
			 * @returns {void}
			 */
			detach?(): void;
		}

		interface IiOSDevice extends IDevice {
			getDebugSocket(
				appId: string,
				projectName: string,
				projectDir: string,
				ensureAppStarted?: boolean
			): Promise<any>;
			destroyDebugSocket(appId: string): Promise<void>;
			openDeviceLogStream(options?: IiOSLogStreamOptions): Promise<void>;
			destroyAllSockets(): Promise<void>;
		}

		interface IAndroidDevice extends IDevice {
			adb: Mobile.IDeviceAndroidDebugBridge;
			init(): Promise<void>;
			fileSystem: Mobile.IAndroidDeviceFileSystem;
		}

		interface IAndroidDeviceFileSystem extends IDeviceFileSystem {
			getDeviceHashService(
				appIdentifier: string
			): Mobile.IAndroidDeviceHashService;
		}

		/**
		 * Describes log stream options
		 */
		interface IiOSLogStreamOptions {
			/**
			 * This is the --predicate option which will be passed to `log stream` command
			 * log stream --predicate examples:
					--predicate 'eventMessage contains "my message"'
					--predicate 'eventType == logEvent and messageType == info'
					--predicate 'processImagePath endswith "d"'
					--predicate 'not processImagePath contains[c] "some spammer"'
					--predicate 'processID < 100'
					--predicate 'senderImagePath beginswith "my sender"'
					--predicate 'eventType == logEvent and subsystem contains "com.example.my_subsystem"'
			 */
			predicate?: string;
		}

		interface IDeviceAppData extends IPlatform, IConnectTimeoutOption {
			appIdentifier: string;
			device: Mobile.IDevice;
			getDeviceProjectRootPath(): Promise<string>;
			deviceSyncZipPath?: string;
			projectDir: string;
		}

		interface ILogcatStartOptions {
			deviceIdentifier: string;
			pid?: string;
			keepSingleProcess?: boolean;
		}

		interface ILogcatHelper {
			start(options: ILogcatStartOptions): Promise<void>;
			stop(deviceIdentifier: string): void;
			dump(deviceIdentifier: string): Promise<void>;
		}

		/**
		 * Describes methods for providing device logs to a specific consumer.
		 */
		interface IDeviceLogProvider extends NodeJS.EventEmitter {
			/**
			 * Sets the path to source file from which the logs are produced,
			 * i.e. the original file location of the file running on device.
			 * @param {string} pathToSourceFile Path to the source file.
			 * @returns {Promise<void>}
			 */
			setSourceFileLocation(pathToSourceFile: string): Promise<void>;

			/**
			 * Logs data in the specific way for the consumer.
			 * @param {string} line String from the device logs.
			 * @param {string} platform The platform of the device (for example iOS or Android).
			 * @param {string} deviceIdentifier The unique identifier of the device.
			 * @returns {void}
			 */
			logData(line: string, platform: string, deviceIdentifier: string): void;

			/**
			 * Sets the level of logging that will be used.
			 * @param {string} level The level of logs - could be INFO or FULL.
			 * @param {string} deviceIdentifier @optional The unique identifier of the device. When it is passed, only it's logging level is changed.
			 */
			setLogLevel(level: string, deviceIdentifier?: string): void;

			/**
			 * Sets the PID of the application on the specified device.
			 * @param {string} deviceIdentifier The unique identifier of the device.
			 * @param {string} pid The Process ID of the currently running application for which we need the logs.
			 */
			setApplicationPidForDevice(deviceIdentifier: string, pid: string): void;

			/**
			 * Sets the project name of the application on the specified device.
			 * @param {string} deviceIdentifier The unique identifier of the device.
			 * @param {string} projectName The project name of the currently running application for which we need the logs.
			 */
			setProjectNameForDevice(
				deviceIdentifier: string,
				projectName: string
			): void;

			/**
			 * Sets the project name of the application on the specified device.
			 * @param {string} deviceIdentifier The unique identifier of the device.
			 * @param {string} projectDir The project dir of the currently running application for which we need the logs.
			 */
			setProjectDirForDevice(
				deviceIdentifier: string,
				projectDir: string
			): void;
		}

		/**
		 * Describes different options for filtering device logs.
		 */
		interface IDeviceLogOptions
			extends IDictionary<string | boolean>,
				Partial<IProjectDir> {
			/**
			 * Process id of the application on the device.
			 */
			applicationPid?: string;

			/**
			 * Selected log level for the current device. It can be INFO or FULL.
			 */
			logLevel: string;

			/**
			 * The project name.
			 */
			projectName?: string;
		}

		/**
		 * Describes required methods for getting iOS Simulator's logs.
		 */
		interface IiOSSimulatorLogProvider
			extends NodeJS.EventEmitter,
				IShouldDispose {
			/**
			 * Starts the process for getting simulator logs and emits and DEVICE_LOG_EVENT_NAME event.
			 * @param {string} deviceId The unique identifier of the device.
			 * @param {Mobile.IiOSLogStreamOptions} options Describes the options which can be passed
			 */
			startLogProcess(
				deviceId: string,
				options?: Mobile.IiOSLogStreamOptions
			): Promise<void>;
		}

		/**
		 * Describes common filtering rules for device logs.
		 */
		interface ILogFilter {
			/**
			 * The logging level that will be used for filtering in case logLevel is not passed to filterData method.
			 * Defaults to INFO.
			 */
			loggingLevel: string;

			/**
			 * Filters data for specified platform.
			 * @param {string} platform The platform for which is the device log.
			 * @param {string} data The input data for filtering.
			 * @param {Mobile.IDeviceLogOptions} deviceLogOptions The logging options based on which the filtering for this device logs will be executed.
			 * @return {string} The filtered result based on the input or null when the input data shouldn't be shown.
			 */
			filterData(
				platform: string,
				data: string,
				deviceLogOptions: Mobile.IDeviceLogOptions
			): string;
		}

		/**
		 * Replaces file paths in device log with their original location
		 */
		interface ILogSourceMapService {
			/**
			 * Sets the sourceMapConsumer instance for specified file.
			 * @param {string} filePath Full path to a local file containing both content and inline source map.
			 * @return {Promise<void>}
			 */
			setSourceMapConsumerForFile(filePath: string): Promise<void>;
			replaceWithOriginalFileLocations(
				platform: string,
				messageData: string,
				loggingOptions: Mobile.IDeviceLogOptions
			): string;
		}

		/**
		 * Describes filtering logic for specific platform (Android, iOS).
		 */
		interface IPlatformLogFilter {
			/**
			 * Filters passed string data based on the passed logging level.
			 * @param {string} data The string data that will be checked based on the logging level.
			 * @param {string} logLevel Selected logging level.
			 * @param {string} pid The Process ID of the currently running application for which we need the logs.
			 * @return {string} The filtered result based on the input or null when the input data shouldn't be shown.
			 */
			filterData(
				data: string,
				deviceLogOptions: Mobile.IDeviceLogOptions
			): string;
		}

		interface ILoggingLevels {
			info: string;
			full: string;
		}

		interface IApplicationData extends IProjectDir {
			appId: string;
			projectName: string;
			justLaunch?: boolean;
		}

		interface IStartApplicationData extends IApplicationData {
			waitForDebugger?: boolean;
		}

		interface IInstallAppData extends IApplicationData {
			packagePath: string;
		}

		interface IDeviceApplicationManager extends NodeJS.EventEmitter {
			getInstalledApplications(): Promise<string[]>;
			isApplicationInstalled(appIdentifier: string): Promise<boolean>;
			installApplication(
				packageFilePath: string,
				appIdentifier?: string,
				buildData?: IBuildData
			): Promise<void>;
			uninstallApplication(appIdentifier: string): Promise<void>;
			reinstallApplication(
				appIdentifier: string,
				packageFilePath: string,
				buildData?: IBuildData
			): Promise<void>;
			startApplication(appData: IStartApplicationData): Promise<void>;
			stopApplication(appData: IApplicationData): Promise<void>;
			restartApplication(appData: IStartApplicationData): Promise<void>;
			checkForApplicationUpdates(): Promise<void>;
			tryStartApplication(appData: IApplicationData): Promise<void>;
			getDebuggableApps(): Promise<Mobile.IDeviceApplicationInformation[]>;
			getDebuggableAppViews(
				appIdentifiers: string[]
			): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>>;
			/**
			 * Sets the files transferred on device.
			 * @param {string[]} files Local paths to files transferred on device.
			 * @returns {Promise<void>}
			 */
			setTransferredAppFiles(files: string[]): Promise<void>;
		}

		/**
		 * Describes information about an application.
		 */
		interface IApplicationInfo {
			/**
			 * Application's identifier
			 * @type {string}
			 */
			applicationIdentifier: string;

			/**
			 * Device's identifier
			 * @type {string}
			 */
			deviceIdentifier?: string;
			/**
			 * The configuration of the currently deployed application (e.g. debug, release, live, etc.)
			 * @type {string}
			 */
			configuration: string;
		}

		interface IDeviceFileSystem {
			listFiles(devicePath: string, appIdentifier?: string): Promise<any>;
			getFile(
				deviceFilePath: string,
				appIdentifier: string,
				outputFilePath?: string
			): Promise<void>;
			getFileContent(
				deviceFilePath: string,
				appIdentifier: string
			): Promise<string>;
			putFile(
				localFilePath: string,
				deviceFilePath: string,
				appIdentifier: string
			): Promise<void>;
			deleteFile(deviceFilePath: string, appIdentifier: string): Promise<void>;
			transferFiles(
				deviceAppData: Mobile.IDeviceAppData,
				localToDevicePaths: Mobile.ILocalToDevicePathData[]
			): Promise<Mobile.ILocalToDevicePathData[]>;
			transferDirectory(
				deviceAppData: Mobile.IDeviceAppData,
				localToDevicePaths: Mobile.ILocalToDevicePathData[],
				projectFilesPath: string
			): Promise<Mobile.ILocalToDevicePathData[]>;
			transferFile?(
				localFilePath: string,
				deviceFilePath: string
			): Promise<void>;
			createFileOnDevice?(
				deviceFilePath: string,
				fileContent: string
			): Promise<void>;
			/**
			 * Updates the hash file on device with the current hashes of files.
			 * @param hashes - All file's hashes
			 * @param appIdentifier - The identifier of the application.
			 */
			updateHashesOnDevice(
				hashes: IStringDictionary,
				appIdentifier: string
			): Promise<void>;
		}

		interface IAndroidDebugBridgeCommandOptions {
			fromEvent?: string;
			returnChildProcess?: boolean;
			treatErrorsAsWarnings?: boolean;
			childProcessOptions?: any;
			deviceIdentifier?: string;
		}

		interface IAndroidDebugBridge {
			executeCommand(
				args: string[],
				options?: IAndroidDebugBridgeCommandOptions
			): Promise<any>;
			executeShellCommand(
				args: string[],
				options?: IAndroidDebugBridgeCommandOptions
			): Promise<any>;
			pushFile(localFilePath: string, deviceFilePath: string): Promise<void>;
			removeFile(deviceFilePath: string): Promise<void>;
			/**
			 * Gets the property value from device
			 * @param deviceId The identifier of device
			 * @param propertyName The name of the property
			 * @returns {Promise<string>} Returns the property's value
			 */
			getPropertyValue(deviceId: string, propertyName: string): Promise<string>;
			/**
			 * Gets all connected android devices
			 * @returns {Promise<string>} Returns all connected android devices
			 */
			getDevices(): Promise<string[]>;

			/**
			 * Returns current Android devices or empty array in case of an error.
			 * @returns {Promise<string[]>} Array of currently running devices.
			 */
			getDevicesSafe(): Promise<string[]>;
		}

		interface IDeviceAndroidDebugBridge extends IAndroidDebugBridge {
			sendBroadcastToDevice(
				action: string,
				extras?: IStringDictionary
			): Promise<number>;
		}

		interface IDeviceDiscovery extends NodeJS.EventEmitter {
			startLookingForDevices(options?: IDeviceLookingOptions): Promise<void>;
		}

		interface IiOSSimulatorDiscovery extends IDeviceDiscovery {
			checkForAvailableSimulators(): Promise<void>;
		}

		interface IAndroidDeviceDiscovery extends IDeviceDiscovery {
			ensureAdbServerStarted(): Promise<any>;
		}

		/**
		 * Describes options that can be passed to devices service's initialization method.
		 */
		interface IDevicesServicesInitializationOptions
			extends Partial<IDeviceLookingOptions> {
			/**
			 * If passed will start an emulator if necesasry.
			 */
			emulator?: boolean;
			/**
			 * Specifies a device with which to work with.
			 */
			deviceId?: string;
			/**
			 * Specifies that platform should not be infered. That is to say that all devices will be detected regardless of platform and no errors will be thrown.
			 */
			skipInferPlatform?: boolean;
			/**
			 * If passed along with skipInferPlatform then the device detection interval will not be started but instead the currently attached devices will be detected.
			 */
			skipDeviceDetectionInterval?: boolean;
			/**
			 * Specifies whether we should skip the emulator starting.
			 */
			skipEmulatorStart?: boolean;
			/**
			 * Currently available only for iOS. Specifies the sdk version of the iOS simulator.
			 * In case when `tns run ios --device "iPhone 6"` command is executed, the user can specify the sdk of the simulator because it is possible to have more than one device with the same name but with different sdk versions.
			 */
			sdk?: string;

			/**
			 * Don't stop on the first iOS device
			 */
			fullDiscovery?: boolean;
		}

		interface IDeviceActionResult<T> extends IDeviceIdentifier {
			result: T;
		}

		/**
		 * Describes a projectIdentifier for both platforms.
		 */
		interface IProjectIdentifier {
			ios: string;
			android: string;
			[platform: string]: string;
		}

		interface IDevicesService extends NodeJS.EventEmitter, IPlatform {
			hasDevices: boolean;
			deviceCount: number;

			execute<T>(
				action: (device: Mobile.IDevice) => Promise<T>,
				canExecute?: (dev: Mobile.IDevice) => boolean,
				options?: { allowNoDevices?: boolean }
			): Promise<IDeviceActionResult<T>[]>;

			/**
			 * Initializes DevicesService, so after that device operations could be executed.
			 * @param {IDevicesServicesInitializationOptions} data Defines the options which will be used for whole devicesService.
			 * @return {Promise<void>}
			 */
			initialize(data?: IDevicesServicesInitializationOptions): Promise<void>;

			/**
			 * Add an IDeviceDiscovery instance which will from now on report devices. The instance should implement IDeviceDiscovery and raise "deviceFound" and "deviceLost" events.
			 * @param {IDeviceDiscovery} deviceDiscovery Instance, implementing IDeviceDiscovery and raising raise "deviceFound" and "deviceLost" events.
			 * @return {void}
			 */
			addDeviceDiscovery(deviceDiscovery: IDeviceDiscovery): void;
			getDevices(): Mobile.IDeviceInfo[];

			/**
			 * Gets device instance by specified identifier or number.
			 * @param {string} deviceOption The specified device identifier or number.
			 * @returns {Promise<Mobile.IDevice>} Instance of IDevice.
			 */
			getDevice(deviceOption: string): Promise<Mobile.IDevice>;
			getDevicesForPlatform(platform: string): Mobile.IDevice[];
			getDeviceInstances(): Mobile.IDevice[];
			getDeviceByDeviceOption(): Mobile.IDevice;
			isAndroidDevice(device: Mobile.IDevice): boolean;
			isiOSDevice(device: Mobile.IDevice): boolean;
			isiOSSimulator(device: Mobile.IDevice): boolean;
			isOnlyiOSSimultorRunning(): boolean;
			isAppInstalledOnDevices(
				deviceIdentifiers: string[],
				appIdentifier: string,
				framework: string,
				projectDir: string
			): Promise<IAppInstalledInfo>[];
			setLogLevel(logLevel: string, deviceIdentifier?: string): void;
			deployOnDevices(
				deviceIdentifiers: string[],
				packageFile: string,
				packageName: string,
				framework: string,
				projectDir: string
			): Promise<void>[];
			getDeviceByIdentifier(identifier: string): Mobile.IDevice;
			mapAbstractToTcpPort(
				deviceIdentifier: string,
				appIdentifier: string,
				framework: string
			): Promise<string>;
			getDebuggableApps(
				deviceIdentifiers: string[]
			): Promise<Mobile.IDeviceApplicationInformation[]>[];
			getDebuggableViews(
				deviceIdentifier: string,
				appIdentifier: string
			): Promise<Mobile.IDebugWebViewInfo[]>;

			/**
			 * Returns all applications installed on the specified device.
			 * @param {string} deviceIdentifer The identifier of the device for which to get installed applications.
			 * @returns {Promise<string[]>} Array of all application identifiers of the apps installed on device.
			 */
			getInstalledApplications(deviceIdentifier: string): Promise<string[]>;

			/**
			 * Returns all available iOS and/or Android emulators.
			 * @param options The options that can be passed to filter the result.
			 * @returns {Promise<Mobile.IListEmulatorsOutput>} Dictionary with the following format: { ios: { devices: Mobile.IDeviceInfo[], errors: string[] }, android: { devices: Mobile.IDeviceInfo[], errors: string[]}}.
			 */
			getEmulatorImages(
				options?: Mobile.IListEmulatorsOptions
			): Promise<Mobile.IListEmulatorsOutput>;

			/**
			 * Starts an emulator by provided options.
			 * @param options
			 * @returns {Promise<string[]>} - Returns array of errors.
			 */
			startEmulator(options?: IStartEmulatorOptions): Promise<string[]>;

			/**
			 * Returns a single device based on the specified options. If more than one devices are matching,
			 * prompts the user for a manual choice or returns the first one for non interactive terminals.
			 */
			pickSingleDevice(
				options: IPickSingleDeviceOptions
			): Promise<Mobile.IDevice>;

			getPlatformsFromDeviceDescriptors(
				deviceDescriptors: ILiveSyncDeviceDescriptor[]
			): string[];
		}

		interface IPickSingleDeviceOptions {
			/**
			 * Pick from the connected emulators only
			 */
			onlyEmulators: boolean;
			/**
			 * Pick from the connected real devices only
			 */
			onlyDevices: boolean;
			/**
			 * Pick a specific device
			 */
			deviceId: string;
		}

		interface IListEmulatorsOptions {
			platform?: string;
		}

		interface IListEmulatorsOutput extends IDictionary<IEmulatorImagesOutput> {
			ios: IEmulatorImagesOutput;
			android: IEmulatorImagesOutput;
		}

		interface IEmulatorImagesOutput {
			devices: Mobile.IDeviceInfo[];
			errors: string[];
		}

		interface IPortForwardDataBase {
			deviceIdentifier: string;
			appIdentifier: string;
		}

		interface IPortForwardData extends IPortForwardDataBase {
			abstractPort: string;
		}

		/**
		 * Describes methods for working with Android processes.
		 */
		interface IAndroidProcessService {
			/**
			 * Checks for available ports and forwards the current abstract port to one of the available ports.
			 * @param deviceIdentifier The identifier of the device.
			 * @param appIdentifier The identifier of the application.
			 * @param framework {string} The framework of the application. Could be Cordova or NativeScript.
			 * @return {string} Returns the tcp port number which is mapped to the abstract port.
			 */
			mapAbstractToTcpPort(
				deviceIdentifier: string,
				appIdentifier: string,
				framework: string
			): Promise<string>;

			/**
			 * Gets the applications which are available for debugging on the specified device.
			 * @param deviceIdentifier The identifier of the device.
			 * @return {Mobile.IDeviceApplicationInformation[]} Returns array of applications information for the applications which are available for debugging.
			 */
			getDebuggableApps(
				deviceIdentifier: string
			): Promise<Mobile.IDeviceApplicationInformation[]>;

			/**
			 * Gets all mapped abstract to tcp ports for specified device id and application identifiers.
			 * @param deviceIdentifier {string} The identifier of the device.
			 * @param appIdentifiers {string[]} Application identifiers that will be checked.
			 * @param framework {string} The framework of the application. Could be Cordova or NativeScript.
			 * @return {Promise<IDictionary<number>>} Dictionary, where the keys are app identifiers and the values are local ports.
			 */
			getMappedAbstractToTcpPorts(
				deviceIdentifier: string,
				appIdentifiers: string[],
				framework: string
			): Promise<IDictionary<number>>;

			/**
			 * Gets the PID of a running application.
			 * @param deviceIdentifier {string} The identifier of the device.
			 * @param appIdentifier The identifier of the application.
			 * @return {string} Returns the process id matching the application identifier in the device process list.
			 */
			getAppProcessId(
				deviceIdentifier: string,
				appIdentifier: string
			): Promise<string>;

			/**
			 * Sets port forwarding to a specified abstract port.
			 * First checks if there's already existing port forwarding and if yes, takes the TCP port from there and returns it to the result.
			 * In case there's no port forwarding, gets a free TCP port and executes adb forward.
			 * @param {IPortForwardData} portForwardInputData Data describing required information to setup port forwarding.
			 * @returns {number} The TCP port that is used for the forwarding.
			 */
			forwardFreeTcpToAbstractPort(
				portForwardInputData: IPortForwardData
			): Promise<number>;
		}

		/**
		 * Describes information for WebView that can be debugged.
		 */
		interface IDebugWebViewInfo {
			/**
			 * Short description of the view.
			 */
			description: string;

			/**
			 * Url to the devtools.
			 * @example http://chrome-devtools-frontend.appspot.com/serve_rev/@211d45a5b74b06d12bb016f3c4d54095faf2646f/inspector.html?ws=127.0.0.1:53213/devtools/page/4024
			 */
			devtoolsFrontendUrl: string;

			/**
			 * Unique identifier of the web view. Could be number or GUID.
			 * @example 4027
			 */
			id: string;

			/**
			 * Title of the WebView.
			 * @example https://bit.ly/12345V is not available
			 */
			title: string;

			/**
			 * Type of the WebView.
			 * @example page
			 */
			type: string;

			/**
			 * URL loaded in the view.
			 * @example https://bit.ly/12345V
			 */
			url: string;

			/**
			 * Debugger URL.
			 * @example ws://127.0.0.1:53213/devtools/page/4027
			 */
			webSocketDebuggerUrl: string;
		}

		interface ILocalToDevicePathData {
			getLocalPath(): string;
			getDevicePath(): string;
			getRelativeToProjectBasePath(): string;
			deviceProjectRootPath: string;
		}

		interface ILocalToDevicePathDataFactory {
			create(
				fileName: string,
				localProjectRootPath: string,
				onDeviceFileName: string,
				deviceProjectRootPath: string
			): Mobile.ILocalToDevicePathData;
		}

		interface IAvdInfo extends IDictionary<string | number> {
			target: string;
			targetNum: number;
			path: string;
			device?: string;
			displayName?: string;
			avdId?: string;
			name?: string;
			abi?: string;
			skin?: string;
			sdcard?: string;
		}

		interface IAvdManagerDeviceInfo extends IStringDictionary {
			name: string;
			device: string;
			path: string;
			target: string;
			skin: string;
			sdcard: string;
		}

		interface IEmulatorPlatformService {
			/**
			 * Gets all available emulators
			 * @returns {Promise<Mobile.IEmulatorImagesOutput>}
			 */
			getEmulatorImages(): Promise<Mobile.IEmulatorImagesOutput>;
			/**
			 * Gets the ids of all running emulators
			 * @returns {Promise<string[]>}
			 */
			getRunningEmulatorIds(): Promise<string[]>;
			/**
			 * Gets the name of the running emulator.
			 * @param emulatorId - The identifier of the running emulator.
			 * @returns {Promise<string>} - The name of the running emulator.
			 */
			getRunningEmulatorName(emulatorId: string): Promise<string>;
			/**
			 * Gets the emulator image identifier of a running emulator specified by emulatorId parameter.
			 * @param emulatorId - The identifier of the running emulator.
			 * @returns {Promise<string>} - The image identifier ot the running emulator.
			 */
			getRunningEmulatorImageIdentifier(emulatorId: string): Promise<string>;
			/**
			 * Starts the emulator by provided options.
			 * @param options
			 * @returns {Promise<IStartEmulatorOutput>} Starts the emulator and returns the errors if some error occurs.
			 */
			startEmulator(
				options: Mobile.IStartEmulatorOptions
			): Promise<IStartEmulatorOutput>;

			/**
			 * Called when emulator is lost. Its purpose is to clean any resources used by the instance.
			 * @returns {void}
			 */
			detach?(deviceInfo: Mobile.IDeviceInfo): void;
		}

		interface IStartEmulatorOutput {
			errors: string[];
		}

		interface IAndroidVirtualDeviceService {
			/**
			 * Gets all available emulators.
			 * @returns {Promise<Mobile.IEmulatorImagesOutput>} - Dictionary in the following format: { devices: Mobile.IDevice[], errors: string[] }.
			 * Returns array of all available android emulators - genymotion and native avd emulators and array of errors.
			 */
			getEmulatorImages(
				adbDevicesOutput: string[]
			): Promise<Mobile.IEmulatorImagesOutput>;
			/**
			 * Gets all identifiers of all running android emulators.
			 * @param adbDevicesOutput The output from "adb devices" command
			 * @returns {Promise<string[]>} - Array of ids of all running emulators.
			 */
			getRunningEmulatorIds(adbDevicesOutput: string[]): Promise<string[]>;
			/**
			 * Gets the name of the running emulator specified by emulatorId parameter.
			 * @param emulatorId - The identifier of the running emulator.
			 * @returns {Promise<string>} - The name of the running emulator.
			 */
			getRunningEmulatorName(emulatorId: string): Promise<string>;
			/**
			 * Gets the image identifier of the running emulator specified by emulatorId parameter.
			 * @param emulatorId - The identifier of the running emulator.
			 * @returns {Promise<string>} - The image identifier of the running emulator.
			 */
			getRunningEmulatorImageIdentifier(emulatorId: string): Promise<string>;
			/**
			 * Gets the path to emulator executable. It will be passed to spawn when starting the emulator.
			 * For genymotion emulators - the path to player.
			 * For avd emulators - the path to emulator executable.
			 */
			pathToEmulatorExecutable: string;
			/**
			 * Gets the arguments that will be passed to spawn when starting the emulator.
			 * @param imageIdentifier - The imagerIdentifier of the emulator.
			 */
			startEmulatorArgs(imageIdentifier: string): string[];
			/**
			 * Called when emulator is lost. Its purpose is to clean any resources used by the instance.
			 * @returns {void}
			 */
			detach?(deviceInfo: Mobile.IDeviceInfo): void;
		}

		interface IVirtualBoxService {
			/**
			 * Lists all virtual machines.
			 * @returns {Promise<IVirtualBoxListVmsOutput>} - Returns a dictionary in the following format: { vms: IVirtualBoxVm[]; error?: string; }
			 * where vms is an array of name and id for each virtual machine.
			 */
			listVms(): Promise<IVirtualBoxListVmsOutput>;
			/**
			 * Gets all propertier for the specified virtual machine.
			 * @param id - The identifier of the virtual machine.
			 * @returns {Promise<IVirtualBoxEnumerateGuestPropertiesOutput>} - Returns a dictionary in the following format: { properties: string; error?: string; }
			 */
			enumerateGuestProperties(
				id: string
			): Promise<IVirtualBoxEnumerateGuestPropertiesOutput>;
		}

		interface IVirtualBoxListVmsOutput {
			/**
			 * List of virtual machines
			 */
			vms: IVirtualBoxVm[];
			/**
			 * The error if something is not configured properly.
			 */
			error?: string;
		}

		interface IVirtualBoxEnumerateGuestPropertiesOutput {
			/**
			 * The output of `vboxmanage enumerate guestproperty <id>` command
			 */
			properties: string;
			/**
			 * The error if something is not configured properly.
			 */
			error?: string;
		}

		interface IVirtualBoxVm {
			/**
			 * The id of the virtual machine.
			 */
			id: string;
			/**
			 * The name of the virtual machine.
			 */
			name: string;
		}

		interface IAndroidIniFileParser {
			/**
			 * Returns avdInfo from provided .ini file.
			 * @param iniFilePath - The full path to .ini file.
			 * @param avdInfo - avdInfo from previously parsed .ini file in case there are such.
			 */
			parseIniFile(
				iniFilePath: string,
				avdInfo?: Mobile.IAvdInfo
			): Mobile.IAvdInfo;
		}

		interface IiSimDevice {
			/**
			 * The name of the simulator. For example: 'iPhone 4s', 'iPad Retina'
			 */
			name: string;
			/**
			 * The unique identifier of the simulator. For example: 'B2FD3FD3-5982-4B56-A7E8-285DBC74ECCB', '49AFB795-8B1B-4CD1-8399-690A1A9BC00D'
			 */
			id: string;
			/**
			 * The full identifier of the simulator. For example: 'com.apple.CoreSimulator.SimDeviceType.iPhone 5s', 'com.apple.CoreSimulator.SimDeviceType.iPad Retina'
			 */
			fullId: string;
			/**
			 * The sdk version of the simulator. For example: '8.4', '9.3', '11.3'
			 */
			runtimeVersion: string;
			/**
			 * The state of the simulator. Can be 'Shutdown' or 'Booted'
			 */
			state?: string;
		}

		interface IiOSSimResolver {
			iOSSim: IiOSSim;
			iOSSimPath: string;
		}

		interface IiOSSim {
			getApplicationPath(deviceId: string, appIdentifier: string): string;
			getDeviceLogProcess(deviceId: string, options?: any): any;
			getDevices(): Promise<Mobile.IiSimDevice[]>;
			getRunningSimulators(): Promise<IiSimDevice[]>;
			launchApplication(
				applicationPath: string,
				appIdentifier: string,
				options: IiOSSimLaunchApplicationOptions
			): Promise<any>;
			printDeviceTypes(): Promise<any>;
			sendNotification(notification: string, deviceId: string): Promise<void>;
			startSimulator(data: IiOSSimStartSimulatorInput): Promise<string>;
		}

		interface IiOSSimStartSimulatorInput {
			/**
			 * The name or identifier of device that will be started.
			 */
			device: string;
			/**
			 * The sdk version of the device that will be started.
			 */
			sdkVersion: string;
			state?: string;
		}

		interface IiOSSimLaunchApplicationOptions {
			timeout: string;
			sdkVersion: string;
			device: string;
			args: string[];
			waitForDebugger: boolean;
			skipInstall: boolean;
		}

		/**
		 * Describes the information when trying to connect to port.
		 */
		interface IConnectToPortData {
			/**
			 * The port to connect.
			 * @type {number}
			 */
			port: number;

			/**
			 * Timeout in milliseconds.
			 * @type {number}
			 */
			timeout?: number;
		}

		interface IiOSSimulatorService extends IEmulatorPlatformService {
			postDarwinNotification(
				notification: string,
				deviceId: string
			): Promise<void>;

			/**
			 * Tries to connect to specified port for speciefied amount of time.
			 * In case it succeeds, a socket is returned.
			 * In case it fails, undefined is returned.
			 * @param {IConnectToPortData} connectToPortData Data describing port and timeout to try to connect.
			 * @returns {net.Socket} Returns instance of net.Socket when connection is successful, otherwise undefined is returned.
			 */
			connectToPort(connectToPortData: IConnectToPortData): Promise<any>;
		}

		interface IRunApplicationOnEmulatorOptions {
			/**
			 * The identifier of the application that will be started on device.
			 */
			appId?: string;
			/**
			 * The args that will be passed to the application.
			 */
			args?: string;
			/**
			 * The device identifier.
			 */
			device?: string;
			/**
			 * If provided, redirect the application's standard output to a file.
			 */
			stderrFilePath?: string;
			/**
			 * If provided, redirect the applications's standard error to a file.
			 */
			stdoutFilePath?: string;
			/**
			 * If provided, only run the app on device (will skip app installation).
			 */
			skipInstall?: boolean;
			/**
			 * If provided, wait for debugger to attach.
			 */
			waitForDebugger?: boolean;
			captureStdin?: boolean;

			/**
			 * If provided, print all available devices
			 */
			availableDevices?: boolean;

			timeout?: string;
			/**
			 * The sdk version of the emulator.
			 */
			sdk?: string;

			justlaunch?: boolean;
		}

		interface IStartEmulatorOptions {
			/**
			 * The emulator's image identifier.
			 */
			imageIdentifier?: string;
			/**
			 * The identifier or name of the emulator.
			 */
			emulatorIdOrName?: string;
			/**
			 * The platform of the emulator.
			 */
			platform?: string;
			/**
			 * The sdk version of the emulator. Currently available only for iOS emulators.
			 */
			sdk?: string;
			/**
			 * The info about the emulator.
			 */
			emulator?: Mobile.IDeviceInfo;
		}

		interface IAndroidStartEmulatorOptions extends IStartEmulatorOptions {
			/**
			 * The timeout in miliseconds what will be passed to android emulator. If 0 - will await infinity to start the emulator.
			 */
			timeout?: number;
		}

		interface IMobileHelper {
			platformNames: string[];
			isAndroidPlatform(platform: string): boolean;
			isiOSPlatform(platform: string): boolean;
			normalizePlatformName(platform: string): string;
			validatePlatformName(platform: string): string;
			buildDevicePath(...args: string[]): string;
			correctDevicePath(filePath: string): string;
			isiOSTablet(deviceName: string): boolean;
			getDeviceFileContent(
				device: Mobile.IDevice,
				deviceFilePath: string,
				projectData: IProjectData
			): Promise<string>;
		}

		interface IEmulatorHelper {
			mapAndroidApiLevelToVersion: IStringDictionary;
			getEmulatorsFromAvailableEmulatorsOutput(
				availableEmulatorsOutput: Mobile.IListEmulatorsOutput
			): Mobile.IDeviceInfo[];
			getErrorsFromAvailableEmulatorsOutput(
				availableEmulatorsOutput: Mobile.IListEmulatorsOutput
			): string[];
			getEmulatorByImageIdentifier(
				imageIdentifier: string,
				emulators: Mobile.IDeviceInfo[]
			): Mobile.IDeviceInfo;
			getEmulatorByIdOrName(
				emulatorIdOrName: string,
				emulators: Mobile.IDeviceInfo[]
			): Mobile.IDeviceInfo;
			getEmulatorByStartEmulatorOptions(
				options: Mobile.IStartEmulatorOptions,
				emulators: Mobile.IDeviceInfo[]
			): Mobile.IDeviceInfo;
			isEmulatorRunning(emulator: Mobile.IDeviceInfo): boolean;
			setRunningAndroidEmulatorProperties(
				emulatorId: string,
				emulator: Mobile.IDeviceInfo
			): void;
		}

		interface IDevicePlatformsConstants {
			iOS: string;
			Android: string;
		}

		interface IDeviceApplication {
			CFBundleExecutable: string;
			Path: string;
		}

		interface IiOSDeviceProductNameMapper {
			resolveProductName(deviceType: string): string;
		}

		interface IHasDetectionInterval {
			detectionInterval?: number;
		}

		interface IDeviceLookingOptions
			extends IHasEmulatorOption,
				IHasDetectionInterval {
			shouldReturnImmediateResult: boolean;
			platform: string;
			fullDiscovery?: boolean;
		}

		interface IAndroidDeviceHashService {
			/**
			 * Returns the hash file path on device
			 */
			hashFileDevicePath: string;
			/**
			 * If hash file exists on device, read the hashes from the file and returns them as array
			 * If hash file doesn't exist on device, returns null
			 */
			getShasumsFromDevice(): Promise<IStringDictionary>;
			/**
			 * Uploads updated shasums to hash file on device
			 */
			uploadHashFileToDevice(data: IStringDictionary): Promise<void>;
			/**
			 * Computes the shasums of localToDevicePaths and updates hash file on device
			 */
			updateHashes(
				localToDevicePaths: Mobile.ILocalToDevicePathData[]
			): Promise<void>;
			/**
			 * Computes the shasums of localToDevicePaths and removes them from hash file on device
			 */
			removeHashes(
				localToDevicePaths: Mobile.ILocalToDevicePathData[]
			): Promise<boolean>;

			/**
			 * Detects if there's hash file on the device for the specified device.
			 * @return {Promise<boolean>} boolean True if file exists and false otherwise.
			 */
			doesShasumFileExistsOnDevice(): Promise<boolean>;

			/**
			 * Generates hashes of specified localToDevicePaths by chunks and persists them in the passed @shasums argument.
			 * @param {Mobile.ILocalToDevicePathData[]} localToDevicePaths The localToDevicePaths objects for which the hashes should be generated.
			 * @param {IStringDicitionary} shasums Object in which the shasums will be persisted.
			 * @returns {Promise<IStringDictionary>} The generated/updated shasums.
			 */
			generateHashesFromLocalToDevicePaths(
				localToDevicePaths: Mobile.ILocalToDevicePathData[],
				initialShasums?: IStringDictionary
			): Promise<IStringDictionary>;

			/**
			 * Generates DevicePaths of all elements from the input localToDevicePaths.
			 * @param {Mobile.ILocalToDevicePathData[]} localToDevicePaths The localToDevicePaths objects for which the DevicePaths should be generated.
			 * @returns {string[]} DevicePaths of all elements from the input localToDevicePaths.
			 */
			getDevicePaths(
				localToDevicePaths: Mobile.ILocalToDevicePathData[]
			): string[];

			/**
			 * Returns the changed shasums based on the provided
			 * @param {IStringDictionary} oldShasums The old shasums on the device
			 * @param {IStringDictionary} currentShasums The current shasums on the local project
			 * @returns {string[]} Returns the shasums that changed
			 */
			getChangedShasums(
				oldShasums: IStringDictionary,
				currentShasums: IStringDictionary
			): IStringDictionary;
		}

		/**
		 * Describes information for Android debug bridge error.
		 */
		interface IAndroidDebugBridgeError {
			/**
			 * Name of the error.
			 */
			name: string;

			/**
			 * Description of the error.
			 */
			description: string;

			/**
			 * Returned result code.
			 */
			resultCode: number;
		}

		/**
		 * Describes logic for handling Android debug bridge result.
		 */
		interface IAndroidDebugBridgeResultHandler {
			/**
			 * Checks the Android debug bridge result for errors.
			 * @param {string} adbResult The Android debug bridge result.
			 * @return {string} The errors found in the Android debug bridge result.
			 */
			checkForErrors(adbResult: any): IAndroidDebugBridgeError[];

			/**
			 * Handles the Android debug bridge result errors.
			 * @param {IAndroidDebugBridgeError[]} errors The Android debug bridge result errors.
			 * @return {void}.
			 */
			handleErrors(
				errors: IAndroidDebugBridgeError[],
				treatErrorsAsWarnings?: boolean
			): void;
		}

		/**
		 * Describes basic information about application on device.
		 */
		interface IDeviceApplicationInformationBase extends IDeviceIdentifier {
			/**
			 * The application identifier.
			 */
			appIdentifier: string;
		}

		/**
		 * Describes information about application on device.
		 */
		interface IDeviceApplicationInformation
			extends IDeviceApplicationInformationBase {
			/**
			 * The framework of the project (Cordova or NativeScript).
			 */
			framework: string;
		}
	}

	interface IIOSDeviceOperations extends IDisposable, NodeJS.EventEmitter {
		install(
			ipaPath: string,
			deviceIdentifiers: string[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		uninstall(
			appIdentifier: string,
			deviceIdentifiers: string[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		startLookingForDevices(
			deviceFoundCallback: DeviceInfoCallback,
			deviceUpdatedCallback: DeviceInfoCallback,
			deviceLostCallback: DeviceInfoCallback,
			options?: Mobile.IDeviceLookingOptions
		): Promise<void>;

		startDeviceLog(deviceIdentifier: string): void;

		apps(
			deviceIdentifiers: string[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceAppInfo>;

		listDirectory(
			listArray: IOSDeviceLib.IReadOperationData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceMultipleResponse>;

		readFiles(
			deviceFilePaths: IOSDeviceLib.IReadOperationData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		downloadFiles(
			deviceFilePaths: IOSDeviceLib.IFileOperationData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		uploadFiles(
			files: IOSDeviceLib.IUploadFilesData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		deleteFiles(
			deleteArray: IOSDeviceLib.IDeleteFileData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		start(
			startArray: IOSDeviceLib.IIOSApplicationData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		stop(
			stopArray: IOSDeviceLib.IIOSApplicationData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		postNotification(
			postNotificationArray: IOSDeviceLib.IPostNotificationData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		awaitNotificationResponse(
			awaitNotificationResponseArray: IOSDeviceLib.IAwaitNotificatioNResponseData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IOSDeviceResponse>;

		connectToPort(
			connectToPortArray: IOSDeviceLib.IConnectToPortData[],
			errorHandler?: DeviceOperationErrorHandler
		): Promise<IDictionary<IOSDeviceLib.IConnectToPortResponse[]>>;

		setShouldDispose(shouldDispose: boolean): void;
	}

	type DeviceOperationErrorHandler = (err: IOSDeviceLib.IDeviceError) => void;

	type DeviceInfoCallback = (
		deviceInfo: IOSDeviceLib.IDeviceActionInfo
	) => void;

	type IOSDeviceResponse = IDictionary<IOSDeviceLib.IDeviceResponse[]>;

	type IOSDeviceMultipleResponse = IDictionary<
		IOSDeviceLib.IDeviceMultipleResponse[]
	>;

	type IOSDeviceAppInfo = IDictionary<IOSDeviceLib.IDeviceAppInfo[]>;
}
