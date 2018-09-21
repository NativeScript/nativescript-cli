export abstract class ProxyCommandBase implements ICommand {
	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $analyticsService: IAnalyticsService,
		protected $logger: ILogger,
		protected $proxyService: IProxyService,
		private commandName: string) {
	}

	public abstract execute(args: string[]): Promise<void>;

	protected async tryTrackUsage() {
		try {
			await this.$analyticsService.trackFeature(this.commandName);
		} catch (ex) {
			this.$logger.trace("Error in trying to track proxy command usage:");
			this.$logger.trace(ex);
		}
	}
}
