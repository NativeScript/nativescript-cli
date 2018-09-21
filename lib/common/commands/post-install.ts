export class PostInstallCommand implements ICommand {
	constructor(private $fs: IFileSystem,
		private $staticConfig: Config.IStaticConfig,
		private $commandsService: ICommandsService,
		private $helpService: IHelpService,
		private $settingsService: ISettingsService,
		private $analyticsService: IAnalyticsService,
		protected $logger: ILogger) {
	}

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		if (process.platform !== "win32") {
			// when running under 'sudo' we create a working dir with wrong owner (root) and
			// it is no longer accessible for the user initiating the installation
			// patch the owner here
			if (process.env.SUDO_USER) {
				await this.$fs.setCurrentUserAsOwner(this.$settingsService.getProfileDir(), process.env.SUDO_USER);
			}
		}

		await this.$helpService.generateHtmlPages();

		// Explicitly ask for confirmation of usage-reporting:
		await this.$analyticsService.checkConsent();

		await this.$commandsService.tryExecuteCommand("autocomplete", []);

		if (this.$staticConfig.INSTALLATION_SUCCESS_MESSAGE) {
			// Make sure the success message is separated with at least one line from all other messages.
			this.$logger.out();
			this.$logger.printMarkdown(this.$staticConfig.INSTALLATION_SUCCESS_MESSAGE);
		}
	}
}
$injector.registerCommand("dev-post-install", PostInstallCommand);
