export class RunCommandBase {
	constructor(protected $platformService: IPlatformService,
		protected $usbLiveSyncService: ILiveSyncService,
		protected $options: IOptions) { }

	public executeCore(args: string[]): IFuture<void> {
		this.$platformService.deployPlatform(args[0]).wait();

		if (this.$options.bundle) {
			this.$options.watch = false;
		}

		if (this.$options.release) {
			return this.$platformService.runPlatform(args[0]);
		}

		return this.$usbLiveSyncService.liveSync(args[0]);
	}
}

export class RunIosCommand extends RunCommandBase implements ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		$usbLiveSyncService: ILiveSyncService,
		$options: IOptions,
		private $injector: IInjector) {
		super($platformService, $usbLiveSyncService, $options);
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
$injector.registerCommand("run|ios", RunIosCommand);

export class RunAndroidCommand extends RunCommandBase implements ICommand {
	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		$usbLiveSyncService: ILiveSyncService,
		$options: IOptions,
		private $errors: IErrors) {
		super($platformService, $usbLiveSyncService, $options);
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
			return args.length === 0 && this.$platformService.validateOptions(this.$platformsData.availablePlatforms.Android).wait();
		}).future<boolean>()();
	}
}
$injector.registerCommand("run|android", RunAndroidCommand);
