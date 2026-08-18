import { Contract } from "../common/di/contract";
import type { IProxySettings, Server } from "../common/declarations";

/**
 * Performs HTTP requests, honouring the CLI's proxy settings.
 */
@Contract({ name: "httpClient" })
export abstract class HttpClient {
	abstract httpRequest(url: string): Promise<Server.IResponse>;
	abstract httpRequest(
		options: any,
		proxySettings?: IProxySettings,
	): Promise<Server.IResponse>;
}
