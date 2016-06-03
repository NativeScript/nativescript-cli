export class DebugPlatformCommand implements ICommand {
	constructor(private debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		protected $options: IOptions) { }

	execute(args: string[]): IFuture<void> {
		return this.debugService.debug();
	}

	allowedParameters: ICommandParameter[] = [];

	canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			this.$devicesService.initialize({ platform: this.debugService.platform, deviceId: this.$options.device }).wait();
			if(this.$options.emulator) {
				return true;
			}

			if(this.$devicesService.deviceCount === 0) {
				this.$errors.failWithoutHelp("No devices detected. Connect a device and try again.");
			} else if (this.$devicesService.deviceCount > 1) {
				this.$errors.fail("Cannot debug on multiple devices. Select device with --device option.");
			}

			return true;
		}).future<boolean>()();
	}
}

export class DebugIOSCommand extends DebugPlatformCommand {
	constructor($iOSDebugService: IDebugService,
		$devicesService: Mobile.IDevicesService,
		$errors: IErrors,
		$options: IOptions) {
		super($iOSDebugService, $devicesService, $errors, $options);
	}
}
$injector.registerCommand("debug|ios", DebugIOSCommand);

export class DebugAndroidCommand extends DebugPlatformCommand {
	constructor($androidDebugService: IDebugService,
		$devicesService: Mobile.IDevicesService,
		$errors: IErrors,
		$options: IOptions) {
		super($androidDebugService, $devicesService, $errors, $options);
	}
}
$injector.registerCommand("debug|android", DebugAndroidCommand);
