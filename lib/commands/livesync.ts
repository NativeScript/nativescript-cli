export class LivesyncCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $usbLiveSyncService: ILiveSyncService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $errors: IErrors) { }

	public execute(args: string[]): IFuture<void> {
		return this.$usbLiveSyncService.liveSync(args[0]);
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(args.length >= 2) {
				this.$errors.fail("Invalid number of arguments.");
			}

			let platform = args[0];
			if(platform) {
				 return _.contains(this.$mobileHelper.platformNames, this.$mobileHelper.normalizePlatformName(platform));
			}

			return true;
		}).future<boolean>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("livesync", LivesyncCommand);
