import { printHeader } from "../common/header";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { IStartService } from "../definitions/start-service";

export const startCommandDefinition = defineCommand({
	name: "start",
	description: "Starts the NativeScript interactive command line.",
	arguments: "any",
	async run(): Promise<void> {
		const $startService = inject<IStartService>("startService");
		printHeader();
		// Left unawaited: the command returns while the service keeps running.
		$startService.start();
		return;
	},
});
