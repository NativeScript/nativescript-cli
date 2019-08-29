import { doesCurrentNpmCommandMatch } from "../common/helpers";

export class PostInstallCliCommand implements ICommand {
	constructor(private $fs: IFileSystem,
		private $subscriptionService: ISubscriptionService,
		private $commandsService: ICommandsService,
		private $helpService: IHelpService,
		private $settingsService: ISettingsService,
		private $analyticsService: IAnalyticsService,
		private $logger: ILogger,
		private $hostInfo: IHostInfo) {
	}

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		const isRunningWithSudoUser = !!process.env.SUDO_USER;

		if (!this.$hostInfo.isWindows) {
			// when running under 'sudo' we create a working dir with wrong owner (root) and
			// it is no longer accessible for the user initiating the installation
			// patch the owner here
			if (isRunningWithSudoUser) {
				// TODO: Check if this is the correct place, probably we should set this at the end of the command.
				await this.$fs.setCurrentUserAsOwner(this.$settingsService.getProfileDir(), process.env.SUDO_USER);
			}
		}

		const canExecutePostInstallTask = !isRunningWithSudoUser || doesCurrentNpmCommandMatch([/^--unsafe-perm$/]);

		if (canExecutePostInstallTask) {
			await this.$helpService.generateHtmlPages();

			// Explicitly ask for confirmation of usage-reporting:
			await this.$analyticsService.checkConsent();
			await this.$commandsService.tryExecuteCommand("autocomplete", []);
		}

		if (canExecutePostInstallTask) {
			await this.$subscriptionService.subscribeForNewsletter();
		}
	}

	public async postCommandAction(args: string[]): Promise<void> {
		this.$logger.info("");
		this.$logger.info("You have successfully installed the NativeScript CLI!".green.bold);
		this.$logger.info("");
		this.$logger.info("Your next step is to create a new project:");
		this.$logger.info("tns create".green.bold);

		this.$logger.info("");
		this.$logger.printMarkdown("New to NativeScript?".bold + " Try the tutorials in NativeScript Playground: `https://play.nativescript.org`");

		this.$logger.info("");
		this.$logger.printMarkdown("If you have any questions, check Stack Overflow: `https://stackoverflow.com/questions/tagged/nativescript` and our public Slack channel: `https://nativescriptcommunity.slack.com/`");
	}
}

$injector.registerCommand("post-install-cli", PostInstallCliCommand);
