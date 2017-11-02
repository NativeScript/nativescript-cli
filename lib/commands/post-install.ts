import { PostInstallCommand } from "../common/commands/post-install";

export class PostInstallCliCommand extends PostInstallCommand {
	constructor($fs: IFileSystem,
		private $subscriptionService: ISubscriptionService,
		$staticConfig: Config.IStaticConfig,
		$commandsService: ICommandsService,
		$helpService: IHelpService,
		$options: ICommonOptions,
		$doctorService: IDoctorService,
		$analyticsService: IAnalyticsService,
		$logger: ILogger) {
		super($fs, $staticConfig, $commandsService, $helpService, $options, $doctorService, $analyticsService, $logger);
	}

	public async execute(args: string[]): Promise<void> {
		await super.execute(args);

		await this.$subscriptionService.subscribeForNewsletter();
	}
}

$injector.registerCommand("post-install-cli", PostInstallCliCommand);
