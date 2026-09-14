import { IAnalyticsService, IProxyService } from "../../declarations";
import { inject } from "../../di";

export function injectProxyCommandServices() {
	return {
		$analyticsService: inject<IAnalyticsService>("analyticsService"),
		$logger: inject<ILogger>("logger"),
		$proxyService: inject<IProxyService>("proxyService"),
	};
}

export type IProxyCommandServices = ReturnType<
	typeof injectProxyCommandServices
>;

export async function tryTrackProxyCommandUsage(
	services: IProxyCommandServices,
	commandName: string,
): Promise<void> {
	try {
		// TODO(Analytics): Check why we have set the `disableAnalytics` to true and we track the command as separate one
		// instead of tracking it through the commandsService.
		services.$logger.trace(commandName);
		// await services.$analyticsService.trackFeature(commandName);
	} catch (ex) {
		services.$logger.trace("Error in trying to track proxy command usage:");
		services.$logger.trace(ex);
	}
}
