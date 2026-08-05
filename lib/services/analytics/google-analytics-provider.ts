import { v4 as uuidv4 } from "uuid";
import { AnalyticsClients } from "../../common/constants";
import { IStaticConfig, IConfiguration } from "../../declarations";
import {
	IAnalyticsSettingsService,
	IDictionary,
	IProxyService,
	IStringDictionary,
	Server,
} from "../../common/declarations";
import { GoogleAnalyticsDataType } from "../../common/enums";
import { IGoogleAnalyticsProvider } from "./analytics";
import {
	IGoogleAnalyticsData,
	IGoogleAnalyticsPageviewData,
	IGoogleAnalyticsEventData,
} from "../../common/definitions/google-analytics";
import * as _ from "lodash";
import { injector } from "../../common/yok";
import { FileLogMessageType } from "../../detached-processes/detached-process-enums";
import { GoogleAnalyticsCustomDimensions } from "../../common/services/analytics/google-analytics-custom-dimensions";

const GA4_COLLECT_URL = "https://www.google-analytics.com/mp/collect";

// Event and parameter names accept only letters, digits and underscores, must
// lead with a letter, and are truncated past these lengths server-side.
const MAX_EVENT_NAME_LENGTH = 40;
const MAX_PARAM_VALUE_LENGTH = 100;

// The Measurement Protocol carries named parameters where the classic protocol
// carried numbered cdN slots, so the dimensions are translated on the way out.
// Callers keep setting GoogleAnalyticsCustomDimensions and never see this.
const GA4_PARAM_NAMES: IStringDictionary = {
	[GoogleAnalyticsCustomDimensions.cliVersion]: "cli_version",
	[GoogleAnalyticsCustomDimensions.projectType]: "project_type",
	[GoogleAnalyticsCustomDimensions.clientID]: "client_uuid",
	[GoogleAnalyticsCustomDimensions.sessionID]: "session_id",
	[GoogleAnalyticsCustomDimensions.client]: "client",
	[GoogleAnalyticsCustomDimensions.nodeVersion]: "node_version",
	[GoogleAnalyticsCustomDimensions.isShared]: "is_shared",
};

export class GoogleAnalyticsProvider implements IGoogleAnalyticsProvider {
	private currentCommand: string;

	constructor(
		private clientId: string,
		private $staticConfig: IStaticConfig,
		private $analyticsSettingsService: IAnalyticsSettingsService,
		private $logger: ILogger,
		private $proxyService: IProxyService,
		private $config: IConfiguration,
		private $httpClient: Server.IHttpClient,
		private analyticsLoggingService: IFileLogService,
	) {}

	public async trackHit(trackInfo: IGoogleAnalyticsData): Promise<void> {
		const sessionId = uuidv4();

		try {
			await this.track(trackInfo, sessionId);
		} catch (e) {
			this.analyticsLoggingService.logData({
				type: FileLogMessageType.Error,
				message: `Unable to track information ${JSON.stringify(
					trackInfo,
				)}. Error is: ${e}`,
			});
			this.$logger.trace("Analytics exception: ", e);
		}
	}

	private async track(
		trackInfo: IGoogleAnalyticsData,
		sessionId: string,
	): Promise<void> {
		const { GA_MEASUREMENT_ID, GA_API_SECRET } = this.$config;

		if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
			this.analyticsLoggingService.logData({
				message:
					"Google Analytics is not configured (missing measurement id or api secret), skipping hit.",
			});
			return;
		}

		const event = this.getEvent(trackInfo, sessionId);

		if (!event) {
			return;
		}

		const proxySettings = await this.$proxyService.getCache();
		const url = `${GA4_COLLECT_URL}?measurement_id=${encodeURIComponent(
			GA_MEASUREMENT_ID,
		)}&api_secret=${encodeURIComponent(GA_API_SECRET)}`;

		this.analyticsLoggingService.logData({
			message: `Sending Google Analytics event '${event.name}' for clientId: ${this.clientId}.`,
		});

		await this.$httpClient.httpRequest(
			{
				url,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					["User-Agent"]: this.$analyticsSettingsService.getUserAgentString(
						`tnsCli/${this.$staticConfig.version}`,
					),
				},
				body: JSON.stringify({
					client_id: this.clientId,
					// the CLI has no advertising context and must not create one
					non_personalized_ads: true,
					events: [event],
				}),
			},
			proxySettings,
		);

		this.analyticsLoggingService.logData({
			message: `Tracked Google Analytics event '${event.name}'.`,
		});
	}

	private getEvent(
		trackInfo: IGoogleAnalyticsData,
		sessionId: string,
	): { name: string; params: IDictionary<string | number> } {
		const params = this.getCustomDimensionParams(
			trackInfo.customDimensions,
			sessionId,
		);

		switch (trackInfo.googleAnalyticsDataType) {
			case GoogleAnalyticsDataType.Page: {
				const pageviewData = <IGoogleAnalyticsPageviewData>trackInfo;
				this.currentCommand = pageviewData.path;

				// a command is not a page: page_view is keyed off a page_location URL
				// this has none, so commands are their own event instead. `title` is
				// dropped because callers set it to the same beautified command name.
				return {
					name: "command",
					params: _.assign(params, {
						command_name: this.truncate(pageviewData.path),
					}),
				};
			}
			case GoogleAnalyticsDataType.Event: {
				const eventData = <IGoogleAnalyticsEventData>trackInfo;

				return {
					name: this.toEventName(eventData.action),
					params: _.omitBy(
						_.assign(params, {
							event_category: this.truncate(eventData.category),
							event_label: this.truncate(eventData.label),
							value: eventData.value,
							// events carry no context of their own, so attribute them to
							// the command that is running
							command_name: this.truncate(this.currentCommand),
						}),
						_.isNil,
					) as IDictionary<string | number>,
				};
			}
		}

		return null;
	}

	private getCustomDimensionParams(
		customDimensions: IStringDictionary,
		sessionId: string,
	): IDictionary<string | number> {
		const defaultValues: IStringDictionary = {
			[GoogleAnalyticsCustomDimensions.cliVersion]: this.$staticConfig.version,
			[GoogleAnalyticsCustomDimensions.nodeVersion]: process.version,
			[GoogleAnalyticsCustomDimensions.clientID]: this.clientId,
			[GoogleAnalyticsCustomDimensions.projectType]: null,
			[GoogleAnalyticsCustomDimensions.isShared]: null,
			[GoogleAnalyticsCustomDimensions.sessionID]: sessionId,
			[GoogleAnalyticsCustomDimensions.client]: AnalyticsClients.Unknown,
		};

		const params: IDictionary<string | number> = {
			// realtime reports drop events that report no engagement at all
			engagement_time_msec: 1,
		};

		_.each(_.merge(defaultValues, customDimensions), (value, key) => {
			if (_.isNil(value)) {
				return;
			}

			params[GA4_PARAM_NAMES[key] || key] = this.truncate(value);
		});

		return params;
	}

	private toEventName(action: string): string {
		const name = (action || "")
			.replace(/[^A-Za-z0-9_]/g, "_")
			.replace(/^[^A-Za-z]+/, "")
			.slice(0, MAX_EVENT_NAME_LENGTH);

		return name || "cli_event";
	}

	private truncate(value: string): string {
		return _.isNil(value) ? value : `${value}`.slice(0, MAX_PARAM_VALUE_LENGTH);
	}
}

injector.register("googleAnalyticsProvider", GoogleAnalyticsProvider);
