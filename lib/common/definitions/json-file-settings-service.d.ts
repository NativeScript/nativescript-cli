import { IDictionary } from "../declarations";

interface ICacheTimeoutOpts {
	cacheTimeout: number;
}

interface IUseCacheOpts {
	useCaching: boolean;
}

interface IJsonFileSettingsService {
	getSettingValue<T>(
		settingName: string,
		cacheOpts?: ICacheTimeoutOpts
	): Promise<T>;
	/**
	 * Reads a setting without taking the settings lock. Suitable for values that
	 * only change through explicit user commands, where a torn read is harmless.
	 */
	getSettingValueSync<T>(settingName: string): T;
	saveSetting<T>(
		key: string,
		value: T,
		cacheOpts?: IUseCacheOpts
	): Promise<void>;
	removeSetting(key: string): Promise<void>;
	loadUserSettingsFile(): Promise<void>;
	saveSettings(data: IDictionary<{}>, cacheOpts?: IUseCacheOpts): Promise<void>;
}
