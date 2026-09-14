import { IInfoService } from "../declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";

export const infoCommandDefinition = defineCommand({
	name: "info",
	description: "Displays version information about the CLI and its components.",
	arguments: "none",
	setup: () => ({
		$infoService: inject<IInfoService>("infoService"),
	}),
	run(context, services): Promise<void> {
		return services.$infoService.printComponentsInfo();
	},
});

registerCommand(infoCommandDefinition);
