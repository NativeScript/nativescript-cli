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

		// Make sure the success message is separated with at least one line from all other messages.
		this.$logger.info();
		this.$logger.printMarkdown("Installation successful. You are good to go. Connect with us on `http://twitter.com/NativeScript`.");

		if (canExecutePostInstallTask) {
			await this.$subscriptionService.subscribeForNewsletter();
		}
	}

	public async postCommandAction(args: string[]): Promise<void> {
		this.$logger.info("You have successfully installed the NativeScript CLI!");
		this.$logger.info("To create a new project, you use:".green);
		this.$logger.printMarkdown("`tns create <app name>`");
		this.$logger.info("To build your project locally you use:".green);
		this.$logger.printMarkdown("`tns build <platform>`");
		this.$logger.printMarkdown("NOTE: Local builds require additional setup of your environment. You can find more information here: `https://docs.nativescript.org/start/quick-setup`");

		// Add a new line just to ensure separation between local builds and cloud builds info.
		this.$logger.info("");
		this.$logger.info("To build your project in the cloud you can use:".green);
		this.$logger.printMarkdown("`tns cloud build <platform>`");
		this.$logger.printMarkdown("NOTE: Cloud builds require Telerik account. You can find more information here: `https://docs.nativescript.org/sidekick/intro/requirements`");

		this.$logger.info("");
		this.$logger.printMarkdown("If you want to experiment with NativeScript in your browser, try the Playground: `https://play.nativescript.org`");

		this.$logger.info("");
		this.$logger.printMarkdown("If you have any questions, check Stack Overflow: `https://stackoverflow.com/questions/tagged/nativescript` and our public Slack channel: `https://nativescriptcommunity.slack.com/`");
	}
}

$injector.registerCommand("post-install-cli", PostInstallCliCommand);
