import * as helpers from "../helpers";
import { cache } from "../decorators";

export abstract class AnalyticsServiceBase implements IAnalyticsService, IDisposable {
	protected featureTrackingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_API_KEY
	];

	protected acceptUsageReportingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_API_KEY
	];

	protected exceptionsTrackingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_EXCEPTIONS_API_KEY
	];

	protected shouldDisposeInstance: boolean = true;

	protected analyticsStatuses: IDictionary<AnalyticsStatus> = {};

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		protected $staticConfig: Config.IStaticConfig,
		protected $processService: IProcessService,
		private $prompter: IPrompter,
		private $userSettingsService: UserSettings.IUserSettingsService,
		private $analyticsSettingsService: IAnalyticsSettingsService) { }

	protected get acceptTrackFeatureSetting(): string {
		return `Accept${this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}`;
	}

	public setShouldDispose(shouldDispose: boolean): void {
		this.shouldDisposeInstance = shouldDispose;
	}

	public abstract dispose(): void;

	public async checkConsent(): Promise<void> {
		if (await this.$analyticsSettingsService.canDoRequest()) {
			const initialTrackFeatureUsageStatus = await this.getStatus(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
			let trackFeatureUsage = initialTrackFeatureUsageStatus === AnalyticsStatus.enabled;

			if (await this.isNotConfirmed(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) && helpers.isInteractive()) {
				this.$logger.out("Do you want to help us improve "
					+ this.$analyticsSettingsService.getClientName()
					+ " by automatically sending anonymous usage statistics? We will not use this information to identify or contact you."
					+ " You can read our official Privacy Policy at");

				const message = this.$analyticsSettingsService.getPrivacyPolicyLink();
				trackFeatureUsage = await this.$prompter.confirm(message, () => true);
				await this.setStatus(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, trackFeatureUsage);

				await this.trackAcceptFeatureUsage({ acceptTrackFeatureUsage: trackFeatureUsage });
			}

			const isErrorReportingUnset = await this.isNotConfirmed(this.$staticConfig.ERROR_REPORT_SETTING_NAME);
			const isUsageReportingConfirmed = !await this.isNotConfirmed(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
			if (isErrorReportingUnset && isUsageReportingConfirmed) {
				await this.setStatus(this.$staticConfig.ERROR_REPORT_SETTING_NAME, trackFeatureUsage);
			}
		}
	}

	public async trackAcceptFeatureUsage(settings: { acceptTrackFeatureUsage: boolean }): Promise<void> {
		// Void at the moment
	}

	public async trackException(exception: any, message: string): Promise<void> {
		// void
	}

	public async trackInGoogleAnalytics(gaSettings: IGoogleAnalyticsData): Promise<void> {
		// Intentionally left blank.
	}

	public async trackEventActionInGoogleAnalytics(data: IEventActionData): Promise<void> {
		// Intentionally left blank.
	}

	public async setStatus(settingName: string, enabled: boolean): Promise<void> {
		this.analyticsStatuses[settingName] = enabled ? AnalyticsStatus.enabled : AnalyticsStatus.disabled;
		await this.$userSettingsService.saveSetting(settingName, enabled.toString());
	}

	public async isEnabled(settingName: string): Promise<boolean> {
		const analyticsStatus = await this.getStatus(settingName);
		return analyticsStatus === AnalyticsStatus.enabled;
	}

	public getStatusMessage(settingName: string, jsonFormat: boolean, readableSettingName: string): Promise<string> {
		if (jsonFormat) {
			return this.getJsonStatusMessage(settingName);
		}

		return this.getHumanReadableStatusMessage(settingName, readableSettingName);
	}

	@cache()
	protected async initAnalyticsStatuses(): Promise<void> {
		if (await this.$analyticsSettingsService.canDoRequest()) {
			this.$logger.trace("Initializing analytics statuses.");
			const settingsNames = [this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, this.$staticConfig.ERROR_REPORT_SETTING_NAME];

			for (const settingName of settingsNames) {
				await this.getStatus(settingName);
			}

			this.$logger.trace("Analytics statuses: ", this.analyticsStatuses);
		}
	}

	private async getStatus(settingName: string): Promise<AnalyticsStatus> {
		if (!_.has(this.analyticsStatuses, settingName)) {
			const settingValue = await this.$userSettingsService.getSettingValue<string>(settingName);

			if (settingValue) {
				const isEnabled = helpers.toBoolean(settingValue);
				if (isEnabled) {
					this.analyticsStatuses[settingName] = AnalyticsStatus.enabled;
				} else {
					this.analyticsStatuses[settingName] = AnalyticsStatus.disabled;
				}
			} else {
				this.analyticsStatuses[settingName] = AnalyticsStatus.notConfirmed;
			}
		}

		return this.analyticsStatuses[settingName];
	}

	private async isNotConfirmed(settingName: string): Promise<boolean> {
		const analyticsStatus = await this.getStatus(settingName);
		return analyticsStatus === AnalyticsStatus.notConfirmed;
	}

	private async getHumanReadableStatusMessage(settingName: string, readableSettingName: string): Promise<string> {
		let status: string = null;

		if (await this.isNotConfirmed(settingName)) {
			status = "disabled until confirmed";
		} else {
			status = await this.getStatus(settingName);
		}

		return `${readableSettingName} is ${status}.`;
	}

	private async getJsonStatusMessage(settingName: string): Promise<string> {
		const status = await this.getStatus(settingName);
		const enabled = status === AnalyticsStatus.notConfirmed ? null : status === AnalyticsStatus.enabled;
		return JSON.stringify({ enabled });
	}

}
