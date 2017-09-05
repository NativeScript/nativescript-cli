import { cache } from "../../common/decorators";

export class AnalyticsBroker implements IAnalyticsBroker {

	@cache()
	private async getEqatecAnalyticsProvider(): Promise<IAnalyticsProvider> {
		return this.$injector.resolve("eqatecAnalyticsProvider");
	}

	@cache()
	private async getGoogleAnalyticsProvider(): Promise<IGoogleAnalyticsProvider> {
		const clientId = await this.$analyticsSettingsService.getClientId();
		return this.$injector.resolve("googleAnalyticsProvider", { clientId });
	}

	constructor(private $analyticsSettingsService: IAnalyticsSettingsService,
		private $injector: IInjector) { }

	public async sendDataForTracking(trackInfo: ITrackingInformation): Promise<void> {
		const eqatecProvider = await this.getEqatecAnalyticsProvider();
		const googleProvider = await this.getGoogleAnalyticsProvider();

		switch (trackInfo.type) {
			case TrackingTypes.Exception:
				await eqatecProvider.trackError(<IExceptionsTrackingInformation>trackInfo);
				break;
			case TrackingTypes.Feature:
				await eqatecProvider.trackInformation(<IFeatureTrackingInformation>trackInfo);
				break;
			case TrackingTypes.AcceptTrackFeatureUsage:
				await eqatecProvider.acceptFeatureUsageTracking(<IAcceptUsageReportingInformation>trackInfo);
				break;
			case TrackingTypes.GoogleAnalyticsData:
				await googleProvider.trackHit(<IGoogleAnalyticsTrackingInformation>trackInfo);
				break;
			case TrackingTypes.Finish:
				await eqatecProvider.finishTracking();
				break;
			default:
				throw new Error(`Invalid tracking type: ${trackInfo.type}`);
		}

	}

}
