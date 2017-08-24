import { cache } from "../../common/decorators";

export class AnalyticsBroker implements IAnalyticsBroker {

	@cache()
	private get $eqatecAnalyticsProvider(): IAnalyticsProvider {
		return this.$injector.resolve("eqatecAnalyticsProvider", { pathToBootstrap: this.pathToBootstrap });
	}

	constructor(private pathToBootstrap: string,
		private $injector: IInjector) { }

	private get analyticsProviders(): IAnalyticsProvider[] {
		return [
			this.$eqatecAnalyticsProvider
		];
	}

	public async sendDataForTracking(trackInfo: ITrackingInformation): Promise<void> {
		for (const provider of this.analyticsProviders) {
			switch (trackInfo.type) {
				case TrackingTypes.Exception:
					await provider.trackException(<IExceptionsTrackingInformation>trackInfo);
					break;
				case TrackingTypes.Feature:
					await provider.trackFeature(<IFeatureTrackingInformation>trackInfo);
					break;
				case TrackingTypes.Finish:
					await provider.finishTracking();
					break;
				default:
					throw new Error(`Invalid tracking type: ${trackInfo.type}`);
			}

		}

	}

}
