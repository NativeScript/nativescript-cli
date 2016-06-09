import { createGUID } from "../common/helpers";

class AnalyticsSettingsService implements IAnalyticsSettingsService {
	private static SESSIONS_STARTED_OBSOLETE_KEY = "SESSIONS_STARTED";
	private static SESSIONS_STARTED_KEY_PREFIX = "SESSIONS_STARTED_";

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

	public getUserSessionsCount(projectName: string): IFuture<number> {
		return (() => {
			let oldSessionCount = this.$userSettingsService.getSettingValue<number>(AnalyticsSettingsService.SESSIONS_STARTED_OBSOLETE_KEY).wait();
			if(oldSessionCount) {
				// remove the old property for sessions count
				this.$userSettingsService.removeSetting(AnalyticsSettingsService.SESSIONS_STARTED_OBSOLETE_KEY).wait();
			}
			return this.$userSettingsService.getSettingValue<number>(this.getSessionsProjectKey(projectName)).wait() || oldSessionCount || 0;
		}).future<number>()();
	}

	public setUserSessionsCount(count: number, projectName: string): IFuture<void> {
		return this.$userSettingsService.saveSetting<number>(this.getSessionsProjectKey(projectName), count);
	}

	private getSessionsProjectKey(projectName: string): string {
		return `${AnalyticsSettingsService.SESSIONS_STARTED_KEY_PREFIX}${projectName}`;
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);
