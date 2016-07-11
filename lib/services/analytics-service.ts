import {AnalyticsServiceBase} from "../common/services/analytics-service-base";

export class AnalyticsService extends AnalyticsServiceBase implements IAnalyticsService {
	private static ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "9912cff308334c6d9ad9c33f76a983e3";

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		$staticConfig: Config.IStaticConfig,
		$errors: IErrors,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$progressIndicator: IProgressIndicator) {
		super($logger, $options, $staticConfig, $errors, $prompter, $userSettingsService, $analyticsSettingsService, $progressIndicator);
	}

	protected checkConsentCore(trackFeatureUsage: boolean): IFuture<void> {
		return (() => {
			this.restartEqatecMonitor(AnalyticsService.ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY).wait();
			super.checkConsentCore(trackFeatureUsage).wait();

			// Stop the monitor, so correct API_KEY will be used when features are tracked.
			this.tryStopEqatecMonitor();
		}).future<void>()();
	}
}

$injector.register("analyticsService", AnalyticsService);
