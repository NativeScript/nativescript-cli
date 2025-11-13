import { doesCurrentNpmCommandMatch } from "../common/helpers";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import {
	IFileSystem,
	IHelpService,
	ISettingsService,
	IAnalyticsService,
	IHostInfo,
} from "../common/declarations";
import { injector } from "../common/yok";
import { color } from "../color";

export class PostInstallCliCommand implements ICommand {
	constructor(
		private $fs: IFileSystem,
		private $commandsService: ICommandsService,
		private $helpService: IHelpService,
		private $settingsService: ISettingsService,
		private $analyticsService: IAnalyticsService,
		private $logger: ILogger,
		private $hostInfo: IHostInfo,
	) {}

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
				await this.$fs.setCurrentUserAsOwner(
					this.$settingsService.getProfileDir(),
					process.env.SUDO_USER,
				);
			}
		}

		const canExecutePostInstallTask =
			!isRunningWithSudoUser || doesCurrentNpmCommandMatch([/^--unsafe-perm$/]);

		if (canExecutePostInstallTask) {
			await this.$helpService.generateHtmlPages();

			// Explicitly ask for confirmation of usage-reporting:
			await this.$analyticsService.checkConsent();
			await this.$commandsService.tryExecuteCommand("autocomplete", []);
		}
	}

	public async postCommandAction(args: string[]): Promise<void> {
		this.$logger.info("");
		this.$logger.info(
			color.styleText(
				["green", "bold"],
				"You have successfully installed the NativeScript CLI!",
			),
		);
		this.$logger.info("");
		this.$logger.info("Your next step is to create a new project:");
		this.$logger.info(color.styleText(["green", "bold"], "ns create"));

		this.$logger.info("");
		this.$logger.printMarkdown(
			"If you have any questions, check Stack Overflow: `https://stackoverflow.com/questions/tagged/nativescript` and our public Discord channel: `https://nativescript.org/discord`",
		);
	}
}

injector.registerCommand("post-install-cli", PostInstallCliCommand);
