import * as helpers from "../helpers";
import { IAutoCompletionService } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";

export const autoCompleteCommandDefinition = defineCommand({
	name: "autocomplete|*default",
	description: "Prompts to enable command-line completion for the CLI.",
	params: "none",
	disableAnalytics: true,
	async run(): Promise<void> {
		const $autoCompletionService = inject<IAutoCompletionService>(
			"autoCompletionService",
		);
		const $logger = inject<ILogger>("logger");
		const $prompter = inject<IPrompter>("prompter");

		if (helpers.isInteractive()) {
			if ($autoCompletionService.isAutoCompletionEnabled()) {
				if ($autoCompletionService.isObsoleteAutoCompletionEnabled()) {
					// obsolete autocompletion is enabled, update it to the new one:
					await $autoCompletionService.enableAutoCompletion();
				} else {
					$logger.info("Autocompletion is already enabled");
				}
			} else {
				$logger.info(
					"If you are using bash or zsh, you can enable command-line completion.",
				);
				const message = "Do you want to enable it now?";

				const autoCompetionStatus = await $prompter.confirm(
					message,
					() => true,
				);
				if (autoCompetionStatus) {
					await $autoCompletionService.enableAutoCompletion();
				} else {
					// make sure we've removed all autocompletion code from all shell profiles
					$autoCompletionService.disableAutoCompletion();
				}
			}
		}
	},
});

export const disableAutoCompleteCommandDefinition = defineCommand({
	name: "autocomplete|disable",
	description: "Disables command-line completion for the CLI.",
	params: "none",
	disableAnalytics: true,
	async run(): Promise<void> {
		const $autoCompletionService = inject<IAutoCompletionService>(
			"autoCompletionService",
		);
		const $logger = inject<ILogger>("logger");

		if ($autoCompletionService.isAutoCompletionEnabled()) {
			$autoCompletionService.disableAutoCompletion();
		} else {
			$logger.info("Autocompletion is already disabled.");
		}
	},
});

export const enableAutoCompleteCommandDefinition = defineCommand({
	name: "autocomplete|enable",
	description: "Enables command-line completion for the CLI.",
	params: "none",
	disableAnalytics: true,
	async run(): Promise<void> {
		const $autoCompletionService = inject<IAutoCompletionService>(
			"autoCompletionService",
		);
		const $logger = inject<ILogger>("logger");

		if ($autoCompletionService.isAutoCompletionEnabled()) {
			$logger.info("Autocompletion is already enabled.");
		} else {
			await $autoCompletionService.enableAutoCompletion();
		}
	},
});

export const autoCompleteStatusCommandDefinition = defineCommand({
	name: "autocomplete|status",
	description: "Prints whether command-line completion is enabled.",
	params: "none",
	disableAnalytics: true,
	async run(): Promise<void> {
		const $autoCompletionService = inject<IAutoCompletionService>(
			"autoCompletionService",
		);
		const $logger = inject<ILogger>("logger");

		if ($autoCompletionService.isAutoCompletionEnabled()) {
			$logger.info("Autocompletion is enabled.");
		} else {
			$logger.info("Autocompletion is disabled.");
		}
	},
});
