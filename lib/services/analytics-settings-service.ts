///<reference path="../.d.ts"/>
"use strict";

class AnalyticsSettingsService implements IAnalyticsSettingsService {
	constructor(private $userSettingsService: UserSettings.IUserSettingsService,
		private $staticConfig: IStaticConfig) { }

	public canDoRequest(): IFuture<boolean> {
		return (() => { return true; }).future<boolean>()();
	}

	public getUserId(): IFuture<string> {
		return this.$userSettingsService.getSettingValue<string>(this.$staticConfig.ANALYTICS_INSTALLATION_ID_SETTING_NAME);
	}

	public getClientName(): string {
		return "" + this.$staticConfig.CLIENT_NAME_ALIAS.cyan.bold;
	}

	public getPrivacyPolicyLink(): string {
		// TODO: Replace with nativescript privacy-policy link, when such exists.
		return "http://www.telerik.com/company/privacy-policy";
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);
