import * as uuid from "uuid";
import * as ua from "universal-analytics";
import { AnalyticsClients } from "../../common/constants";

export class GoogleAnalyticsProvider implements IGoogleAnalyticsProvider {
	private static GA_TRACKING_ID = "UA-111455-44";
	private currentPage: string;

	constructor(private clientId: string,
		private $staticConfig: IStaticConfig,
		private $analyticsSettingsService: IAnalyticsSettingsService,
		private $logger: ILogger,
		private $proxyService: IProxyService) {
	}

	public async trackHit(trackInfo: IGoogleAnalyticsData): Promise<void> {
		const sessionId = uuid.v4();

		try {
			await this.track(GoogleAnalyticsProvider.GA_TRACKING_ID, trackInfo, sessionId);
		} catch (e) {
			this.$logger.trace("Analytics exception: ", e);
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

		await this.setCustomDimensions(visitor, trackInfo.customDimensions, sessionId);

		switch (trackInfo.googleAnalyticsDataType) {
			case GoogleAnalyticsDataType.Page:
				await this.trackPageView(visitor, <IGoogleAnalyticsPageviewData>trackInfo);
				break;
			case GoogleAnalyticsDataType.Event:
				await this.trackEvent(visitor, <IGoogleAnalyticsEventData>trackInfo);
				break;
		}
	}

	private async setCustomDimensions(visitor: ua.Visitor, customDimensions: IStringDictionary, sessionId: string): Promise<void> {
		const defaultValues: IStringDictionary = {
			[GoogleAnalyticsCustomDimensions.cliVersion]: this.$staticConfig.version,
			[GoogleAnalyticsCustomDimensions.nodeVersion]: process.version,
			[GoogleAnalyticsCustomDimensions.clientID]: this.clientId,
			[GoogleAnalyticsCustomDimensions.projectType]: null,
			[GoogleAnalyticsCustomDimensions.sessionID]: sessionId,
			[GoogleAnalyticsCustomDimensions.client]: AnalyticsClients.Unknown
		};

		const playgrounInfo = await this.$analyticsSettingsService.getPlaygroundInfo();
		if (playgrounInfo && playgrounInfo.id) {
			defaultValues[GoogleAnalyticsCustomDimensions.playgroundId] = playgrounInfo.id;
			defaultValues[GoogleAnalyticsCustomDimensions.usedTutorial] = playgrounInfo.usedTutorial.toString();
		}

		customDimensions = _.merge(defaultValues, customDimensions);

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
