export async function tryTrackProxyCommandUsage(
	$logger: ILogger,
	commandName: string,
): Promise<void> {
	try {
		// TODO(Analytics): Check why we have set the `disableAnalytics` to true and we track the command as separate one
		// instead of tracking it through the commandsService.
		$logger.trace(commandName);
		// await $analyticsService.trackFeature(commandName);
	} catch (ex) {
		$logger.trace("Error in trying to track proxy command usage:");
		$logger.trace(ex);
	}
}
