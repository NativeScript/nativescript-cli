export class DevicesCommand implements ICommand {

	constructor(
		private $stringParameter: ICommandParameter,
		private $emulatorPlatformService: IEmulatorPlatformService,
		private $options: IOptions) {}

	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	public execute(args: string[]): IFuture<void> {
		if (this.$options.availableDevices) {
			return this.$emulatorPlatformService.listAvailableEmulators(args[0]);
		}
		return $injector.resolveCommand("device").execute(args);
	}
}
$injector.registerCommand("devices", DevicesCommand);
