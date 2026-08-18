import { Contract } from "../common/di/contract";
import type { IAppInstalledInfo } from "../common/declarations";

/**
 * The EventEmitter surface is merged in rather than redeclared as abstract
 * members: the contract must stay free of runtime imports, so it cannot extend
 * `EventEmitter`, and merging keeps the signatures (including the `this`
 * returns) tied to the ambient definition instead of a hand-copied snapshot.
 */
export interface DevicesService extends NodeJS.EventEmitter {}

/**
 * Discovers connected devices and emulators and executes actions against them.
 */
@Contract({ name: "devicesService" })
export abstract class DevicesService {
	/** The platform the service has been initialized for. */
	abstract platform: string;

	/** Whether any device matching the current initialization options is attached. */
	abstract hasDevices: boolean;

	/** The number of devices matching the current initialization options. */
	abstract deviceCount: number;

	abstract execute<T>(
		action: (device: Mobile.IDevice) => Promise<T>,
		canExecute?: (dev: Mobile.IDevice) => boolean,
		options?: { allowNoDevices?: boolean },
	): Promise<Mobile.IDeviceActionResult<T>[]>;

	/**
	 * Initializes DevicesService, so after that device operations could be executed.
	 * @param {IDevicesServicesInitializationOptions} data Defines the options which will be used for whole devicesService.
	 * @return {Promise<void>}
	 */
	abstract initialize(
		data?: Mobile.IDevicesServicesInitializationOptions,
	): Promise<void>;

	/**
	 * Add an IDeviceDiscovery instance which will from now on report devices. The instance should implement IDeviceDiscovery and raise "deviceFound" and "deviceLost" events.
	 * @param {IDeviceDiscovery} deviceDiscovery Instance, implementing IDeviceDiscovery and raising raise "deviceFound" and "deviceLost" events.
	 * @return {void}
	 */
	abstract addDeviceDiscovery(deviceDiscovery: Mobile.IDeviceDiscovery): void;

	abstract getDevices(): Mobile.IDeviceInfo[];

	/**
	 * Gets device instance by specified identifier or number.
	 * @param {string} deviceOption The specified device identifier or number.
	 * @returns {Promise<Mobile.IDevice>} Instance of IDevice.
	 */
	abstract getDevice(deviceOption: string): Promise<Mobile.IDevice>;

	abstract getDevicesForPlatform(platform: string): Mobile.IDevice[];

	abstract getDeviceInstances(): Mobile.IDevice[];

	abstract getDeviceByDeviceOption(): Mobile.IDevice;

	abstract isAndroidDevice(device: Mobile.IDevice): boolean;

	abstract isiOSDevice(device: Mobile.IDevice): boolean;

	abstract isiOSSimulator(device: Mobile.IDevice): boolean;

	abstract isOnlyiOSSimultorRunning(): boolean;

	abstract isAppInstalledOnDevices(
		deviceIdentifiers: string[],
		appIdentifier: string,
		framework: string,
		projectDir: string,
	): Promise<IAppInstalledInfo>[];

	abstract setLogLevel(logLevel: string, deviceIdentifier?: string): void;

	abstract deployOnDevices(
		deviceIdentifiers: string[],
		packageFile: string,
		packageName: string,
		framework: string,
		projectDir: string,
	): Promise<void>[];

	abstract getDeviceByIdentifier(identifier: string): Mobile.IDevice;

	abstract mapAbstractToTcpPort(
		deviceIdentifier: string,
		appIdentifier: string,
		framework: string,
	): Promise<string>;

	abstract getDebuggableApps(
		deviceIdentifiers: string[],
	): Promise<Mobile.IDeviceApplicationInformation[]>[];

	abstract getDebuggableViews(
		deviceIdentifier: string,
		appIdentifier: string,
	): Promise<Mobile.IDebugWebViewInfo[]>;

	/**
	 * Returns all applications installed on the specified device.
	 * @param {string} deviceIdentifer The identifier of the device for which to get installed applications.
	 * @returns {Promise<string[]>} Array of all application identifiers of the apps installed on device.
	 */
	abstract getInstalledApplications(
		deviceIdentifier: string,
	): Promise<string[]>;

	/**
	 * Returns all available iOS and/or Android emulators.
	 * @param options The options that can be passed to filter the result.
	 * @returns {Promise<Mobile.IListEmulatorsOutput>} Dictionary with the following format: { ios: { devices: Mobile.IDeviceInfo[], errors: string[] }, android: { devices: Mobile.IDeviceInfo[], errors: string[]}}.
	 */
	abstract getEmulatorImages(
		options?: Mobile.IListEmulatorsOptions,
	): Promise<Mobile.IListEmulatorsOutput>;

	/**
	 * Starts an emulator by provided options.
	 * @param options
	 * @returns {Promise<string[]>} - Returns array of errors.
	 */
	abstract startEmulator(
		options?: Mobile.IStartEmulatorOptions,
	): Promise<string[]>;

	/**
	 * Starts polling for attached devices, raising the deviceFound/deviceLost
	 * events as the set of attached devices changes. Calling it while a poll
	 * is already running is a no-op.
	 * @param {Mobile.IDeviceLookingOptions} deviceInitOpts Options describing which devices to look for and how often to poll.
	 * @returns {void}
	 */
	abstract startDeviceDetectionInterval(
		deviceInitOpts?: Mobile.IDeviceLookingOptions,
	): void;

	/**
	 * Stops the poll started by startDeviceDetectionInterval.
	 * @returns {void}
	 */
	abstract stopDeviceDetectionInterval(): void;

	/**
	 * Starts polling for available emulator images, raising the
	 * emulatorImageFound/emulatorImageLost events as the set changes.
	 * @param {Mobile.IHasDetectionInterval} opts Options describing how often to poll.
	 * @returns {void}
	 */
	abstract startEmulatorDetectionInterval(
		opts?: Mobile.IHasDetectionInterval,
	): void;

	/**
	 * Stops the poll started by startEmulatorDetectionInterval.
	 * @returns {void}
	 */
	abstract stopEmulatorDetectionInterval(): void;

	/**
	 * Returns a single device based on the specified options. If more than one devices are matching,
	 * prompts the user for a manual choice or returns the first one for non interactive terminals.
	 */
	abstract pickSingleDevice(
		options: Mobile.IPickSingleDeviceOptions,
	): Promise<Mobile.IDevice>;

	abstract getPlatformsFromDeviceDescriptors(
		deviceDescriptors: ILiveSyncDeviceDescriptor[],
	): string[];
}
