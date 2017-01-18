export class RunCommandBase {
	constructor(protected $platformService: IPlatformService,
		protected $usbLiveSyncService: ILiveSyncService,
		protected $options: IOptions) { }

	public async executeCore(args: string[]): Promise<void> {
		await this.$platformService.deployPlatform(args[0]);

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
	public allowedParameters: ICommandParameter[] = [];

	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		$usbLiveSyncService: ILiveSyncService,
		$options: IOptions) {
		super($platformService, $usbLiveSyncService, $options);
	}

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return args.length === 0 && await this.$platformService.validateOptions(this.$platformsData.availablePlatforms.iOS);
	}
}

$injector.registerCommand("run|ios", RunIosCommand);

export class RunAndroidCommand extends RunCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		$usbLiveSyncService: ILiveSyncService,
		$options: IOptions,
		private $errors: IErrors) {
		super($platformService, $usbLiveSyncService, $options);
	}

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
		}
		return args.length === 0 && await this.$platformService.validateOptions(this.$platformsData.availablePlatforms.Android);
	}
}

$injector.registerCommand("run|android", RunAndroidCommand);
