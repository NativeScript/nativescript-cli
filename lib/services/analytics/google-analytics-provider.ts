import * as uuid from "uuid";
import * as ua from "universal-analytics";
import { AnalyticsClients } from "../../common/constants";

export class GoogleAnalyticsProvider implements IGoogleAnalyticsProvider {
	private static GA_TRACKING_ID = "UA-111455-44";
	private static GA_CROSS_CLIENT_TRACKING_ID = "UA-111455-51";
	private currentPage: string;

	constructor(private clientId: string,
		private $staticConfig: IStaticConfig,
		private $analyticsSettingsService: IAnalyticsSettingsService,
		private $logger: ILogger,
		private $proxyService: IProxyService) {
	}

	public async trackHit(trackInfo: IGoogleAnalyticsData): Promise<void> {
		const trackingIds = [GoogleAnalyticsProvider.GA_TRACKING_ID, GoogleAnalyticsProvider.GA_CROSS_CLIENT_TRACKING_ID];
		const sessionId = uuid.v4();

		for (const gaTrackingId of trackingIds) {
			try {
				await this.track(gaTrackingId, trackInfo, sessionId);
			} catch (e) {
				this.$logger.trace("Analytics exception: ", e);
			}
		}
	}

	private async track(gaTrackingId: string, trackInfo: IGoogleAnalyticsData, sessionId: string): Promise<void> {
		const proxySettings = await this.$proxyService.getCache();
		const proxy = proxySettings && proxySettings.proxy;
		const visitor = ua({
			tid: gaTrackingId,
			cid: this.clientId,
			headers: {
				["User-Agent"]: this.$analyticsSettingsService.getUserAgentString(`tnsCli/${this.$staticConfig.version}`)
			},
			requestOptions: {
				proxy
			}
		});

		switch (gaTrackingId) {
			case GoogleAnalyticsProvider.GA_CROSS_CLIENT_TRACKING_ID:
				this.setCrossClientCustomDimensions(visitor, sessionId);
				break;
			default:
				this.setCustomDimensions(visitor, trackInfo.customDimensions, sessionId);
				break;
		}

		switch (trackInfo.googleAnalyticsDataType) {
			case GoogleAnalyticsDataType.Page:
				await this.trackPageView(visitor, <IGoogleAnalyticsPageviewData>trackInfo);
				break;
			case GoogleAnalyticsDataType.Event:
				await this.trackEvent(visitor, <IGoogleAnalyticsEventData>trackInfo);
				break;
		}
	}

	private setCustomDimensions(visitor: ua.Visitor, customDimensions: IStringDictionary, sessionId: string): void {
		const defaultValues: IStringDictionary = {
			[GoogleAnalyticsCustomDimensions.cliVersion]: this.$staticConfig.version,
			[GoogleAnalyticsCustomDimensions.nodeVersion]: process.version,
			[GoogleAnalyticsCustomDimensions.clientID]: this.clientId,
			[GoogleAnalyticsCustomDimensions.projectType]: null,
			[GoogleAnalyticsCustomDimensions.sessionID]: sessionId,
			[GoogleAnalyticsCustomDimensions.client]: AnalyticsClients.Unknown
		};

		customDimensions = _.merge(defaultValues, customDimensions);

		_.each(customDimensions, (value, key) => {
			visitor.set(key, value);
		});
	}

	private async setCrossClientCustomDimensions(visitor: ua.Visitor, sessionId: string): Promise<void> {
		const customDimensions: IStringDictionary = {
			[GoogleAnalyticsCrossClientCustomDimensions.sessionId]: sessionId,
			[GoogleAnalyticsCrossClientCustomDimensions.clientId]: this.clientId,
			[GoogleAnalyticsCrossClientCustomDimensions.crossClientId]: this.clientId,
		};

		_.each(customDimensions, (value, key) => {
			visitor.set(key, value);
		});
	}

	private trackEvent(visitor: ua.Visitor, trackInfo: IGoogleAnalyticsEventData): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			visitor.event(trackInfo.category, trackInfo.action, trackInfo.label, trackInfo.value, { p: this.currentPage }, (err: Error) => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	}

	private trackPageView(visitor: ua.Visitor, trackInfo: IGoogleAnalyticsPageviewData): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.currentPage = trackInfo.path;

			const pageViewData: ua.PageviewParams = {
				dp: trackInfo.path,
				dt: trackInfo.title
			};

			visitor.pageview(pageViewData, (err) => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	}
}

$injector.register("googleAnalyticsProvider", GoogleAnalyticsProvider);
