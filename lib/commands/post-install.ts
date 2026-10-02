import { color } from "../color";
import {
	IAnalyticsService,
	IFileSystem,
	IHelpService,
	IHostInfo,
	ISettingsService,
} from "../common/declarations";
import { CommandsService } from "../common/contracts/commands-service";
import { Command } from "../common/define-command";
import { inject } from "../common/di";
import { doesCurrentNpmCommandMatch } from "../common/helpers";

export class PostInstallCliCommand extends Command({
	name: "post-install-cli",
	description: "Completes the CLI installation.",
	disableAnalytics: true,
}) {
	private $fs = inject<IFileSystem>("fs");
	private $commandsService = inject(CommandsService);
	private $helpService = inject<IHelpService>("helpService");
	private $settingsService = inject<ISettingsService>("settingsService");
	private $analyticsService = inject<IAnalyticsService>("analyticsService");
	private $logger = inject<ILogger>("logger");
	private $hostInfo = inject<IHostInfo>("hostInfo");

	public async run(): Promise<void> {
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
			await this.$commandsService.runCommand("autocomplete");
		}
	}

	public postRun(): void {
		this.reportSuccessfulInstallation();
	}

	private reportSuccessfulInstallation(): void {
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
