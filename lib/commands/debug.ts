export class DebugPlatformCommand implements ICommand {
	constructor(private debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $usbLiveSyncService: ILiveSyncService,
		private $logger: ILogger,
		protected $options: IOptions) { }

	execute(args: string[]): IFuture<void> {
		if (!this.$options.rebuild) {
			this.$options.debug = true;
			return this.$usbLiveSyncService.liveSync(this.$devicesService.platform);
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
		$usbLiveSyncService: ILiveSyncService,
		$logger: ILogger,
		$options: IOptions) {
		super($iOSDebugService, $devicesService, $usbLiveSyncService, $logger, $options);
	}
}
$injector.registerCommand("debug|ios", DebugIOSCommand);

export class DebugAndroidCommand extends DebugPlatformCommand {
	constructor($androidDebugService: IDebugService,
		$devicesService: Mobile.IDevicesService,
		$usbLiveSyncService: ILiveSyncService,
		$logger: ILogger,
		$options: IOptions) {
		super($androidDebugService, $devicesService, $usbLiveSyncService, $logger, $options);
	}
}
$injector.registerCommand("debug|android", DebugAndroidCommand);
