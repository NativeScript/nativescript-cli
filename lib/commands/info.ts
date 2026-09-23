import { IInfoService } from "../declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export const infoCommandDefinition = defineCommand({
	name: "info",
	description: "Displays version information about the CLI and its components.",
	params: "none",
	run(): Promise<void> {
		const $infoService = inject<IInfoService>("infoService");
		return $infoService.printComponentsInfo();
	},
});
