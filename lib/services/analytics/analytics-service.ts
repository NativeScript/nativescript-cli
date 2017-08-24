import { AnalyticsServiceBase } from "../../common/services/analytics-service-base";
import { ChildProcess } from "child_process";
import * as path from "path";
import { cache } from "../../common/decorators";

export class AnalyticsService extends AnalyticsServiceBase implements IAnalyticsService {
	private static ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "9912cff308334c6d9ad9c33f76a983e3";
	private static ANALYTICS_BROKER_START_TIMEOUT = 30 * 1000;

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		$staticConfig: Config.IStaticConfig,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$progressIndicator: IProgressIndicator,
		$osInfo: IOsInfo,
		private $childProcess: IChildProcess,
		private $processService: IProcessService) {
		super($logger, $options, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $progressIndicator, $osInfo);
	}

	public track(featureName: string, featureValue: string): Promise<void> {
		return this.sendDataForTracking(featureName, featureValue);
	}

	public trackException(exception: any, message: string): Promise<void> {
		return this.sendExceptionForTracking(exception, message);
	}

	protected async checkConsentCore(trackFeatureUsage: boolean): Promise<void> {
		await this.restartEqatecMonitor(AnalyticsService.ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY);
		await super.checkConsentCore(trackFeatureUsage);

		// Stop the monitor, so correct API_KEY will be used when features are tracked.
		this.tryStopEqatecMonitor();
	}

	@cache()
	private getAnalyticsBroker(): Promise<ChildProcess> {
		return new Promise<ChildProcess>((resolve, reject) => {
			const broker = this.$childProcess.spawn("node",
				[
					path.join(__dirname, "analytics-broker-process.js"),
					this.$staticConfig.PATH_TO_BOOTSTRAP
				],
				{
					stdio: ["ignore", "ignore", "ignore", "ipc"],
					detached: true
				}
			);

			broker.unref();

			let isSettled = false;

			const timeoutId = setTimeout(() => {
				if (!isSettled) {
					reject(new Error("Unable to start Analytics Broker process."));
				}
			}, AnalyticsService.ANALYTICS_BROKER_START_TIMEOUT);

			broker.on("error", (err: Error) => {
				clearTimeout(timeoutId);

				if (!isSettled) {
					isSettled = true;
					reject(err);
				}
			});

			broker.on("message", (data: any) => {
				if (data === AnalyticsMessages.BrokerReadyToReceive) {
					clearTimeout(timeoutId);

					if (!isSettled) {
						isSettled = true;
						resolve(broker);
					}
				}
			});

			this.$processService.attachToProcessExitSignals(this, () => {
				broker.send({
					type: TrackingTypes.Finish
				});
			});
		});
	}

	private async sendDataForTracking(featureName: string, featureValue: string): Promise<void> {
		await this.initAnalyticsStatuses();

		if (this.analyticsStatuses[this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME] === AnalyticsStatus.enabled) {
			return this.sendMessageToBroker(
				{
					type: TrackingTypes.Feature,
					featureName: featureName,
					featureValue: featureValue
				}
			);
		}
	}

	private async sendExceptionForTracking(exception: Error, message: string): Promise<void> {
		await this.initAnalyticsStatuses();

		if (this.analyticsStatuses[this.$staticConfig.ERROR_REPORT_SETTING_NAME] === AnalyticsStatus.enabled) {
			return this.sendMessageToBroker(
				{
					type: TrackingTypes.Exception,
					exception,
					message
				}
			);
		}
	}

	private async sendMessageToBroker(message: any): Promise<void> {
		const broker = await this.getAnalyticsBroker();
		return new Promise<void>((resolve, reject) => broker.send(message, resolve));
	}
}

$injector.register("analyticsService", AnalyticsService);
