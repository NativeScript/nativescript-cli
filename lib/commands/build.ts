export class BuildCommandBase {
	constructor(protected $options: IOptions,
		private $platformService: IPlatformService) { }

	executeCore(args: string[], buildConfig?: IBuildConfig): IFuture<void> {
		return (() => {
			let platform = args[0].toLowerCase();
			this.$platformService.buildPlatform(platform, buildConfig).wait();
			if(this.$options.copyTo) {
				this.$platformService.copyLastOutput(platform, this.$options.copyTo, {isForDevice: this.$options.forDevice}).wait();
			}
		}).future<void>()();
	}
}

export class BuildIosCommand extends BuildCommandBase implements  ICommand {
	constructor(protected $options: IOptions,
				private $platformsData: IPlatformsData,
				$platformService: IPlatformService) {
		super($options, $platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}
}
$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildAndroidCommand extends BuildCommandBase implements  ICommand {
	constructor(protected $options: IOptions,
				private $platformsData: IPlatformsData,
				private $errors: IErrors,
				$platformService: IPlatformService) {
		super($options, $platformService);
	}

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}

	public allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
				this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
			}
			return args.length === 0;
		}).future<boolean>()();
	}
}
$injector.registerCommand("build|android", BuildAndroidCommand);
