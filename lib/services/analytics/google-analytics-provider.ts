import * as uuid from "uuid";
import * as ua from "universal-analytics";
import { AnalyticsClients } from "../../common/constants";

export class GoogleAnalyticsProvider implements IGoogleAnalyticsProvider {
	private static GA_TRACKING_ID = "UA-111455-44";
	private static GA_CROSS_CLIENT_TRACKING_ID = "UA-90319637-1";
	private static FIRST_RUN_DATE = "FirstRunDate";
	private currentPage: string;

	constructor(private clientId: string,
		private $staticConfig: IStaticConfig,
		private $hostInfo: IHostInfo,
		private $osInfo: IOsInfo,
		private $sysInfo: ISysInfo,
		private $userSettingsService: IUserSettingsService) {
	}

	public async trackHit(trackInfo: IGoogleAnalyticsData): Promise<void> {
		const trackingIds = [GoogleAnalyticsProvider.GA_TRACKING_ID, GoogleAnalyticsProvider.GA_CROSS_CLIENT_TRACKING_ID];

		_.each(trackingIds, (gaTrackingId) => {
			this.track(gaTrackingId, trackInfo);
		});
	}

	private async track(gaTrackingId: string, trackInfo: IGoogleAnalyticsData): Promise<void> {
		const visitor = ua({
			tid: gaTrackingId,
			cid: this.clientId,
			headers: {
				["User-Agent"]: this.getUserAgentString()
			}
		});

		switch (gaTrackingId) {
			case GoogleAnalyticsProvider.GA_CROSS_CLIENT_TRACKING_ID:
				await this.setCrossClientCustomDimensions(visitor);
				break;
			default:
				this.setCustomDimensions(visitor, trackInfo.customDimensions);
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

	private setCustomDimensions(visitor: ua.Visitor, customDimensions: IStringDictionary): void {
		const defaultValues: IStringDictionary = {
			[GoogleAnalyticsCustomDimensions.cliVersion]: this.$staticConfig.version,
			[GoogleAnalyticsCustomDimensions.nodeVersion]: process.version,
			[GoogleAnalyticsCustomDimensions.clientID]: this.clientId,
			[GoogleAnalyticsCustomDimensions.projectType]: null,
			[GoogleAnalyticsCustomDimensions.sessionID]: uuid.v4(),
			[GoogleAnalyticsCustomDimensions.client]: AnalyticsClients.Unknown
		};

		customDimensions = _.merge(defaultValues, customDimensions);

		_.each(customDimensions, (value, key) => {
			visitor.set(key, value);
		});
	}

	private async setCrossClientCustomDimensions(visitor: ua.Visitor): Promise<void> {
		let firstRunDate = <string>(await this.$userSettingsService.getSettingValue(GoogleAnalyticsProvider.FIRST_RUN_DATE));

		if (!firstRunDate || !_.isString(firstRunDate)) {
			firstRunDate = new Date().toJSON();

			await this.$userSettingsService.saveSetting(GoogleAnalyticsProvider.FIRST_RUN_DATE, firstRunDate);
		}

		const customDimensions: IStringDictionary = {
			[GoogleAnalyticsCrossClientCustomDimensions.shellVersion]: null,
			[GoogleAnalyticsCrossClientCustomDimensions.nodeVersion]: process.version,
			[GoogleAnalyticsCrossClientCustomDimensions.npmVersion]: await this.$sysInfo.getNpmVersion(),
			[GoogleAnalyticsCrossClientCustomDimensions.tnsVersion]: this.$staticConfig.version,
			[GoogleAnalyticsCrossClientCustomDimensions.accountType]: null,
			[GoogleAnalyticsCrossClientCustomDimensions.localBuildEnv]: null,
			[GoogleAnalyticsCrossClientCustomDimensions.dayFromFirstRun]: this.getDaysDiffFromToday(firstRunDate),
			[GoogleAnalyticsCrossClientCustomDimensions.dayFromFirstLogin]: null,
			[GoogleAnalyticsCrossClientCustomDimensions.sessionId]: null,
			[GoogleAnalyticsCrossClientCustomDimensions.clientId]: this.clientId,
			[GoogleAnalyticsCrossClientCustomDimensions.timestampPerHit]: new Date().toJSON(),
			[GoogleAnalyticsCrossClientCustomDimensions.crossClientId]: this.clientId,
			[GoogleAnalyticsCrossClientCustomDimensions.uiVersion]: null
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

	private getUserAgentString(): string {
		let osString = "";
		const osRelease = this.$osInfo.release();

		if (this.$hostInfo.isWindows) {
			osString = `Windows NT ${osRelease}`;
		} else if (this.$hostInfo.isDarwin) {
			osString = `Macintosh`;
			const macRelease = this.getMacOSReleaseVersion(osRelease);
			if (macRelease) {
				osString += `; Intel Mac OS X ${macRelease}`;
			}
		} else {
			osString = `Linux x86`;
			if (this.$osInfo.arch() === "x64") {
				osString += "_64";
			}
		}

		const userAgent = `tnsCli/${this.$staticConfig.version} (${osString}; ${this.$osInfo.arch()})`;

		return userAgent;
	}

	private getMacOSReleaseVersion(osRelease: string): string {
		// https://en.wikipedia.org/wiki/Darwin_(operating_system)#Release_history
		// Each macOS version is labeled 10.<version>, where it looks like <versions> is taken from the major version returned by os.release() (16.x.x for example) and subtracting 4 from it.
		// So the version becomes "10.12" in this case.
		// Could be improved by spawning `system_profiler SPSoftwareDataType` and getting the System Version line from the result.
		const majorVersion = osRelease && _.first(osRelease.split("."));
		return majorVersion && `10.${+majorVersion - 4}`;
	}

	private getDaysDiffFromToday(dateJson: string): string {
		const millisecondsPerDay = 1000 * 60 * 60 * 24;

		const date1 = new Date(dateJson);
		const date2 = new Date();
		const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
		const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

		return Math.floor((utc2 - utc1) / millisecondsPerDay).toString();
	}
}

$injector.register("googleAnalyticsProvider", GoogleAnalyticsProvider);
