export class LivesyncCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $usbLiveSyncService: ILiveSyncService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformService: IPlatformService,
		private $errors: IErrors) { }

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.deployPlatform(args[0]);
		return this.$usbLiveSyncService.liveSync(args[0]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length >= 2) {
			this.$errors.fail("Invalid number of arguments.");
		}

		let platform = args[0];
		if (platform) {
			return _.includes(this.$mobileHelper.platformNames, this.$mobileHelper.normalizePlatformName(platform)) && await this.$platformService.validateOptions(args[0]);
		} else {
			return await this.$platformService.validateOptions();
		}
	}
}

$injector.registerCommand("livesync", LivesyncCommand);
