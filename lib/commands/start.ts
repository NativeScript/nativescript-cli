import { printHeader } from "../common/header";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { IStartService } from "../definitions/start-service";

export const startCommandDefinition = defineCommand({
	name: "start",
	description: "Starts the NativeScript interactive command line.",
	arguments: "any",
	setup: () => ({
		$startService: inject<IStartService>("startService"),
	}),
	async run(context, services): Promise<void> {
		printHeader();
		// Left unawaited: the command returns while the service keeps running.
		services.$startService.start();
		return;
	},
});
