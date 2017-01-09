import { createGUID } from "../common/helpers";

class AnalyticsSettingsService implements IAnalyticsSettingsService {
	private static SESSIONS_STARTED_OBSOLETE_KEY = "SESSIONS_STARTED";
	private static SESSIONS_STARTED_KEY_PREFIX = "SESSIONS_STARTED_";

	constructor(private $userSettingsService: UserSettings.IUserSettingsService,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger) { }

	public async canDoRequest(): Promise<boolean> {
		return true;
	}

	public async getUserId(): Promise<string> {
		let currentUserId = await this.$userSettingsService.getSettingValue<string>("USER_ID");
		if (!currentUserId) {
			currentUserId = createGUID(false);

			this.$logger.trace(`Setting new USER_ID: ${currentUserId}.`);
			await this.$userSettingsService.saveSetting<string>("USER_ID", currentUserId);
		}

		return currentUserId;
	}

	public getClientName(): string {
		return "" + this.$staticConfig.CLIENT_NAME_ALIAS.cyan.bold;
	}

	public getPrivacyPolicyLink(): string {
		return "http://www.telerik.com/company/privacy-policy";
	}

	public async getUserSessionsCount(projectName: string): Promise<number> {
		let oldSessionCount = await this.$userSettingsService.getSettingValue<number>(AnalyticsSettingsService.SESSIONS_STARTED_OBSOLETE_KEY);

		if (oldSessionCount) {
			// remove the old property for sessions count
			await this.$userSettingsService.removeSetting(AnalyticsSettingsService.SESSIONS_STARTED_OBSOLETE_KEY);
		}

		return await this.$userSettingsService.getSettingValue<number>(this.getSessionsProjectKey(projectName)) || oldSessionCount || 0;
	}

	public async setUserSessionsCount(count: number, projectName: string): Promise<void> {
		return this.$userSettingsService.saveSetting<number>(this.getSessionsProjectKey(projectName), count);
	}

	private getSessionsProjectKey(projectName: string): string {
		return `${AnalyticsSettingsService.SESSIONS_STARTED_KEY_PREFIX}${projectName}`;
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);
