import { defineCommand } from "../../define-command";
import { registerCommand } from "../../services/command-definition-adapter";
import {
	injectProxyCommandServices,
	IProxyCommandServices,
	tryTrackProxyCommandUsage,
} from "./proxy-base";

const proxyClearCommandName = "proxy|clear";

export const proxyClearCommandDefinition = defineCommand({
	name: proxyClearCommandName,
	description: "Clears the currently configured proxy settings.",
	arguments: "none",
	disableAnalytics: true,
	setup: injectProxyCommandServices,
	async run(context, services: IProxyCommandServices): Promise<void> {
		await services.$proxyService.clearCache();
		services.$logger.info("Successfully cleared proxy.");
		await tryTrackProxyCommandUsage(services, proxyClearCommandName);
	},
});

registerCommand(proxyClearCommandDefinition);
