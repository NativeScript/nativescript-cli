import { ProxyCommandBase } from "./proxy-base";
import { IAnalyticsService, IProxyService } from "../../declarations";
import { injector } from "../../yok";

const proxyGetCommandName = "proxy|*get";

export class ProxyGetCommand extends ProxyCommandBase {
	constructor(
		protected $analyticsService: IAnalyticsService,
		protected $logger: ILogger,
		protected $proxyService: IProxyService
	) {
		super($analyticsService, $logger, $proxyService, proxyGetCommandName);
	}

	public async execute(args: string[]): Promise<void> {
		this.$logger.info(await this.$proxyService.getInfo());
		await this.tryTrackUsage();
	}
}

injector.registerCommand(proxyGetCommandName, ProxyGetCommand);
