export class DeployOnDeviceCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter,
				private $options: IOptions,
				private $errors: IErrors,
				private $mobileHelper: Mobile.IMobileHelper) { }

	execute(args: string[]): IFuture<void> {
		return this.$platformService.deployPlatform(args[0], true);
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (!args || !args.length || args.length > 1) {
				return false;
			}

			if (!this.$platformCommandParameter.validate(args[0]).wait()) {
				return false;
			}

			if (this.$mobileHelper.isAndroidPlatform(args[0]) && this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
				this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
			}

			return this.$platformService.validateOptions(args[0]).wait();
		}).future<boolean>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("deploy", DeployOnDeviceCommand);
