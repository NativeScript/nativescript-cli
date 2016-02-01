///<reference path="../.d.ts"/>
"use strict";
import { createGUID } from "../common/helpers";

class AnalyticsSettingsService implements IAnalyticsSettingsService {
	constructor(private $userSettingsService: UserSettings.IUserSettingsService,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger) { }

	public canDoRequest(): IFuture<boolean> {
		return (() => { return true; }).future<boolean>()();
	}

	public getUserId(): IFuture<string> {
		return (() => {
			let currentUserId = this.$userSettingsService.getSettingValue<string>("USER_ID").wait();
			if(!currentUserId) {
				currentUserId = createGUID(false);

				this.$logger.trace(`Setting new USER_ID: ${currentUserId}.`);
				this.$userSettingsService.saveSetting<string>("USER_ID", currentUserId).wait();
			}

			return currentUserId;
		}).future<string>()();
	}

	public getClientName(): string {
		return "" + this.$staticConfig.CLIENT_NAME_ALIAS.cyan.bold;
	}

	public getPrivacyPolicyLink(): string {
		return "http://www.telerik.com/company/privacy-policy";
	}

	public getUserSessionsCount(): IFuture<number> {
		return (() => {
			return this.$userSettingsService.getSettingValue<number>("SESSIONS_STARTED").wait() || 0;
		}).future<number>()();
	}

	public setUserSessionsCount(count: number): IFuture<void> {
		return this.$userSettingsService.saveSetting<number>("SESSIONS_STARTED", count);
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);
