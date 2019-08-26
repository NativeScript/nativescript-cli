import * as uuid from "uuid";
import * as ua from "universal-analytics";
import { AnalyticsClients } from "../../common/constants";
import { cache } from "../../common/decorators";

export class GoogleAnalyticsProvider implements IGoogleAnalyticsProvider {
	private currentPage: string;

	constructor(private clientId: string,
		private $staticConfig: IStaticConfig,
		private $analyticsSettingsService: IAnalyticsSettingsService,
		private $logger: ILogger,
		private $proxyService: IProxyService,
		private $config: IConfiguration,
		private $companyInsightsService: ICompanyInsightsService,
		private analyticsLoggingService: IFileLogService) {
	}

	public async trackHit(trackInfo: IGoogleAnalyticsData): Promise<void> {
		const sessionId = uuid.v4();

		try {
			await this.track(this.$config.GA_TRACKING_ID, trackInfo, sessionId);
		} catch (e) {
			this.analyticsLoggingService.logData({ type: FileLogMessageType.Error, message: `Unable to track information ${JSON.stringify(trackInfo)}. Error is: ${e}` });
			this.$logger.trace("Analytics exception: ", e);
		}
	}

	@cache()
	private getVisitor(gaTrackingId: string, proxy: string): ua.Visitor {
		this.analyticsLoggingService.logData({ message: `Initializing Google Analytics visitor for id: ${gaTrackingId} with clientId: ${this.clientId}.` });
		const visitor = ua({
			tid: gaTrackingId,
			cid: this.clientId,
			headers: {
				["User-Agent"]: this.$analyticsSettingsService.getUserAgentString(`tnsCli/${this.$staticConfig.version}`)
			},
			requestOptions: {
				proxy
			},
			https: true
		});

		this.analyticsLoggingService.logData({ message: `Successfully initialized Google Analytics visitor for id: ${gaTrackingId} with clientId: ${this.clientId}.` });
		return visitor;
	}

	private async track(gaTrackingId: string, trackInfo: IGoogleAnalyticsData, sessionId: string): Promise<void> {
		const proxySettings = await this.$proxyService.getCache();
		const proxy = proxySettings && proxySettings.proxy;

		const visitor = this.getVisitor(gaTrackingId, proxy);

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
			[GoogleAnalyticsCustomDimensions.isShared]: null,
			[GoogleAnalyticsCustomDimensions.sessionID]: sessionId,
			[GoogleAnalyticsCustomDimensions.client]: AnalyticsClients.Unknown
		};

		const playgrounInfo = await this.$analyticsSettingsService.getPlaygroundInfo();
		if (playgrounInfo && playgrounInfo.id) {
			defaultValues[GoogleAnalyticsCustomDimensions.playgroundId] = playgrounInfo.id;
			defaultValues[GoogleAnalyticsCustomDimensions.usedTutorial] = playgrounInfo.usedTutorial.toString();
		}

		const companyData = await this.$companyInsightsService.getCompanyData();
		if (companyData) {
			defaultValues[GoogleAnalyticsCustomDimensions.companyName] = companyData.name;
			defaultValues[GoogleAnalyticsCustomDimensions.companyCountry] = companyData.country;
			defaultValues[GoogleAnalyticsCustomDimensions.companyRevenue] = companyData.revenue;
			defaultValues[GoogleAnalyticsCustomDimensions.companyIndustries] = companyData.industries;
			defaultValues[GoogleAnalyticsCustomDimensions.companyEmployeeCount] = companyData.employeeCount;
		}

		customDimensions = _.merge(defaultValues, customDimensions);

		_.each(customDimensions, (value, key) => {
			this.analyticsLoggingService.logData({ message: `Setting custom dimension ${key} to value ${value}` });
			visitor.set(key, value);
		});
	}

	private trackEvent(visitor: ua.Visitor, trackInfo: IGoogleAnalyticsEventData): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			visitor.event(trackInfo.category, trackInfo.action, trackInfo.label, trackInfo.value, { p: this.currentPage }, (err: Error) => {
				if (err) {
					this.analyticsLoggingService.logData({
						message: `Unable to track event with category: '${trackInfo.category}', action: '${trackInfo.action}', label: '${trackInfo.label}', ` +
							`value: '${trackInfo.value}' attached page: ${this.currentPage}. Error is: ${err}.`,
						type: FileLogMessageType.Error
					});

					reject(err);
					return;
				}

				this.analyticsLoggingService.logData({ message: `Tracked event with category: '${trackInfo.category}', action: '${trackInfo.action}', label: '${trackInfo.label}', value: '${trackInfo.value}' attached page: ${this.currentPage}.` });
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
					this.analyticsLoggingService.logData({
						message: `Unable to track pageview with path '${trackInfo.path}' and title: '${trackInfo.title}' Error is: ${err}.`,
						type: FileLogMessageType.Error
					});

					reject(err);
					return;
				}

				this.analyticsLoggingService.logData({ message: `Tracked pageview with path '${trackInfo.path}' and title: '${trackInfo.title}'.` });
				resolve();
			});
		});
	}
}

$injector.register("googleAnalyticsProvider", GoogleAnalyticsProvider);
