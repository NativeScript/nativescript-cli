export class UninstallApplicationCommand implements ICommand {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $stringParameter: ICommandParameter,
		private $options: ICommonOptions) { }

	allowedParameters: ICommandParameter[] = [this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true });

		const action = (device: Mobile.IDevice) => device.applicationManager.uninstallApplication(args[0]);
		await this.$devicesService.execute(action);
	}
}
$injector.registerCommand(["device|uninstall", "devices|uninstall"], UninstallApplicationCommand);
