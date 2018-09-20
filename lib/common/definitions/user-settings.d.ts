declare module UserSettings {
	interface IUserSettingsService {
		getSettingValue<T>(settingName: string): Promise<T>;
		saveSetting<T>(key: string, value: T): Promise<void>;
		removeSetting(key: string): Promise<void>;
	}
}