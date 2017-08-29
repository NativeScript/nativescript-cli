import { AnalyticsServiceBase } from "../../common/services/analytics-service-base";

export class EqatecAnalyticsProvider extends AnalyticsServiceBase implements IAnalyticsProvider {
	private static ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "9912cff308334c6d9ad9c33f76a983e3";
	private static NEW_PROJECT_ANALYTICS_API_KEY = "b40f24fcb4f94bccaf64e4dc6337422e";

	protected featureTrackingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_API_KEY,
		EqatecAnalyticsProvider.NEW_PROJECT_ANALYTICS_API_KEY
	];

	protected acceptUsageReportingAPIKeys: string[] = [
		EqatecAnalyticsProvider.ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY
	];

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		$staticConfig: Config.IStaticConfig,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$osInfo: IOsInfo) {
		super($logger, $options, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $osInfo);
	}

	public async trackInformation(data: IFeatureTrackingInformation): Promise<void> {
		try {
			await this.trackFeatureCore(`${data.featureName}.${data.featureValue}`);
		} catch (e) {
			this.$logger.trace(`Analytics exception: ${e}`);
		}
	}

	public async trackError(data: IExceptionsTrackingInformation): Promise<void> {
		try {
			await this.trackException(data.exception, data.message);
		} catch (e) {
			this.$logger.trace(`Analytics exception: ${e}`);
		}
	}

	public async acceptFeatureUsageTracking(data: IAcceptUsageReportingInformation): Promise<void> {
		try {
			await this.trackAcceptFeatureUsage({ acceptTrackFeatureUsage: data.acceptTrackFeatureUsage });
		} catch (e) {
			this.$logger.trace(`Analytics exception: ${e}`);
		}
	}

	public async finishTracking(): Promise<void> {
		this.tryStopEqatecMonitors();
	}

}

$injector.register("eqatecAnalyticsProvider", EqatecAnalyticsProvider);
