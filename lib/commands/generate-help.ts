import { IHelpService } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export const generateHelpCommandDefinition = defineCommand({
	name: "dev-generate-help",
	description: "Generates the HTML help pages from the man pages.",
	params: "none",
	run(): Promise<void> {
		const $helpService = inject<IHelpService>("helpService");
		return $helpService.generateHtmlPages();
	},
});
