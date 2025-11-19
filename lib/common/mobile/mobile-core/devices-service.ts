import * as assert from "assert";
import { EventEmitter } from "events";
import * as _ from "lodash";
import { EOL } from "os";
import * as util from "util";
import { DebugCommandErrors } from "../../../constants";
import { IOptions } from "../../../declarations";
import * as constants from "../../constants";
import { CONNECTED_STATUS } from "../../constants";
import {
	IAppInstalledInfo,
	IDictionary,
	IErrors,
	IHostInfo,
} from "../../declarations";
import { exported, performanceLog } from "../../decorators";
import { IInjector } from "../../definitions/yok";
import * as helpers from "../../helpers";
import { isInteractive, settlePromises } from "../../helpers";
import { injector } from "../../yok";

export class DevicesService
	extends EventEmitter
	implements Mobile.IDevicesService
{
	private static DEVICE_LOOKING_INTERVAL = 200;
	private static EMULATOR_IMAGES_DETECTION_INTERVAL = 60 * 1000;
	private _devices: IDictionary<Mobile.IDevice> = {};
	private _availableEmulators: IDictionary<Mobile.IDeviceInfo> = {};
	private _platform: string;
	private _device: Mobile.IDevice;
	private _isInitialized = false;
	private _data: Mobile.IDevicesServicesInitializationOptions;
	private _otherDeviceDiscoveries: Mobile.IDeviceDiscovery[] = [];
	private _allDeviceDiscoveries: Mobile.IDeviceDiscovery[] = [];
	private deviceDetectionInterval: NodeJS.Timeout;
	private emulatorDetectionInterval: NodeJS.Timeout;

	constructor(
		private $logger: ILogger,
		private $errors: IErrors,
		private $iOSSimulatorDiscovery: Mobile.IiOSSimulatorDiscovery,
		private $iOSDeviceDiscovery: Mobile.IDeviceDiscovery,
		private $androidDeviceDiscovery: Mobile.IDeviceDiscovery,
		private $staticConfig: Config.IStaticConfig,
		private $messages: IMessages,
		private $mobileHelper: Mobile.IMobileHelper,
		private $deviceLogProvider: Mobile.IDeviceLogProvider,
		private $hostInfo: IHostInfo,
		private $injector: IInjector,
		private $options: IOptions,
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $iOSEmulatorServices: Mobile.IiOSSimulatorService,
		private $androidEmulatorServices: Mobile.IEmulatorPlatformService,
		private $androidEmulatorDiscovery: Mobile.IDeviceDiscovery,
		private $emulatorHelper: Mobile.IEmulatorHelper,
		private $prompter: IPrompter,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
	) {
		super();
		this.attachToKnownDeviceDiscoveryEvents();
		this.attachToKnownEmulatorDiscoveryEvents();
		this._allDeviceDiscoveries = [
			this.$iOSDeviceDiscovery,
			this.$androidDeviceDiscovery,
			this.$iOSSimulatorDiscovery,
		];
	}

	@performanceLog()
	public async pickSingleDevice(
		options: Mobile.IPickSingleDeviceOptions,
	): Promise<Mobile.IDevice> {
		if (options.onlyDevices && options.onlyEmulators) {
			this.$errors.fail(
				DebugCommandErrors.UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR,
			);
		}

		if (options.deviceId) {
			const device = await this.getDevice(options.deviceId);
			return device;
		}

		// Now let's take data for each device:
		const availableDevicesAndEmulators = this.getDeviceInstances().filter(
			(d) =>
				d.deviceInfo.status === CONNECTED_STATUS &&
				(!this.platform ||
					d.deviceInfo.platform.toLowerCase() === this.platform.toLowerCase()),
		);

		const selectedDevices = availableDevicesAndEmulators.filter((d) =>
			options.onlyEmulators
				? d.isEmulator
				: options.onlyDevices
					? !d.isEmulator
					: true,
		);

		if (selectedDevices.length > 1) {
			if (isInteractive()) {
				const choices = selectedDevices.map(
					(e) => `${e.deviceInfo.identifier} - ${e.deviceInfo.displayName}`,
				);

				const selectedDeviceString = await this.$prompter.promptForChoice(
					"Select device for debugging",
					choices,
				);

				const selectedDevice = _.find(
					selectedDevices,
					(d) =>
						`${d.deviceInfo.identifier} - ${d.deviceInfo.displayName}` ===
						selectedDeviceString,
				);
				return selectedDevice;
			} else {
				const sortedInstances = _.sortBy(
					selectedDevices,
					(e) => e.deviceInfo.version,
				);
				const emulators = sortedInstances.filter((e) => e.isEmulator);
				const devices = sortedInstances.filter((d) => !d.isEmulator);
				let selectedInstance: Mobile.IDevice;

				if (options.onlyEmulators || options.onlyDevices) {
					// When --emulator or --forDevice is passed, the instances are already filtered
					// So we are sure we have exactly the type we need and we can safely return the last one (highest OS version).
					selectedInstance = _.last(sortedInstances);
				} else {
					if (emulators.length) {
						selectedInstance = _.last(emulators);
					} else {
						selectedInstance = _.last(devices);
					}
				}

				this.$logger.warn(
					`Multiple devices/emulators found. Starting debugger on ${selectedInstance.deviceInfo.identifier}. ` +
						"If you want to debug on specific device/emulator, you can specify it with --device option.",
				);

				return selectedInstance;
			}
		} else if (selectedDevices.length === 1) {
			return _.head(selectedDevices);
		}

		this.$errors.fail(
			DebugCommandErrors.NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS,
		);
	}

	@exported("devicesService")
	public async getEmulatorImages(
		options?: Mobile.IListEmulatorsOptions,
	): Promise<Mobile.IListEmulatorsOutput> {
		const result = Object.create(null);

		if (
			this.$hostInfo.isDarwin &&
			(!options ||
				!options.platform ||
				this.$mobileHelper.isiOSPlatform(options.platform))
		) {
			result.ios = await this.$iOSEmulatorServices.getEmulatorImages();
		}

		if (
			!options ||
			!options.platform ||
			this.$mobileHelper.isAndroidPlatform(options.platform)
		) {
			result.android = await this.$androidEmulatorServices.getEmulatorImages();
		}

		return result;
	}

	@exported("devicesService")
	public async startEmulator(
		options: Mobile.IStartEmulatorOptions,
	): Promise<string[]> {
		if (!options || (!options.imageIdentifier && !options.emulatorIdOrName)) {
			return ["Missing mandatory image identifier or name option."];
		}

		const availableEmulatorsOutput = await this.getEmulatorImages({
			platform: options.platform,
		});
		const emulators =
			this.$emulatorHelper.getEmulatorsFromAvailableEmulatorsOutput(
				availableEmulatorsOutput,
			);
		const errors = this.$emulatorHelper.getErrorsFromAvailableEmulatorsOutput(
			availableEmulatorsOutput,
		);

		let emulator = null;
		if (options.imageIdentifier) {
			emulator = this.$emulatorHelper.getEmulatorByImageIdentifier(
				options.imageIdentifier,
				emulators,
			);
		} else if (options.emulatorIdOrName) {
			emulator = this.$emulatorHelper.getEmulatorByIdOrName(
				options.emulatorIdOrName,
				emulators,
			);
		}

		if (!emulator) {
			const additionalErrors = errors && errors.length ? errors : [];
			return [
				`Unable to find emulator with provided options: ${options}`,
				...additionalErrors,
			];
		}

		// emulator is already running
		if (emulator.status === constants.RUNNING_EMULATOR_STATUS) {
			return null;
		}

		options.emulator = emulator;
		const emulatorService = this.resolveEmulatorServices(emulator.platform);
		const result = await emulatorService.startEmulator(options);
		return result.errors && result.errors.length ? result.errors : null;
	}

	public get platform(): string {
		return this._platform;
	}

	public get deviceCount(): number {
		return this._device ? 1 : this.getDeviceInstances().length;
	}

	@exported("devicesService")
	public getDevices(): Mobile.IDeviceInfo[] {
		return this.getDeviceInstances().map(
			(deviceInstance) => deviceInstance.deviceInfo,
		);
	}

	public getDevicesForPlatform(platform: string): Mobile.IDevice[] {
		return _.filter(
			this.getDeviceInstances(),
			(d) => d.deviceInfo.platform.toLowerCase() === platform.toLowerCase(),
		);
	}

	public isAndroidDevice(device: Mobile.IDevice): boolean {
		return this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform);
	}

	public isiOSDevice(device: Mobile.IDevice): boolean {
		return (
			this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) &&
			!device.isEmulator
		);
	}

	public isiOSSimulator(device: Mobile.IDevice): boolean {
		return !!(
			this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) &&
			device.isEmulator
		);
	}

	/* tslint:disable:no-unused-variable */
	@exported("devicesService")
	public setLogLevel(logLevel: string, deviceIdentifier?: string): void {
		this.$deviceLogProvider.setLogLevel(logLevel, deviceIdentifier);
	}
	/* tslint:enable:no-unused-variable */

	@exported("devicesService")
	public isAppInstalledOnDevices(
		deviceIdentifiers: string[],
		appId: string,
		projectName: string,
		projectDir: string,
	): Promise<IAppInstalledInfo>[] {
		this.$logger.trace(
			`Called isInstalledOnDevices for identifiers ${deviceIdentifiers}. AppIdentifier is ${appId}.`,
		);
		return _.map(deviceIdentifiers, (deviceIdentifier) =>
			this.isApplicationInstalledOnDevice(deviceIdentifier, {
				appId,
				projectName,
				projectDir,
			}),
		);
	}

	public getDeviceInstances(): Mobile.IDevice[] {
		return _.values(this._devices).map((device: Mobile.IDevice) => {
			const simPlatform = (device as any).simulator?.platform;
			device.deviceInfo.platform = simPlatform ?? device.deviceInfo.platform;
			return device;
		});
	}

	@exported("devicesService")
	public async getInstalledApplications(
		deviceIdentifier: string,
	): Promise<string[]> {
		const device = await this.getDevice(deviceIdentifier);
		return device.applicationManager.getInstalledApplications();
	}

	@exported("devicesService")
	public addDeviceDiscovery(deviceDiscovery: Mobile.IDeviceDiscovery): void {
		this._otherDeviceDiscoveries.push(deviceDiscovery);
		this._allDeviceDiscoveries.push(deviceDiscovery);
		this.attachToDeviceDiscoveryEvents(deviceDiscovery);
	}

	private attachToKnownDeviceDiscoveryEvents(): void {
		[
			this.$iOSSimulatorDiscovery,
			this.$iOSDeviceDiscovery,
			this.$androidDeviceDiscovery,
		].forEach(this.attachToDeviceDiscoveryEvents.bind(this));
	}

	private attachToKnownEmulatorDiscoveryEvents(): void {
		this.$androidEmulatorDiscovery.on(
			constants.EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND,
			(emulator: Mobile.IDeviceInfo) => this.onEmulatorImageFound(emulator),
		);
		this.$androidEmulatorDiscovery.on(
			constants.EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST,
			(emulator: Mobile.IDeviceInfo) => this.onEmulatorImageLost(emulator),
		);
		this.$iOSSimulatorDiscovery.on(
			constants.EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND,
			(emulator: Mobile.IDeviceInfo) => this.onEmulatorImageFound(emulator),
		);
		this.$iOSSimulatorDiscovery.on(
			constants.EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST,
			(emulator: Mobile.IDeviceInfo) => this.onEmulatorImageLost(emulator),
		);
	}

	private attachToDeviceDiscoveryEvents(
		deviceDiscovery: Mobile.IDeviceDiscovery,
	): void {
		deviceDiscovery.on(
			constants.DeviceDiscoveryEventNames.DEVICE_FOUND,
			(device: Mobile.IDevice) => this.onDeviceFound(device),
		);
		deviceDiscovery.on(
			constants.DeviceDiscoveryEventNames.DEVICE_UPDATED,
			(device: Mobile.IDevice) => this.onDeviceUpdated(device),
		);
		deviceDiscovery.on(
			constants.DeviceDiscoveryEventNames.DEVICE_LOST,
			(device: Mobile.IDevice) => this.onDeviceLost(device),
		);
	}

	private onDeviceFound(device: Mobile.IDevice): void {
		this.$logger.trace(
			`Found device with identifier '${device.deviceInfo.identifier}'`,
		);
		this._devices[device.deviceInfo.identifier] = device;
		this.emit(constants.DeviceDiscoveryEventNames.DEVICE_FOUND, device);
	}

	private onDeviceUpdated(device: Mobile.IDevice): void {
		this.$logger.trace(
			`Updated device with identifier '${device.deviceInfo.identifier}'`,
		);
		this._devices[device.deviceInfo.identifier] = device;
		this.emit(constants.DeviceDiscoveryEventNames.DEVICE_UPDATED, device);
	}

	private onDeviceLost(device: Mobile.IDevice): void {
		this.$logger.trace(
			`Lost device with identifier '${device.deviceInfo.identifier}'`,
		);

		if (device.detach) {
			device.detach();
		}

		delete this._devices[device.deviceInfo.identifier];
		this.emit(constants.DeviceDiscoveryEventNames.DEVICE_LOST, device);
	}

	private onEmulatorImageFound(emulator: Mobile.IDeviceInfo): void {
		this.$logger.trace(
			`Found emulator with image identifier: ${emulator.imageIdentifier}`,
		);
		this._availableEmulators[emulator.imageIdentifier] = emulator;
		this.emit(constants.EmulatorDiscoveryNames.EMULATOR_IMAGE_FOUND, emulator);
	}

	private onEmulatorImageLost(emulator: Mobile.IDeviceInfo): void {
		this.$logger.trace(
			`Lost emulator with image identifier ${emulator.imageIdentifier}`,
		);
		delete this._availableEmulators[emulator.imageIdentifier];
		this.emit(constants.EmulatorDiscoveryNames.EMULATOR_IMAGE_LOST, emulator);
	}

	/**
	 * Starts looking for devices. Any found devices are pushed to "_devices" variable.
	 */
	protected async detectCurrentlyAttachedDevices(
		deviceInitOpts?: Mobile.IDeviceLookingOptions,
	): Promise<void> {
		const options = this.getDeviceLookingOptions(deviceInitOpts);

		for (const deviceDiscovery of this._allDeviceDiscoveries) {
			try {
				await deviceDiscovery.startLookingForDevices(options);
			} catch (err) {
				this.$logger.trace("Error while checking for devices.", err);
			}
		}
	}

	protected async detectCurrentlyAvailableEmulators() {
		try {
			await this.$androidEmulatorDiscovery.startLookingForDevices();
		} catch (err) {
			this.$logger.trace(`Error while checking for Android emulators. ${err}`);
		}

		try {
			await this.$iOSSimulatorDiscovery.checkForAvailableSimulators();
		} catch (err) {
			this.$logger.trace(`Error while checking for iOS simulators. ${err}`);
		}
	}

	@exported("devicesService")
	public startDeviceDetectionInterval(
		deviceInitOpts: Mobile.IDeviceLookingOptions = <any>{},
	): void {
		if (!this.deviceDetectionInterval) {
			let isDeviceDetectionIntervalInProgress = false;

			this.deviceDetectionInterval = setInterval(async () => {
				if (isDeviceDetectionIntervalInProgress) {
					return;
				}

				isDeviceDetectionIntervalInProgress = true;

				await this.detectCurrentlyAttachedDevices(deviceInitOpts);

				try {
					const trustedDevices = _.filter(
						this._devices,
						(device) => device.deviceInfo.status === constants.CONNECTED_STATUS,
					);
					await settlePromises(
						_.map(trustedDevices, (device) =>
							device.applicationManager.checkForApplicationUpdates(),
						),
					);
				} catch (err) {
					this.$logger.trace(
						"Error checking for application updates on devices.",
						err,
					);
				}

				isDeviceDetectionIntervalInProgress = false;
			}, deviceInitOpts.detectionInterval || DevicesService.DEVICE_LOOKING_INTERVAL);

			this.deviceDetectionInterval.unref();
		}
	}

	@exported("devicesService")
	public startEmulatorDetectionInterval(
		opts: Mobile.IHasDetectionInterval = {},
	): void {
		let isEmulatorDetectionIntervalRunning = false;
		this.emulatorDetectionInterval = setInterval(async () => {
			if (isEmulatorDetectionIntervalRunning) {
				return;
			}

			isEmulatorDetectionIntervalRunning = true;
			await this.detectCurrentlyAvailableEmulators();
			isEmulatorDetectionIntervalRunning = false;
		}, opts.detectionInterval || DevicesService.EMULATOR_IMAGES_DETECTION_INTERVAL);

		this.emulatorDetectionInterval.unref();
	}

	@exported("devicesService")
	public stopDeviceDetectionInterval(): void {
		if (this.deviceDetectionInterval) {
			clearInterval(this.deviceDetectionInterval as unknown as number);
		}
	}

	@exported("devicesService")
	public stopEmulatorDetectionInterval(): void {
		if (this.emulatorDetectionInterval) {
			clearInterval(this.emulatorDetectionInterval as unknown as number);
		}
	}

	/**
	 * Returns device that matches an identifier.
	 * The identifier is expected to be the same as the running device declares it (emulator-5554 for android or GUID for ios).
	 * @param identifier running emulator or device identifier
	 */
	public getDeviceByIdentifier(identifier: string): Mobile.IDevice {
		const searchedDevice = _.find(
			this.getDeviceInstances(),
			(device: Mobile.IDevice) => {
				if (
					this.$mobileHelper.isApplePlatform(device.deviceInfo.platform) &&
					device.isEmulator
				) {
					return (
						device.deviceInfo.identifier === identifier ||
						device.deviceInfo.displayName === identifier
					);
				}
				return device.deviceInfo.identifier === identifier;
			},
		);
		if (!searchedDevice) {
			this.$errors.fail(
				this.$messages.Devices
					.NotFoundDeviceByIdentifierErrorMessageWithIdentifier,
				identifier,
				this.$staticConfig.CLIENT_NAME.toLowerCase(),
			);
		}

		return searchedDevice;
	}

	/**
	 * Starts looking for running devices. All found devices are pushed to _devices variable.
	 */
	private async startLookingForDevices(
		deviceInitOpts?: Mobile.IDeviceLookingOptions,
	): Promise<void> {
		this.$logger.trace(
			"startLookingForDevices; platform is %s",
			this._platform,
		);

		if (this._platform) {
			return this.detectCurrentlyAttachedDevices(deviceInitOpts);
		}

		await this.detectCurrentlyAttachedDevices(deviceInitOpts);
		await this.detectCurrentlyAvailableEmulators();

		await this.startDeviceDetectionInterval(deviceInitOpts);
	}

	/**
	 * Returns device depending on the passed index.
	 * The index refers to assigned number to listed devices by ns device command.
	 * @param index assigned device number
	 */
	private getDeviceByIndex(index: number): Mobile.IDevice {
		this.validateIndex(index - 1);
		return this.getDeviceInstances()[index - 1];
	}

	/**
	 * Returns running device for specified --device <DeviceId>.
	 * Method expects running devices.
	 * @param deviceOption parameter passed by the user to --device flag. Can be name, identifier or imageIdentifier.
	 */
	public async getDevice(deviceOption: string): Promise<Mobile.IDevice> {
		let device: Mobile.IDevice = null;

		if (!device) {
			device = _.find(
				this.getDeviceInstances(),
				(d) =>
					(d.deviceInfo.identifier &&
						d.deviceInfo.identifier === deviceOption) ||
					(d.deviceInfo.displayName &&
						d.deviceInfo.displayName === deviceOption) ||
					(d.deviceInfo.imageIdentifier &&
						d.deviceInfo.imageIdentifier === deviceOption),
			);
		}

		if (!device && helpers.isNumberWithoutExponent(deviceOption)) {
			device = this.getDeviceByIndex(parseInt(deviceOption, 10));
		}

		if (!device) {
			this.$errors.fail(
				this.$messages.Devices
					.NotFoundDeviceByIdentifierErrorMessageWithIdentifier,
				deviceOption,
				this.$staticConfig.CLIENT_NAME.toLowerCase(),
			);
		}

		return device;
	}

	/**
	 * Method runs action for a --device (value), specified by the user.
	 * @param action action to be executed if canExecute returns true
	 * @param canExecute predicate to decide whether the command can be ran
	 */
	private async executeOnDevice<T>(
		action: (dev: Mobile.IDevice) => Promise<T>,
		canExecute?: (_dev: Mobile.IDevice) => boolean,
	): Promise<Mobile.IDeviceActionResult<T>> {
		if (!canExecute || canExecute(this._device)) {
			return {
				deviceIdentifier: this._device.deviceInfo.identifier,
				result: await action(this._device),
			};
		}
	}

	/**
	 * Executes passed action for each found device.
	 * @param action action to be executed if canExecute returns true
	 * @param canExecute predicate to decide whether the command can be ran
	 */
	private async executeOnAllConnectedDevices<T>(
		action: (dev: Mobile.IDevice) => Promise<T>,
		canExecute?: (_dev: Mobile.IDevice) => boolean,
	): Promise<Mobile.IDeviceActionResult<T>[]> {
		const devices = this.filterDevicesByPlatform();
		const sortedDevices = _.sortBy(
			devices,
			(device) => device.deviceInfo.platform,
		);
		const result: Mobile.IDeviceActionResult<T>[] = [];

		const errors: Mobile.IDeviceError[] = [];
		for (const device of sortedDevices) {
			try {
				if (!canExecute || canExecute(device)) {
					result.push({
						deviceIdentifier: device.deviceInfo.identifier,
						result: await action(device),
					});
				}
			} catch (err) {
				err.deviceIdentifier = device.deviceInfo.identifier;
				this.$logger.trace(
					`Error while executing action on device ${device.deviceInfo.identifier}. The error is`,
					err,
				);
				errors.push(err);
			}
		}

		if (errors.length) {
			let preErrorMsg = "";
			if (errors.length > 1) {
				preErrorMsg = "Multiple errors were thrown:" + EOL;
			}

			const errorMessage = `${preErrorMsg}${errors
				.map((e) => e.stack || e.message || e)
				.join(EOL)}`;
			this.$errors.fail(errorMessage);
		}

		return result;
	}

	@exported("devicesService")
	public deployOnDevices(
		deviceIdentifiers: string[],
		packagePath: string,
		appId: string | Mobile.IProjectIdentifier,
		projectName: string,
		projectDir: string,
	): Promise<void>[] {
		this.$logger.trace(
			`Called deployOnDevices for identifiers ${deviceIdentifiers} for packageFile: ${packagePath}. Application identifier is ${appId}. Project Name is: ${projectName}`,
		);
		return _.map(deviceIdentifiers, async (deviceIdentifier) => {
			const device = this.getDeviceByIdentifier(deviceIdentifier);

			let identifier: string;
			if (typeof appId === "string") {
				identifier = appId;
			} else {
				identifier = appId[device.deviceInfo.platform.toLowerCase()];
			}

			return this.deployOnDevice(device, {
				packagePath,
				appId: identifier,
				projectName,
				projectDir,
			});
		});
	}

	/**
	 * Runs the passed action if the predicate "canExecute" returns true
	 * @param action action to be executed if canExecute returns true.
	 * @param canExecute predicate to decide whether the command can be ran
	 * @param options all possible options that can be passed to the command.
	 */
	public async execute<T>(
		action: (device: Mobile.IDevice) => Promise<T>,
		canExecute?: (dev: Mobile.IDevice) => boolean,
		options?: { allowNoDevices?: boolean },
	): Promise<Mobile.IDeviceActionResult<T>[]> {
		assert.ok(this._isInitialized, "Devices services not initialized!");

		if (this.hasDevices) {
			if (
				this.$hostInfo.isDarwin &&
				this._platform &&
				this.$mobileHelper.isiOSPlatform(this._platform) &&
				this.$options.emulator &&
				!this.isOnlyiOSSimultorRunning()
			) {
				// Executes the command only on iOS simulator
				const originalCanExecute = canExecute;
				canExecute = (dev: Mobile.IDevice): boolean =>
					this.isiOSSimulator(dev) &&
					(!originalCanExecute || !!originalCanExecute(dev));
			}

			return this.executeCore(action, canExecute);
		} else {
			const message = constants.ERROR_NO_DEVICES;
			if (options && options.allowNoDevices) {
				this.$logger.info(message);
			} else {
				if (
					!this.$hostInfo.isDarwin &&
					this._platform &&
					this.$mobileHelper.isiOSPlatform(this._platform)
				) {
					this.$errors.fail(message);
				} else {
					return this.executeCore(action, canExecute);
				}
			}
		}
	}

	/**
	 * Starts emulator or simulator if necessary depending on --device or --emulator flags.
	 * If no options are passed runs default emulator/simulator if no devices are connected.
	 * @param deviceInitOpts mainly contains information about --emulator and --deviceId flags.
	 */
	protected async startEmulatorIfNecessary(
		deviceInitOpts?: Mobile.IDevicesServicesInitializationOptions,
	): Promise<void> {
		if (deviceInitOpts && deviceInitOpts.deviceId && deviceInitOpts.emulator) {
			this.$errors.fail(`--device and --emulator are incompatible options.
			If you are trying to run on specific emulator, use "${this.$staticConfig.CLIENT_NAME} run --device <DeviceID>`);
		}

		if (
			deviceInitOpts &&
			deviceInitOpts.platform &&
			!deviceInitOpts.skipEmulatorStart
		) {
			// are there any running devices
			this._platform = deviceInitOpts.platform;
			try {
				await this.startLookingForDevices(
					<Mobile.IDeviceLookingOptions>deviceInitOpts,
				);
			} catch (err) {
				this.$logger.trace("Error while checking for devices.", err);
			}
			const deviceInstances = this.getDeviceInstances();

			if (!deviceInitOpts.deviceId && _.isEmpty(deviceInstances)) {
				if (
					!this.$hostInfo.isDarwin &&
					this.$mobileHelper.isApplePlatform(deviceInitOpts.platform)
				) {
					this.$errors.fail(constants.ERROR_NO_DEVICES_CANT_USE_IOS_SIMULATOR);
				}
			}

			try {
				await this._startEmulatorIfNecessary(deviceInitOpts);
			} catch (err) {
				const errorMessage = this.getEmulatorError(
					err,
					deviceInitOpts.platform,
				);

				this.$errors.fail(errorMessage);
			}
		}
	}

	private async _startEmulatorIfNecessary(
		data?: Mobile.IDevicesServicesInitializationOptions,
	): Promise<void> {
		const deviceInstances = this.getDeviceInstances();

		//if no --device is passed and no devices are found, the default emulator is started
		if (!data.deviceId && _.isEmpty(deviceInstances)) {
			return this.startEmulatorCore(data);
		}

		//check if --device(value) is running, if it's not or it's not the same as is specified, start with name from --device(value)
		if (data.deviceId) {
			if (!helpers.isNumberWithoutExponent(data.deviceId)) {
				const activeDeviceInstance = _.find(
					deviceInstances,
					(device: Mobile.IDevice) =>
						device.deviceInfo.identifier === data.deviceId,
				);
				if (!activeDeviceInstance) {
					return this.startEmulatorCore(data);
				}
			}
		}

		// make sure if the target platform is visionOS we don't try to run it on an already running iOS simulator...
		if (
			data.platform === this.$devicePlatformsConstants.visionOS &&
			deviceInstances.length
		) {
			const runningDeviceInstance = deviceInstances.find(
				(device) =>
					device.deviceInfo.platform ===
					this.$devicePlatformsConstants.visionOS,
			);
			if (!runningDeviceInstance) {
				return this.startEmulatorCore(data);
			}
		}

		// if only emulator flag is passed and no other emulators are running, start default emulator
		if (data.emulator && deviceInstances.length) {
			const runningDeviceInstance = _.some(
				deviceInstances,
				(value) => value.isEmulator,
			);
			if (!runningDeviceInstance) {
				return this.startEmulatorCore(data);
			}
		}
	}

	private _deviceInitializePromise: Promise<void>;
	/**
	 * Takes care of gathering information about all running devices.
	 * Sets "_isInitialized" to true after infomation is present.
	 * Method expects running devices.
	 * @param data mainly contains information about --emulator and --deviceId flags.
	 */
	@exported("devicesService")
	public async initialize(
		data?: Mobile.IDevicesServicesInitializationOptions,
	): Promise<void> {
		if (!this._deviceInitializePromise) {
			this._deviceInitializePromise = this.initializeCore(data);
		}

		try {
			await this._deviceInitializePromise;
		} catch (err) {
			// In case the initalization fails, we want to allow calling `initlialize` again with other arguments for example, so remove the cached promise value.
			this.$logger.trace(`Error while initializing devicesService: ${err}`);
			this._deviceInitializePromise = null;
			throw err;
		}
	}

	public getPlatformsFromDeviceDescriptors(
		deviceDescriptors: ILiveSyncDeviceDescriptor[],
	): string[] {
		const platforms = _(deviceDescriptors)
			.map((device) => this.getDeviceByIdentifier(device.identifier))
			.map((device) => device.deviceInfo.platform.toLowerCase())
			.uniq()
			.value();

		return platforms;
	}

	private async initializeCore(
		deviceInitOpts?: Mobile.IDevicesServicesInitializationOptions,
	): Promise<void> {
		if (this._isInitialized) {
			return;
		}

		if (!this.$options.json) {
			this.$logger.info("Searching for devices...");
		}

		deviceInitOpts = deviceInitOpts || {};
		this._data = deviceInitOpts;

		if (!deviceInitOpts.skipEmulatorStart) {
			// TODO: Remove from here as it calls startLookingForDevices, so we double the calls to specific device detection services
			await this.startEmulatorIfNecessary(deviceInitOpts);
		}

		const platform = deviceInitOpts.platform;
		const deviceOption = deviceInitOpts.deviceId;
		const deviceLookingOptions: Mobile.IDeviceLookingOptions = {
			emulator: deviceInitOpts.emulator,
			platform: deviceInitOpts.platform,
			shouldReturnImmediateResult: deviceInitOpts.shouldReturnImmediateResult,
			detectionInterval: deviceInitOpts.detectionInterval,
			fullDiscovery: deviceInitOpts.fullDiscovery,
		};

		if (platform && deviceOption) {
			this._platform = this.$mobileHelper.validatePlatformName(
				deviceInitOpts.platform,
			);
			await this.startLookingForDevices(deviceLookingOptions);
			this._device = await this.getDevice(deviceOption);

			if (this._device.deviceInfo.platform !== this._platform) {
				this.$errors.fail(constants.ERROR_CANNOT_RESOLVE_DEVICE);
			}
			this.$logger.warn(
				"Your application will be deployed only on the device specified by the provided index or identifier.",
			);
		} else if (!platform && deviceOption) {
			await this.startLookingForDevices(deviceLookingOptions);
			this._device = await this.getDevice(deviceOption);
			this._platform = this._device.deviceInfo.platform;
		} else if (platform && !deviceOption) {
			this._platform = this.$mobileHelper.validatePlatformName(platform);
			await this.startLookingForDevices(deviceLookingOptions);
		} else {
			// platform and deviceId are not specified
			if (deviceInitOpts.skipInferPlatform) {
				if (deviceInitOpts.skipDeviceDetectionInterval) {
					await this.detectCurrentlyAttachedDevices(deviceLookingOptions);
				} else {
					deviceInitOpts.shouldReturnImmediateResult = true;
					await this.startLookingForDevices(deviceLookingOptions);
				}
			} else {
				await this.startLookingForDevices(deviceLookingOptions);

				const devices = this.getDeviceInstances();
				const platforms = _(devices)
					.map((device) => device.deviceInfo.platform)
					.filter((pl) => {
						try {
							return !!this.$mobileHelper.validatePlatformName(pl);
						} catch (err) {
							this.$logger.warn(err.message);
							return null;
						}
					})
					.uniq()
					.value();

				if (platforms.length === 1) {
					this._platform = platforms[0];
				} else if (platforms.length === 0) {
					this.$errors.fail(constants.ERROR_NO_DEVICES);
				} else {
					this.$errors.fail(
						"Multiple device platforms detected (%s). Specify platform or device on command line.",
						helpers.formatListOfNames(platforms, "and"),
					);
				}
			}
		}

		if (
			!this.$hostInfo.isDarwin &&
			this._platform &&
			this.$mobileHelper.isiOSPlatform(this._platform) &&
			this.$options.emulator
		) {
			this.$errors.fail(constants.ERROR_CANT_USE_SIMULATOR);
		}
		this._isInitialized = true;
	}

	public get hasDevices(): boolean {
		if (!this._platform) {
			return this.getDeviceInstances().length !== 0;
		} else {
			return this.filterDevicesByPlatform().length !== 0;
		}
	}

	public isOnlyiOSSimultorRunning(): boolean {
		const devices = this.getDeviceInstances();
		return (
			this._platform &&
			this.$mobileHelper.isiOSPlatform(this._platform) &&
			_.find(devices, (d) => d.isEmulator) &&
			!_.find(devices, (d) => !d.isEmulator)
		);
	}

	public getDeviceByDeviceOption(): Mobile.IDevice {
		return this._device;
	}

	@exported("devicesService")
	public async mapAbstractToTcpPort(
		deviceIdentifier: string,
		appIdentifier: string,
		framework: string,
	): Promise<string> {
		return this.$androidProcessService.mapAbstractToTcpPort(
			deviceIdentifier,
			appIdentifier,
			framework,
		);
	}

	@exported("devicesService")
	public getDebuggableApps(
		deviceIdentifiers: string[],
	): Promise<Mobile.IDeviceApplicationInformation[]>[] {
		return _.map(deviceIdentifiers, (deviceIdentifier: string) =>
			this.getDebuggableAppsCore(deviceIdentifier),
		);
	}

	@exported("devicesService")
	public async getDebuggableViews(
		deviceIdentifier: string,
		appIdentifier: string,
	): Promise<Mobile.IDebugWebViewInfo[]> {
		const device = this.getDeviceByIdentifier(deviceIdentifier),
			debuggableViewsPerApp =
				await device.applicationManager.getDebuggableAppViews([appIdentifier]);

		return debuggableViewsPerApp && debuggableViewsPerApp[appIdentifier];
	}

	private getDebuggableAppsCore(
		deviceIdentifier: string,
	): Promise<Mobile.IDeviceApplicationInformation[]> {
		const device = this.getDeviceByIdentifier(deviceIdentifier);
		return device.applicationManager.getDebuggableApps();
	}

	private async deployOnDevice(
		device: Mobile.IDevice,
		appData: Mobile.IInstallAppData,
	): Promise<void> {
		await device.applicationManager.reinstallApplication(
			appData.appId,
			appData.packagePath,
		);
		this.$logger.info(
			`Successfully deployed on device with identifier '${device.deviceInfo.identifier}'.`,
		);
		await device.applicationManager.tryStartApplication(appData);
	}

	private filterDevicesByPlatform(): Mobile.IDevice[] {
		return _.filter(this.getDeviceInstances(), (device: Mobile.IDevice) => {
			if (this.$options.emulator && !device.isEmulator) {
				return false;
			}
			if (this._platform) {
				return device.deviceInfo.platform === this._platform;
			}
			return true;
		});
	}

	private validateIndex(index: number): void {
		if (index < 0 || index > this.getDeviceInstances().length) {
			throw new Error(
				util.format(
					this.$messages.Devices.NotFoundDeviceByIndexErrorMessage,
					index,
					this.$staticConfig.CLIENT_NAME.toLowerCase(),
				),
			);
		}
	}

	private resolveEmulatorServices(
		platform?: string,
	): Mobile.IEmulatorPlatformService {
		platform = platform || this._platform;
		if (this.$mobileHelper.isApplePlatform(platform)) {
			return this.$injector.resolve("iOSEmulatorServices");
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return this.$injector.resolve("androidEmulatorServices");
		}

		return null;
	}

	/**
	 * Starts emulator for platform and makes sure started devices/emulators/simulators are in _devices array before finishing.
	 * @param platform (optional) platform to start emulator/simulator for
	 * @param emulatorIdOrName (optional) emulator/simulator image identifier or name
	 */
	protected async startEmulatorCore(
		deviceInitOpts: Mobile.IDevicesServicesInitializationOptions = {},
	): Promise<void> {
		const { deviceId } = deviceInitOpts;
		const platform = deviceInitOpts.platform || this._platform;
		const emulatorServices = this.resolveEmulatorServices(platform);
		if (!emulatorServices) {
			this.$errors.fail(
				"Unable to detect platform for which to start emulator.",
			);
		}

		const result = await emulatorServices.startEmulator({
			emulatorIdOrName: deviceId,
			imageIdentifier: deviceId,
			platform: platform,
			sdk: this._data && this._data.sdk,
		});
		if (result && result.errors && result.errors.length) {
			this.$errors.fail(result.errors.join("\n"));
		}

		const deviceLookingOptions = this.getDeviceLookingOptions(deviceInitOpts);
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			await this.$androidDeviceDiscovery.startLookingForDevices(
				deviceLookingOptions,
			);
		} else if (
			this.$mobileHelper.isiOSPlatform(platform) &&
			this.$hostInfo.isDarwin
		) {
			await this.$iOSSimulatorDiscovery.startLookingForDevices(
				deviceLookingOptions,
			);
		}
	}

	private async executeCore<T>(
		action: (device: Mobile.IDevice) => Promise<T>,
		canExecute?: (dev: Mobile.IDevice) => boolean,
	): Promise<Mobile.IDeviceActionResult<T>[]> {
		if (this._device) {
			return [await this.executeOnDevice(action, canExecute)];
		}

		return this.executeOnAllConnectedDevices(action, canExecute);
	}

	private async isApplicationInstalledOnDevice(
		deviceIdentifier: string,
		appData: Mobile.IApplicationData,
	): Promise<IAppInstalledInfo> {
		let isInstalled = false;
		const device = this.getDeviceByIdentifier(deviceIdentifier);

		try {
			isInstalled = await device.applicationManager.isApplicationInstalled(
				appData.appId,
			);
			await device.applicationManager.tryStartApplication(appData);
		} catch (err) {
			this.$logger.trace(
				"Error while checking is application installed. Error is: ",
				err,
			);
		}

		return {
			appIdentifier: appData.appId,
			deviceIdentifier,
			isInstalled,
		};
	}

	private getDeviceLookingOptions(
		deviceInitOpts: Mobile.IDevicesServicesInitializationOptions = {},
	): Mobile.IDeviceLookingOptions {
		const { shouldReturnImmediateResult, emulator } = deviceInitOpts;
		const platform = deviceInitOpts.platform || this._platform;

		return {
			platform,
			shouldReturnImmediateResult: !!shouldReturnImmediateResult,
			emulator: !!emulator,
			fullDiscovery: deviceInitOpts.fullDiscovery,
		};
	}

	private getEmulatorError(error: Error, platform: string): string {
		let emulatorName = constants.DeviceTypes.Emulator;

		if (this.$mobileHelper.isiOSPlatform(platform)) {
			emulatorName = constants.DeviceTypes.Simulator;
		}

		return (
			`Cannot find connected devices.${EOL}` +
			`${emulatorName} start failed with: ${error.message}${EOL}` +
			`To list currently connected devices and verify that the specified identifier exists, run '${this.$staticConfig.CLIENT_NAME.toLowerCase()} device'.${EOL}` +
			`To list available ${emulatorName.toLowerCase()} images, run '${this.$staticConfig.CLIENT_NAME.toLowerCase()} device <Platform> --available-devices'.`
		);
	}
}

injector.register("devicesService", DevicesService);
