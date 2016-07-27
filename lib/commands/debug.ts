export class DebugPlatformCommand implements ICommand {
	constructor(private debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: IConfiguration,
		protected $options: IOptions) { }

	execute(args: string[]): IFuture<void> {
		if (!this.$options.rebuild && !this.$options.start) {
			this.$config.debugLivesync = true;
			let usbLiveSyncService: ILiveSyncService = this.$injector.resolve("usbLiveSyncService");
			let liveSyncServiceBase: any = this.$injector.resolve("liveSyncServiceBase");
			let liveSyncProvider: ILiveSyncProvider = this.$injector.resolve("liveSyncProvider");

			liveSyncServiceBase.on("sync", (device: Mobile.IDevice, data: ILiveSyncData) => {
				let platformLiveSyncService: IPlatformLiveSyncService = this.$injector.resolve(liveSyncProvider.platformSpecificLiveSyncServices[data.platform.toLowerCase()], { _device: device });
				let projectData: IProjectData = this.$injector.resolve("projectData");
				let appId = device.isEmulator ? projectData.projectName : data.appIdentifier;
				if (data.platform === this.$devicePlatformsConstants.iOS) {
					platformLiveSyncService.debugService.debugStop().wait();
				}
				device.applicationManager.stopApplication(appId).wait();
				platformLiveSyncService.debugService.debug().wait();
			});

			liveSyncServiceBase.on("syncAfterInstall", (device: Mobile.IDevice, data: ILiveSyncData) => {
				let platformLiveSyncService: IPlatformLiveSyncService = this.$injector.resolve(liveSyncProvider.platformSpecificLiveSyncServices[data.platform.toLowerCase()], { _device: device });
				platformLiveSyncService.debugService.debug().wait();
			});

			return usbLiveSyncService.liveSync(this.$devicesService.platform);
		}
		return this.debugService.debug();
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
		$options: IOptions) {
		super($iOSDebugService, $devicesService, $injector, $logger, $childProcess, $devicePlatformsConstants, $config, $options);
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
		$options: IOptions) {
		super($androidDebugService, $devicesService, $injector, $logger, $childProcess, $devicePlatformsConstants, $config, $options);
	}
}
$injector.registerCommand("debug|android", DebugAndroidCommand);
