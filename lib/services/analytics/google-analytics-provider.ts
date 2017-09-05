import * as uuid from "uuid";
import * as ua from "universal-analytics";
import { AnalyticsClients } from "../../common/constants";

export class GoogleAnalyticsProvider implements IGoogleAnalyticsProvider {
	private static GA_TRACKING_ID = "UA-111455-44";
	private currentPage: string;

	constructor(private clientId: string,
		private $staticConfig: IStaticConfig,
		private $hostInfo: IHostInfo,
		private $osInfo: IOsInfo) {
	}

	public async trackHit(trackInfo: IGoogleAnalyticsData): Promise<void> {
		const visitor = ua({
			tid: GoogleAnalyticsProvider.GA_TRACKING_ID,
			cid: this.clientId,
			headers: {
				["User-Agent"]: this.getUserAgentString()
			}
		});

		this.setCustomDimensions(visitor, trackInfo.customDimensions);

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
		// Each macOS version is labeled 10.<version>, where it looks like <versions> is taken from the major version returned by os.release() (16.x.x for example) and substituting 4 from it.
		// So the version becomes "10.12" in this case.
		// Could be improved by spawning `system_profiler SPSoftwareDataType` and getting the System Version line from the result.
		const majorVersion = osRelease && _.first(osRelease.split("."));
		return majorVersion && `10.${+majorVersion - 4}`;
	}
}

$injector.register("googleAnalyticsProvider", GoogleAnalyticsProvider);
