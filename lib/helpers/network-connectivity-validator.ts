import * as dns from "dns";
import { INetworkConnectivityValidator } from "../declarations";
import { injector } from "../common/yok";
import { IErrors } from "../common/declarations";

export class NetworkConnectivityValidator
	implements INetworkConnectivityValidator
{
	private static DNS_LOOKUP_URL = "play.nativescript.org";
	private static NO_INTERNET_ERROR_CODE = "ENOTFOUND";
	private static NO_INTERNET_ERROR_MESSAGE =
		"No internet connection. Check your internet settings and try again.";

	constructor(
		private $errors: IErrors,
		private $logger: ILogger
	) {}

	public async validate(): Promise<void> {
		const isConnected = await this.isConnected();
		if (!isConnected) {
			this.$errors.fail(NetworkConnectivityValidator.NO_INTERNET_ERROR_MESSAGE);
		}
	}

	private isConnected(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			dns.lookup(NetworkConnectivityValidator.DNS_LOOKUP_URL, (err) => {
				this.$logger.trace(`Error from dns.lookup is ${err}.`);
				if (
					err &&
					err.code === NetworkConnectivityValidator.NO_INTERNET_ERROR_CODE
				) {
					resolve(false);
				} else {
					resolve(true);
				}
			});
		});
	}
}
injector.register("networkConnectivityValidator", NetworkConnectivityValidator);
