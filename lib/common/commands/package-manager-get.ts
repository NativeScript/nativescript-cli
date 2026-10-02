import { IUserSettingsService } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";

export const packageManagerGetCommandDefinition = defineCommand({
	name: "package-manager|*get",
	description: "Prints the value of the current package manager.",
	async run(): Promise<void> {
		const $logger = inject<ILogger>("logger");
		const $userSettingsService = inject<IUserSettingsService>(
			"userSettingsService",
		);

		const result = await $userSettingsService.getSettingValue("packageManager");
		$logger.printMarkdown(
			`Your current package manager is \`${result || "npm"}\`.`,
		);
	},
});
