import { cache } from "../common/decorators";
import { Server } from "../common/declarations";
import { injector } from "../common/yok";

export class IPService implements IIPService {
	private static GET_IP_TIMEOUT = 1000;
	constructor(
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger
	) {}

	@cache()
	public async getCurrentIPv4Address(): Promise<string> {
		const ipAddress =
			(await this.getIPAddressFromServiceReturningJSONWithIPProperty(
				"https://api.myip.com"
			)) ||
			(await this.getIPAddressFromIpifyOrgAPI()) ||
			null;

		return ipAddress;
	}

	private async getIPAddressFromServiceReturningJSONWithIPProperty(
		apiEndpoint: string
	): Promise<string> {
		let ipAddress: string = null;
		try {
			const response = await this.$httpClient.httpRequest({
				method: "GET",
				url: apiEndpoint,
				timeout: IPService.GET_IP_TIMEOUT,
			});

			this.$logger.trace(`${apiEndpoint} returns ${response.body}`);

			const jsonData = JSON.parse(response.body);
			ipAddress = jsonData.ip;
		} catch (err) {
			this.$logger.trace(
				`Unable to get information about current IP Address from ${apiEndpoint} Error is:`,
				err
			);
		}

		return ipAddress;
	}

	private async getIPAddressFromIpifyOrgAPI(): Promise<string> {
		// https://www.ipify.org/
		const ipifyOrgAPIEndpoint = "https://api.ipify.org";
		let ipAddress: string = null;
		try {
			const response = await this.$httpClient.httpRequest({
				method: "GET",
				url: ipifyOrgAPIEndpoint,
				timeout: IPService.GET_IP_TIMEOUT,
			});

			this.$logger.trace(`${ipifyOrgAPIEndpoint} returns ${response.body}`);

			ipAddress = (response.body || "").toString();
		} catch (err) {
			this.$logger.trace(
				`Unable to get information about current IP Address from ${ipifyOrgAPIEndpoint} Error is:`,
				err
			);
		}

		return ipAddress;
	}
}

injector.register("ipService", IPService);
