import * as path from "path";
import { IDictionary, ISettingsService, IUserSettingsService } from "../common/declarations";
import {
	ICacheTimeoutOpts,
	IJsonFileSettingsService,
	IUseCacheOpts
} from "../common/definitions/json-file-settings-service";

export class UserSettingsService implements IUserSettingsService {
	private get $jsonFileSettingsService(): IJsonFileSettingsService {
		const userSettingsFilePath = path.join(this.$settingsService.getProfileDir(), "user-settings.json");
		return $injector.resolve("jsonFileSettingsService", { jsonFileSettingsPath: userSettingsFilePath });
	}

	constructor(private $settingsService: ISettingsService) {
	}

	public getSettingValue<T>(settingName: string, cacheOpts?: ICacheTimeoutOpts): Promise<T> {
		return this.$jsonFileSettingsService.getSettingValue<T>(settingName, cacheOpts);
	}

	public saveSetting<T>(key: string, value: T, cacheOpts?: IUseCacheOpts): Promise<void> {
		return this.$jsonFileSettingsService.saveSetting<T>(key, value, cacheOpts);
	}

	public saveSettings(data: IDictionary<{}>, cacheOpts?: IUseCacheOpts): Promise<void> {
		return this.$jsonFileSettingsService.saveSettings(data, cacheOpts);
	}

	public removeSetting(key: string): Promise<void> {
		return this.$jsonFileSettingsService.removeSetting(key);
	}

	public loadUserSettingsFile(): Promise<void> {
		return this.$jsonFileSettingsService.loadUserSettingsFile();
	}
}
$injector.register("userSettingsService", UserSettingsService);
