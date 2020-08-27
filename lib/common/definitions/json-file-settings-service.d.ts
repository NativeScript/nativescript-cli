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
	saveSetting<T>(
		key: string,
		value: T,
		cacheOpts?: IUseCacheOpts
	): Promise<void>;
	removeSetting(key: string): Promise<void>;
	loadUserSettingsFile(): Promise<void>;
	saveSettings(data: IDictionary<{}>, cacheOpts?: IUseCacheOpts): Promise<void>;
}
