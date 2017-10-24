import { createGUID } from "../common/helpers";
import { exported } from "../common/decorators";

class AnalyticsSettingsService implements IAnalyticsSettingsService {
	private static SESSIONS_STARTED_KEY_PREFIX = "SESSIONS_STARTED_";

	constructor(private $userSettingsService: UserSettings.IUserSettingsService,
		private $staticConfig: IStaticConfig,
		private $logger: ILogger) { }

	public async canDoRequest(): Promise<boolean> {
		return true;
	}

	public getUserId(): Promise<string> {
		return this.getSettingValueOrDefault("USER_ID");
	}

	@exported("analyticsSettingsService")
	public getClientId(): Promise<string> {
		return this.getSettingValueOrDefault(this.$staticConfig.ANALYTICS_INSTALLATION_ID_SETTING_NAME);
	}

	public getClientName(): string {
		return "" + this.$staticConfig.CLIENT_NAME_ALIAS.cyan.bold;
	}

	public getPrivacyPolicyLink(): string {
		return "http://www.telerik.com/company/privacy-policy";
	}

	public async getUserSessionsCount(projectName: string): Promise<number> {
		const sessionsCountForProject = await this.$userSettingsService.getSettingValue<number>(this.getSessionsProjectKey(projectName));
		return sessionsCountForProject || 0;
	}

	public async setUserSessionsCount(count: number, projectName: string): Promise<void> {
		return this.$userSettingsService.saveSetting<number>(this.getSessionsProjectKey(projectName), count);
	}

	private getSessionsProjectKey(projectName: string): string {
		return `${AnalyticsSettingsService.SESSIONS_STARTED_KEY_PREFIX}${projectName}`;
	}

	private async getSettingValueOrDefault(settingName: string): Promise<string> {
		let guid = await this.$userSettingsService.getSettingValue<string>(settingName);
		if (!guid) {
			guid = createGUID(false);

			this.$logger.trace(`Setting new ${settingName}: ${guid}.`);
			await this.$userSettingsService.saveSetting<string>(settingName, guid);
		}

		return guid;
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);
