import { PostInstallCommand } from "../common/commands/post-install";

export class PostInstallCliCommand extends PostInstallCommand {
	constructor($fs: IFileSystem,
		private $subscriptionService: ISubscriptionService,
		$staticConfig: Config.IStaticConfig,
		$commandsService: ICommandsService,
		$helpService: IHelpService,
		$settingsService: ISettingsService,
		$doctorService: IDoctorService,
		$analyticsService: IAnalyticsService,
		$logger: ILogger) {
		super($fs, $staticConfig, $commandsService, $helpService, $settingsService, $analyticsService, $logger);
	}

	public async execute(args: string[]): Promise<void> {
		await super.execute(args);

		await this.$subscriptionService.subscribeForNewsletter();
	}

	public async postCommandAction(args: string[]): Promise<void> {
		this.$logger.info("You have successfully installed NativeScript CLI.");
		this.$logger.info("In order to create a new project, you can use:".green);
		this.$logger.printMarkdown("`tns create <app name> (--tsc|--ng|--template <Template>)`");
		this.$logger.info("To build your project locally you can use:".green);
		this.$logger.printMarkdown("`tns build <platform>`");
		this.$logger.printMarkdown("NOTE: Local builds require additional setup of your environment. You can find more information here: `https://docs.nativescript.org/start/quick-setup`");

		// Add a new line just to ensure separation between local builds and cloud builds info.
		this.$logger.info("");
		this.$logger.info("To build your project in the cloud you can use:".green);
		this.$logger.printMarkdown("`tns cloud build <platform>`");
		this.$logger.printMarkdown("NOTE: Cloud builds require Telerik account. You can find more information here: `https://docs.nativescript.org/sidekick/intro/requirements`");

		this.$logger.info("");
		this.$logger.printMarkdown("In case you want to experiment quickly with NativeScript, you can try the Playground: `https://play.nativescript.org`");

		this.$logger.info("");
		this.$logger.printMarkdown("In case you have any questions, you can check our forum: `https://forum.nativescript.org` and our public Slack channel: `https://nativescriptcommunity.slack.com/`");
	}
}

$injector.registerCommand("post-install-cli", PostInstallCliCommand);
