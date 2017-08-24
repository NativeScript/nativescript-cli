import { AnalyticsServiceBase } from "../../common/services/analytics-service-base";

export class EqatectAnalyticsService extends AnalyticsServiceBase {

	constructor(private analyticsSettings: IEqatecInitializeData,
		protected $logger: ILogger,
		protected $staticConfig: Config.IStaticConfig,
		$options: ICommonOptions,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$progressIndicator: IProgressIndicator,
		$osInfo: IOsInfo) {

		super($logger, $options, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $progressIndicator, $osInfo);
	}

	public async trackInformation(data: IFeatureTrackingInformation): Promise<void> {
		try {
			await this.startEqatecMonitor(this.analyticsSettings);

			if (this._eqatecMonitor) {
				this._eqatecMonitor.trackFeature(`${data.featureName}.${data.featureValue}`);
				await this.waitForSending();
			}
		} catch (e) {
			this.$logger.trace(`Analytics exception: ${e}`);
		}
	}

	public async trackError(data: IExceptionsTrackingInformation): Promise<void> {
		try {
			await this.startEqatecMonitor(this.analyticsSettings);

			if (this._eqatecMonitor) {
				this._eqatecMonitor.trackException(data.exception, data.message);
				await this.waitForSending();
			}
		} catch (e) {
			this.$logger.trace(`Analytics exception: ${e}`);
		}
	}

	public tryStopEqatecMonitor(code?: string | number): void {
		if (this._eqatecMonitor) {
			// remove the listener for exit event and explicitly call stop of monitor
			process.removeListener("exit", this.tryStopEqatecMonitor);
			this._eqatecMonitor.stop();
			this._eqatecMonitor = null;
		}
	}
}
