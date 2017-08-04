import { CONNECTED_STATUS } from "../common/constants";
import { isInteractive } from "../common/helpers";
import { cache } from "../common/decorators";
import { DebugCommandErrors } from "../constants";

export class DebugPlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private platform: string,
		private $debugService: IDebugService,
		protected $devicesService: Mobile.IDevicesService,
		protected $platformService: IPlatformService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $platformsData: IPlatformsData,
		protected $logger: ILogger,
		protected $errors: IErrors,
		private $debugDataService: IDebugDataService,
		private $liveSyncService: IDebugLiveSyncService,
		private $prompter: IPrompter,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper) {
	}

	public async execute(args: string[]): Promise<void> {
		const debugOptions = <IDebugOptions>_.cloneDeep(this.$options.argv);

		let debugData = this.$debugDataService.createDebugData(this.$projectData, this.$options);

		await this.$platformService.trackProjectType(this.$projectData);
		const selectedDeviceForDebug = await this.getDeviceForDebug();
		debugData.deviceIdentifier = selectedDeviceForDebug.deviceInfo.identifier;

		if (this.$options.start) {
			return this.$liveSyncService.printDebugInformation(await this.$debugService.debug(debugData, debugOptions));
		}

		await this.$devicesService.detectCurrentlyAttachedDevices({ shouldReturnImmediateResult: false, platform: this.platform });

		await this.$liveSyncCommandHelper.executeLiveSyncOperation([selectedDeviceForDebug], this.platform, {
			[selectedDeviceForDebug.deviceInfo.identifier]: true
		});
	}

	public async getDeviceForDebug(): Promise<Mobile.IDevice> {
		if (this.$options.forDevice && this.$options.emulator) {
			this.$errors.fail(DebugCommandErrors.UNABLE_TO_USE_FOR_DEVICE_AND_EMULATOR);
		}

		await this.$devicesService.detectCurrentlyAttachedDevices({ platform: this.platform, shouldReturnImmediateResult: false });

		if (this.$options.device) {
			const device = await this.$devicesService.getDevice(this.$options.device);
			return device;
		}

		// Now let's take data for each device:
		const availableDevicesAndEmulators = this.$devicesService.getDeviceInstances()
			.filter(d => d.deviceInfo.status === CONNECTED_STATUS && (!this.platform || d.deviceInfo.platform.toLowerCase() === this.platform.toLowerCase()));

		const selectedDevices = availableDevicesAndEmulators.filter(d => this.$options.emulator ? d.isEmulator : (this.$options.forDevice ? !d.isEmulator : true));

		if (selectedDevices.length > 1) {
			if (isInteractive()) {
				const choices = selectedDevices.map(e => `${e.deviceInfo.identifier} - ${e.deviceInfo.displayName}`);

				const selectedDeviceString = await this.$prompter.promptForChoice("Select device for debugging", choices);

				const selectedDevice = _.find(selectedDevices, d => `${d.deviceInfo.identifier} - ${d.deviceInfo.displayName}` === selectedDeviceString);
				return selectedDevice;
			} else {
				const sortedInstances = _.sortBy(selectedDevices, e => e.deviceInfo.version);
				const emulators = sortedInstances.filter(e => e.isEmulator);
				const devices = sortedInstances.filter(d => !d.isEmulator);
				let selectedInstance: Mobile.IDevice;

				if (this.$options.emulator || this.$options.forDevice) {
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

				this.$logger.warn(`Multiple devices/emulators found. Starting debugger on ${selectedInstance.deviceInfo.identifier}. ` +
					"If you want to debug on specific device/emulator, you can specify it with --device option.");

				return selectedInstance;
			}
		} else if (selectedDevices.length === 1) {
			return _.head(selectedDevices);
		}

		this.$errors.failWithoutHelp(DebugCommandErrors.NO_DEVICES_EMULATORS_FOUND_FOR_OPTIONS);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$platformService.isPlatformSupportedForOS(this.platform, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.platform} can not be built on this OS`);
		}

		if (this.$options.release) {
			this.$errors.fail("--release flag is not applicable to this command");
		}

		const platformData = this.$platformsData.getPlatformData(this.platform, this.$projectData);
		const platformProjectService = platformData.platformProjectService;
		await platformProjectService.validate(this.$projectData);

		await this.$devicesService.initialize({
			platform: this.platform,
			deviceId: this.$options.device,
			emulator: this.$options.emulator,
			skipDeviceDetectionInterval: true
		});

		return true;
	}
}

export class DebugIOSCommand implements ICommand {

	@cache()
	private get debugPlatformCommand(): DebugPlatformCommand {
		return this.$injector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { platform: this.platform });
	}

	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $errors: IErrors,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $platformService: IPlatformService,
		private $options: IOptions,
		private $injector: IInjector,
		private $projectData: IProjectData,
		private $platformsData: IPlatformsData,
		$iosDeviceOperations: IIOSDeviceOperations) {
		this.$projectData.initializeProjectData();
		// Do not dispose ios-device-lib, so the process will remain alive and the debug application (NativeScript Inspector or Chrome DevTools) will be able to connect to the socket.
		// In case we dispose ios-device-lib, the socket will be closed and the code will fail when the debug application tries to read/send data to device socket.
		// That's why the `$ tns debug ios --justlaunch` command will not release the terminal.
		// In case we do not set it to false, the dispose will be called once the command finishes its execution, which will prevent the debugging.
		$iosDeviceOperations.setShouldDispose(false);
	}

	public execute(args: string[]): Promise<void> {
		return this.debugPlatformCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		return await this.debugPlatformCommand.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.iOS);
	}

	public platform = this.$devicePlatformsConstants.iOS;
}

$injector.registerCommand("debug|ios", DebugIOSCommand);

export class DebugAndroidCommand implements ICommand {

	@cache()
	private get debugPlatformCommand(): DebugPlatformCommand {
		return this.$injector.resolve<DebugPlatformCommand>(DebugPlatformCommand, { platform: this.platform });
	}

	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $errors: IErrors,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $platformService: IPlatformService,
		private $options: IOptions,
		private $injector: IInjector,
		private $projectData: IProjectData,
		private $platformsData: IPlatformsData) {
		this.$projectData.initializeProjectData();
	}

	public execute(args: string[]): Promise<void> {
		return this.debugPlatformCommand.execute(args);
	}
	public async canExecute(args: string[]): Promise<boolean> {
		return await this.debugPlatformCommand.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.Android);
	}

	public platform = this.$devicePlatformsConstants.Android;
}

$injector.registerCommand("debug|android", DebugAndroidCommand);
