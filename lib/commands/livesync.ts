export class LivesyncCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $usbLiveSyncService: ILiveSyncService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformService: IPlatformService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
		if (!this.$options.help && args[0]) {
			this.$logger.warn('This command is deprecated. It will be removed in the next version of NativeScript CLI. Use "$ tns run" command instead.');
		}

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
