import { cache } from "../../common/decorators";
import {
	IAnalyticsBroker,
	IGoogleAnalyticsProvider,
	IGoogleAnalyticsTrackingInformation,
	ITrackingInformation
} from "./analytics";
import { IAnalyticsSettingsService } from "../../common/declarations";

export class AnalyticsBroker implements IAnalyticsBroker {

	@cache()
	private async getGoogleAnalyticsProvider(): Promise<IGoogleAnalyticsProvider> {
		const clientId = await this.$analyticsSettingsService.getClientId();
		return $injector.resolve("googleAnalyticsProvider", { clientId, analyticsLoggingService: this.analyticsLoggingService });
	}

	constructor(private $analyticsSettingsService: IAnalyticsSettingsService,
		private analyticsLoggingService: IFileLogService) { }

	public async sendDataForTracking(trackInfo: ITrackingInformation): Promise<void> {
		try {
			const googleProvider = await this.getGoogleAnalyticsProvider();
			await googleProvider.trackHit(<IGoogleAnalyticsTrackingInformation>trackInfo);
		} catch (err) {
			this.analyticsLoggingService.logData({ message: `AnalyticsBroker unable to execute action in sendDataForTracking: ${err}`, type: FileLogMessageType.Error });
		}
	}
}
