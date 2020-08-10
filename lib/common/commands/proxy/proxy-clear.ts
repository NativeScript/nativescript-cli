import { ProxyCommandBase } from "./proxy-base";
import { IAnalyticsService, IProxyService } from "../../declarations";
import { $injector } from "../../definitions/yok";
const proxyClearCommandName = "proxy|clear";

export class ProxyClearCommand extends ProxyCommandBase {
	constructor(protected $analyticsService: IAnalyticsService,
		protected $logger: ILogger,
		protected $proxyService: IProxyService) {
		super($analyticsService, $logger, $proxyService, proxyClearCommandName);
	}

	public async execute(args: string[]): Promise<void> {
		await this.$proxyService.clearCache();
		this.$logger.info("Successfully cleared proxy.");
		await this.tryTrackUsage();
	}
}

$injector.registerCommand(proxyClearCommandName, ProxyClearCommand);
