import { AnalyticsServiceBase } from "../common/services/analytics-service-base";
import { exported } from "../common/decorators";

export class AnalyticsService extends AnalyticsServiceBase implements IAnalyticsService {
	private static ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "9912cff308334c6d9ad9c33f76a983e3";

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		$staticConfig: Config.IStaticConfig,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$progressIndicator: IProgressIndicator,
		$osInfo: IOsInfo) {
		super($logger, $options, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $progressIndicator, $osInfo);
	}

	@exported("analyticsService")
	public async startEqatecMonitor(projectApiKey: string): Promise<void> {
		if (await this.isEnabled(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) || await this.isEnabled(this.$staticConfig.ERROR_REPORT_SETTING_NAME)) {
			await this.restartEqatecMonitor(projectApiKey);
		}
	}

	protected async checkConsentCore(trackFeatureUsage: boolean): Promise<void> {
		await this.restartEqatecMonitor(AnalyticsService.ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY);
		await super.checkConsentCore(trackFeatureUsage);

		// Stop the monitor, so correct API_KEY will be used when features are tracked.
		this.tryStopEqatecMonitor();
	}
}

$injector.register("analyticsService", AnalyticsService);
