export class DeployOnDeviceCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter,
		private $options: IOptions,
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper) { }

	public async execute(args: string[]): Promise<void> {
		return this.$platformService.deployPlatform(args[0], true);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || !args.length || args.length > 1) {
			return false;
		}

		if (!(await this.$platformCommandParameter.validate(args[0]))) {
			return false;
		}

		if (this.$mobileHelper.isAndroidPlatform(args[0]) && this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
		}

		return this.$platformService.validateOptions(args[0]);
	}
}

$injector.registerCommand("deploy", DeployOnDeviceCommand);
