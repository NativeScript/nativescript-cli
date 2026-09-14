import * as helpers from "../helpers";
import { IAutoCompletionService } from "../declarations";
import { defineCommand } from "../define-command";
import { inject } from "../di";
import { registerCommand } from "../services/command-definition-adapter";

export interface IAutoCompleteCommandServices {
	$autoCompletionService: IAutoCompletionService;
	$logger: ILogger;
}

export function injectAutoCompleteCommandServices(): IAutoCompleteCommandServices {
	return {
		$autoCompletionService: inject<IAutoCompletionService>(
			"autoCompletionService",
		),
		$logger: inject<ILogger>("logger"),
	};
}

export const autoCompleteCommandDefinition = defineCommand({
	name: "autocomplete|*default",
	description: "Prompts to enable command-line completion for the CLI.",
	arguments: "none",
	disableAnalytics: true,
	setup: () => ({
		...injectAutoCompleteCommandServices(),
		$prompter: inject<IPrompter>("prompter"),
	}),
	async run(context, services): Promise<void> {
		if (helpers.isInteractive()) {
			if (services.$autoCompletionService.isAutoCompletionEnabled()) {
				if (services.$autoCompletionService.isObsoleteAutoCompletionEnabled()) {
					// obsolete autocompletion is enabled, update it to the new one:
					await services.$autoCompletionService.enableAutoCompletion();
				} else {
					services.$logger.info("Autocompletion is already enabled");
				}
			} else {
				services.$logger.info(
					"If you are using bash or zsh, you can enable command-line completion.",
				);
				const message = "Do you want to enable it now?";

				const autoCompetionStatus = await services.$prompter.confirm(
					message,
					() => true,
				);
				if (autoCompetionStatus) {
					await services.$autoCompletionService.enableAutoCompletion();
				} else {
					// make sure we've removed all autocompletion code from all shell profiles
					services.$autoCompletionService.disableAutoCompletion();
				}
			}
		}
	},
});

export const disableAutoCompleteCommandDefinition = defineCommand({
	name: "autocomplete|disable",
	description: "Disables command-line completion for the CLI.",
	arguments: "none",
	disableAnalytics: true,
	setup: injectAutoCompleteCommandServices,
	async run(context, services): Promise<void> {
		if (services.$autoCompletionService.isAutoCompletionEnabled()) {
			services.$autoCompletionService.disableAutoCompletion();
		} else {
			services.$logger.info("Autocompletion is already disabled.");
		}
	},
});

export const enableAutoCompleteCommandDefinition = defineCommand({
	name: "autocomplete|enable",
	description: "Enables command-line completion for the CLI.",
	arguments: "none",
	disableAnalytics: true,
	setup: injectAutoCompleteCommandServices,
	async run(context, services): Promise<void> {
		if (services.$autoCompletionService.isAutoCompletionEnabled()) {
			services.$logger.info("Autocompletion is already enabled.");
		} else {
			await services.$autoCompletionService.enableAutoCompletion();
		}
	},
});

export const autoCompleteStatusCommandDefinition = defineCommand({
	name: "autocomplete|status",
	description: "Prints whether command-line completion is enabled.",
	arguments: "none",
	disableAnalytics: true,
	setup: injectAutoCompleteCommandServices,
	async run(context, services): Promise<void> {
		if (services.$autoCompletionService.isAutoCompletionEnabled()) {
			services.$logger.info("Autocompletion is enabled.");
		} else {
			services.$logger.info("Autocompletion is disabled.");
		}
	},
});

registerCommand(autoCompleteCommandDefinition);
registerCommand(disableAutoCompleteCommandDefinition);
registerCommand(enableAutoCompleteCommandDefinition);
registerCommand(autoCompleteStatusCommandDefinition);
