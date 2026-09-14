import { IHelpService } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";

export const generateHelpCommandDefinition = defineCommand({
	name: "dev-generate-help",
	description: "Generates the HTML help pages from the man pages.",
	arguments: "none",
	setup: () => ({
		$helpService: inject<IHelpService>("helpService"),
	}),
	run(context, services): Promise<void> {
		return services.$helpService.generateHtmlPages();
	},
});

registerCommand(generateHelpCommandDefinition);
