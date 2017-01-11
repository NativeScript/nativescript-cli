export class DebugPlatformCommand implements ICommand {
	constructor(private debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: IConfiguration,
		private $usbLiveSyncService: ILiveSyncService,
		protected $platformService: IPlatformService,
		protected $options: IOptions,
		protected $platformsData: IPlatformsData) { }

	execute(args: string[]): IFuture<void> {
		if (this.$options.start) {
			return this.debugService.debug();
		}

		this.$platformService.deployPlatform(this.$devicesService.platform).wait();
		this.$config.debugLivesync = true;
		let applicationReloadAction = (deviceAppData: Mobile.IDeviceAppData): IFuture<void> => {
			return (() => {
				let projectData: IProjectData = this.$injector.resolve("projectData");

				this.debugService.debugStop().wait();

				let applicationId = deviceAppData.appIdentifier;
				if (deviceAppData.device.isEmulator && deviceAppData.platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
					applicationId = projectData.projectName;
				}
				deviceAppData.device.applicationManager.stopApplication(applicationId).wait();

				this.debugService.debug().wait();
			}).future<void>()();
		};
		return this.$usbLiveSyncService.liveSync(this.$devicesService.platform, applicationReloadAction);
	}

	allowedParameters: ICommandParameter[] = [];

	canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			this.$devicesService.initialize({ platform: this.debugService.platform, deviceId: this.$options.device }).wait();
			// Start emulator if --emulator is selected or no devices found.
			if(this.$options.emulator || this.$devicesService.deviceCount === 0) {
				return true;
			}

			if (this.$devicesService.deviceCount > 1) {
				// Starting debugger on emulator.
				this.$options.emulator = true;

				this.$logger.warn("Multiple devices found! Starting debugger on emulator. If you want to debug on specific device please select device with --device option.".yellow.bold);
			}

			return true;
		}).future<boolean>()();
	}
}

export class DebugIOSCommand extends DebugPlatformCommand {
	constructor($iOSDebugService: IDebugService,
		$devicesService: Mobile.IDevicesService,
		$injector: IInjector,
		$logger: ILogger,
		$childProcess: IChildProcess,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$config: IConfiguration,
		$usbLiveSyncService: ILiveSyncService,
		$platformService: IPlatformService,
		$options: IOptions,
		$platformsData: IPlatformsData) {

		super($iOSDebugService, $devicesService, $injector, $logger, $childProcess, $devicePlatformsConstants, $config, $usbLiveSyncService, $platformService, $options, $platformsData);
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			return super.canExecute(args).wait() && this.$platformService.validateOptions(this.$platformsData.availablePlatforms.iOS).wait();
		}).future<boolean>()();
	}
}
$injector.registerCommand("debug|ios", DebugIOSCommand);

export class DebugAndroidCommand extends DebugPlatformCommand {
	constructor($androidDebugService: IDebugService,
		$devicesService: Mobile.IDevicesService,
		$injector: IInjector,
		$logger: ILogger,
		$childProcess: IChildProcess,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$config: IConfiguration,
		$usbLiveSyncService: ILiveSyncService,
		$platformService: IPlatformService,
		$options: IOptions,
		$platformsData: IPlatformsData) {

		super($androidDebugService, $devicesService, $injector, $logger, $childProcess, $devicePlatformsConstants, $config, $usbLiveSyncService, $platformService, $options, $platformsData);
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			return super.canExecute(args).wait() && this.$platformService.validateOptions(this.$platformsData.availablePlatforms.Android).wait();
		}).future<boolean>()();
	}
}
$injector.registerCommand("debug|android", DebugAndroidCommand);
