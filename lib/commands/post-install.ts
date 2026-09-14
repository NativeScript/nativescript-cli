import { color } from "../color";
import {
	IAnalyticsService,
	IFileSystem,
	IHelpService,
	IHostInfo,
	ISettingsService,
} from "../common/declarations";
import { CommandContext, defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { doesCurrentNpmCommandMatch } from "../common/helpers";

export function setupPostInstallCliCommand() {
	return {
		$fs: inject<IFileSystem>("fs"),
		$commandsService: inject<ICommandsService>("commandsService"),
		$helpService: inject<IHelpService>("helpService"),
		$settingsService: inject<ISettingsService>("settingsService"),
		$analyticsService: inject<IAnalyticsService>("analyticsService"),
		$logger: inject<ILogger>("logger"),
		$hostInfo: inject<IHostInfo>("hostInfo"),
	};
}

export type IPostInstallCliCommandServices = ReturnType<
	typeof setupPostInstallCliCommand
>;

export async function runPostInstallCliCommand(
	context: CommandContext,
	services: IPostInstallCliCommandServices,
): Promise<void> {
	const isRunningWithSudoUser = !!process.env.SUDO_USER;

	if (!services.$hostInfo.isWindows) {
		// when running under 'sudo' we create a working dir with wrong owner (root) and
		// it is no longer accessible for the user initiating the installation
		// patch the owner here
		if (isRunningWithSudoUser) {
			// TODO: Check if this is the correct place, probably we should set this at the end of the command.
			await services.$fs.setCurrentUserAsOwner(
				services.$settingsService.getProfileDir(),
				process.env.SUDO_USER,
			);
		}
	}

	const canExecutePostInstallTask =
		!isRunningWithSudoUser || doesCurrentNpmCommandMatch([/^--unsafe-perm$/]);

	if (canExecutePostInstallTask) {
		await services.$helpService.generateHtmlPages();

		// Explicitly ask for confirmation of usage-reporting:
		await services.$analyticsService.checkConsent();
		await services.$commandsService.tryExecuteCommand("autocomplete", []);
	}
}

export function reportSuccessfulInstallation(
	services: IPostInstallCliCommandServices,
): void {
	services.$logger.info("");
	services.$logger.info(
		color.styleText(
			["green", "bold"],
			"You have successfully installed the NativeScript CLI!",
		),
	);
	services.$logger.info("");
	services.$logger.info("Your next step is to create a new project:");
	services.$logger.info(color.styleText(["green", "bold"], "ns create"));

	services.$logger.info("");
	services.$logger.printMarkdown(
		"If you have any questions, check Stack Overflow: `https://stackoverflow.com/questions/tagged/nativescript` and our public Discord channel: `https://nativescript.org/discord`",
	);
}

export const postInstallCliCommandDefinition = defineCommand({
	name: "post-install-cli",
	description: "Completes the CLI installation.",
	disableAnalytics: true,
	setup: setupPostInstallCliCommand,
	run: runPostInstallCliCommand,
	postRun: (context, result, services) =>
		reportSuccessfulInstallation(services),
});
