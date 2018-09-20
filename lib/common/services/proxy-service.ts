import * as path from "path";
import { EOL } from "os";
import { Proxy } from "../constants";
const proxyLib = require("proxy-lib");

export class ProxyService implements IProxyService {
	private proxyCacheFilePath: string;
	private credentialsKey: string;

	constructor(
		private $settingsService: ISettingsService,
		private $staticConfig: Config.IStaticConfig) {
		this.proxyCacheFilePath = path.join(this.$settingsService.getProfileDir(), Proxy.CACHE_FILE_NAME);
		this.credentialsKey = `${this.$staticConfig.CLIENT_NAME}_PROXY`;
	}

	public setCache(settings: IProxyLibSettings): Promise<void> {
		settings.userSpecifiedSettingsFilePath = settings.userSpecifiedSettingsFilePath || this.proxyCacheFilePath;
		settings.credentialsKey = settings.credentialsKey || this.credentialsKey;
		return proxyLib.setProxySettings(settings);
	}

	public getCache(): Promise<IProxySettings> {
		const settings = {
			credentialsKey: this.credentialsKey,
			userSpecifiedSettingsFilePath: this.proxyCacheFilePath
		};

		return proxyLib.getProxySettings(settings);
	}

	public clearCache(): Promise<void> {
		const settings = {
			credentialsKey: this.credentialsKey,
			userSpecifiedSettingsFilePath: this.proxyCacheFilePath
		};

		return proxyLib.clearProxySettings(settings);
	}

	public async getInfo(): Promise<string> {
		let message = "";
		const proxyCache: IProxySettings = await this.getCache();
		if (proxyCache) {
			message = `Proxy Url: ${proxyCache.protocol}//${proxyCache.hostname}:${proxyCache.port}`;
			if (proxyCache.username) {
				message += `${EOL}Username: ${proxyCache.username}`;
			}

			message += `${EOL}Proxy is Enabled`;
		} else {
			message = "No proxy set";
		}

		return message;
	}
}

$injector.register("proxyService", ProxyService);
