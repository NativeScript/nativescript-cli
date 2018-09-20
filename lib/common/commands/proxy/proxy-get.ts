import { ProxyCommandBase } from "./proxy-base";

const proxyGetCommandName = "proxy|*get";

export class ProxyGetCommand extends ProxyCommandBase {
	constructor(protected $analyticsService: IAnalyticsService,
		protected $logger: ILogger,
		protected $proxyService: IProxyService) {
		super($analyticsService, $logger, $proxyService, proxyGetCommandName);
	}

	public async execute(args: string[]): Promise<void> {
		this.$logger.out(await this.$proxyService.getInfo());
		await this.tryTrackUsage();
	}
}

$injector.registerCommand(proxyGetCommandName, ProxyGetCommand);
