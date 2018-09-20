export class RunApplicationOnDeviceCommand implements ICommand {

	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $stringParameter: ICommandParameter,
		private $staticConfig: Config.IStaticConfig,
		private $options: ICommonOptions) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameter, this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true });

		if (this.$devicesService.deviceCount > 1) {
			this.$errors.failWithoutHelp("More than one device found. Specify device explicitly with --device option. To discover device ID, use $%s device command.", this.$staticConfig.CLIENT_NAME.toLowerCase());
		}

		await this.$devicesService.execute(async (device: Mobile.IDevice) => await device.applicationManager.startApplication({ appId: args[0], projectName: args[1] }));
	}
}

$injector.registerCommand(["device|run", "devices|run"], RunApplicationOnDeviceCommand);
