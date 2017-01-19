export class LivesyncCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $usbLiveSyncService: ILiveSyncService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $platformService: IPlatformService,
		private $errors: IErrors) { }

	public execute(args: string[]): IFuture<void> {

		if (!this.$options.help && args[0]) {
			this.$logger.warn('This command is deprecated. It will be removed in the next version of NativeScript CLI. Use "$ tns run" command instead.');
		}

		this.$platformService.deployPlatform(args[0]).wait();
		return this.$usbLiveSyncService.liveSync(args[0]);
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (args.length >= 2) {
				this.$errors.fail("Invalid number of arguments.");
			}
			let platform = args[0];
			if (platform) {
				return _.includes(this.$mobileHelper.platformNames, this.$mobileHelper.normalizePlatformName(platform)) && this.$platformService.validateOptions(args[0]).wait();
			} else {
				return this.$platformService.validateOptions().wait();
			}
		}).future<boolean>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("livesync", LivesyncCommand);
