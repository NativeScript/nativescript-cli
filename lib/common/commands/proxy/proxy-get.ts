import { defineCommand } from "../../define-command";
import {
	injectProxyCommandServices,
	IProxyCommandServices,
	tryTrackProxyCommandUsage,
} from "./proxy-base";

const proxyGetCommandName = "proxy|*get";

export const proxyGetCommandDefinition = defineCommand({
	name: proxyGetCommandName,
	description: "Prints the current proxy settings.",
	arguments: "none",
	disableAnalytics: true,
	setup: injectProxyCommandServices,
	async run(context, services: IProxyCommandServices): Promise<void> {
		services.$logger.info(await services.$proxyService.getInfo());
		await tryTrackProxyCommandUsage(services, proxyGetCommandName);
	},
});
