export class BuildCommandBase {
	constructor(protected $options: IOptions,
		protected $platformsData: IPlatformsData,
		protected $platformService: IPlatformService) { }

	executeCore(args: string[]): IFuture<void> {
		return (() => {
			let platform = args[0].toLowerCase();
			this.$platformService.preparePlatform(platform).wait();
			this.$options.clean = true;
			this.$platformService.buildPlatform(platform).wait();
			if(this.$options.copyTo) {
				this.$platformService.copyLastOutput(platform, this.$options.copyTo, {isForDevice: this.$options.forDevice});
			}
		}).future<void>()();
	}
}

export class BuildIosCommand extends BuildCommandBase implements  ICommand {
	constructor(protected $options: IOptions,
				$platformsData: IPlatformsData,
				$platformService: IPlatformService) {
		super($options, $platformsData, $platformService);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			return args.length === 0 && this.$platformService.validateOptions(this.$platformsData.availablePlatforms.iOS).wait();
		}).future<boolean>()();
	}
}
$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildAndroidCommand extends BuildCommandBase implements  ICommand {
	constructor(protected $options: IOptions,
				$platformsData: IPlatformsData,
				private $errors: IErrors,
				$platformService: IPlatformService) {
		super($options, $platformsData, $platformService);
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
			return args.length === 0 && this.$platformService.validateOptions(this.$platformsData.availablePlatforms.Android).wait();
		}).future<boolean>()();
	}
}
$injector.registerCommand("build|android", BuildAndroidCommand);
