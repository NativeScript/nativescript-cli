import { IProxyService } from "../../declarations";
import { defineCommand } from "../../define-command";
import { inject } from "../../di";
import { tryTrackProxyCommandUsage } from "./proxy-base";

const proxyGetCommandName = "proxy|*get";

export const proxyGetCommandDefinition = defineCommand({
	name: proxyGetCommandName,
	description: "Prints the current proxy settings.",
	arguments: "none",
	disableAnalytics: true,
	async run(): Promise<void> {
		const $logger = inject<ILogger>("logger");
		const $proxyService = inject<IProxyService>("proxyService");

		$logger.info(await $proxyService.getInfo());
		await tryTrackProxyCommandUsage($logger, proxyGetCommandName);
	},
});
