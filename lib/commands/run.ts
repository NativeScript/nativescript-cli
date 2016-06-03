export class RunCommandBase {
	constructor(private $platformService: IPlatformService) { }

	public executeCore(args: string[], buildConfig?: IBuildConfig): IFuture<void> {
		return this.$platformService.runPlatform(args[0], buildConfig);
	}
}

export class RunIosCommand extends RunCommandBase implements ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData) {
		super($platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}
}
$injector.registerCommand("run|ios", RunIosCommand);

export class RunAndroidCommand extends RunCommandBase implements ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
				private $options: IOptions,
				private $errors: IErrors) {
			super($platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
				this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
			}
			return args.length === 0;
		}).future<boolean>()();
	}
}
$injector.registerCommand("run|android", RunAndroidCommand);
