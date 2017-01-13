export class DevicesCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [this.$stringParameter];

	constructor(
		private $stringParameter: ICommandParameter,
		private $emulatorPlatformService: IEmulatorPlatformService,
		private $options: IOptions) {}

	public async execute(args: string[]): Promise<void> {
		if (this.$options.availableDevices) {
			return this.$emulatorPlatformService.listAvailableEmulators(args[0]);
		}
		return $injector.resolveCommand("device").execute(args);
	}
}

$injector.registerCommand("devices", DevicesCommand);
