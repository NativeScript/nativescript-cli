import { IProxyService } from "../../declarations";
import { defineCommand } from "../../define-command";
import { inject } from "../../di";
import { tryTrackProxyCommandUsage } from "./proxy-base";

const proxyClearCommandName = "proxy|clear";

export const proxyClearCommandDefinition = defineCommand({
	name: proxyClearCommandName,
	description: "Clears the currently configured proxy settings.",
	arguments: "none",
	disableAnalytics: true,
	async run(): Promise<void> {
		const $logger = inject<ILogger>("logger");
		const $proxyService = inject<IProxyService>("proxyService");

		await $proxyService.clearCache();
		$logger.info("Successfully cleared proxy.");
		await tryTrackProxyCommandUsage($logger, proxyClearCommandName);
	},
});
