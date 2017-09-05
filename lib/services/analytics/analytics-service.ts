import { AnalyticsServiceBase } from "../../common/services/analytics-service-base";
import { ChildProcess } from "child_process";
import * as path from "path";
import { cache } from "../../common/decorators";
import { isInteractive } from '../../common/helpers';
import { DeviceTypes, AnalyticsClients } from "../../common/constants";

export class AnalyticsService extends AnalyticsServiceBase implements IAnalyticsService {
	private static ANALYTICS_BROKER_START_TIMEOUT = 30 * 1000;

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		$staticConfig: Config.IStaticConfig,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$osInfo: IOsInfo,
		private $childProcess: IChildProcess,
		private $processService: IProcessService,
		private $projectDataService: IProjectDataService,
		private $mobileHelper: Mobile.IMobileHelper) {
		super($logger, $options, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $osInfo);
	}

	public track(featureName: string, featureValue: string): Promise<void> {
		const data: IFeatureTrackingInformation = {
			type: TrackingTypes.Feature,
			featureName: featureName,
			featureValue: featureValue
		};

		return this.sendInfoForTracking(data, this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
	}

	public trackException(exception: any, message: string): Promise<void> {
		const data: IExceptionsTrackingInformation = {
			type: TrackingTypes.Exception,
			exception,
			message
		};

		return this.sendInfoForTracking(data, this.$staticConfig.ERROR_REPORT_SETTING_NAME);
	}

	public async trackAcceptFeatureUsage(settings: { acceptTrackFeatureUsage: boolean }): Promise<void> {
		this.sendMessageToBroker(<IAcceptUsageReportingInformation>{
			type: TrackingTypes.AcceptTrackFeatureUsage,
			acceptTrackFeatureUsage: settings.acceptTrackFeatureUsage
		});
	}

	public async trackInGoogleAnalytics(gaSettings: IGoogleAnalyticsData): Promise<void> {
		await this.initAnalyticsStatuses();

		if (!this.$staticConfig.disableAnalytics && this.analyticsStatuses[this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME] === AnalyticsStatus.enabled) {
			gaSettings.customDimensions = gaSettings.customDimensions || {};
			gaSettings.customDimensions[GoogleAnalyticsCustomDimensions.client] = this.$options.analyticsClient || (isInteractive() ? AnalyticsClients.Cli : AnalyticsClients.Unknown);

			const googleAnalyticsData: IGoogleAnalyticsTrackingInformation = _.merge({ type: TrackingTypes.GoogleAnalyticsData }, gaSettings, { category: AnalyticsClients.Cli });
			return this.sendMessageToBroker(googleAnalyticsData);
		}
	}

	public async trackEventActionInGoogleAnalytics(data: IEventActionData): Promise<void> {
		const device = data.device;
		const platform = device ? device.deviceInfo.platform : data.platform;
		const isForDevice = device ? !device.isEmulator : data.isForDevice;

		let label: string = "";
		label = this.addDataToLabel(label, platform);

		if (isForDevice !== null) {
			// In case action is Build and platform is Android, we do not know if the deviceType is emulator or device.
			// Just exclude the device_type in this case.
			const deviceType = isForDevice ? DeviceTypes.Device : (this.$mobileHelper.isAndroidPlatform(platform) ? DeviceTypes.Emulator : DeviceTypes.Simulator);
			label = this.addDataToLabel(label, deviceType);
		}

		if (device) {
			label = this.addDataToLabel(label, device.deviceInfo.version);
		}

		if (data.additionalData) {
			label = this.addDataToLabel(label, data.additionalData);
		}

		const customDimensions: IStringDictionary = {};
		if (data.projectDir) {
			const projectData = this.$projectDataService.getProjectData(data.projectDir);
			customDimensions[GoogleAnalyticsCustomDimensions.projectType] = projectData.projectType;
		}

		const googleAnalyticsEventData: IGoogleAnalyticsEventData = {
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			action: data.action,
			label,
			customDimensions
		};

		this.$logger.trace("Will send the following information to Google Analytics:", googleAnalyticsEventData);

		await this.trackInGoogleAnalytics(googleAnalyticsEventData);
	}

	private addDataToLabel(label: string, newData: string): string {
		if (newData && label) {
			return `${label}_${newData}`;
		}

		return label || newData || "";
	}

	@cache()
	private getAnalyticsBroker(): Promise<ChildProcess> {
		return new Promise<ChildProcess>((resolve, reject) => {
			const broker = this.$childProcess.spawn("node",
				[
					path.join(__dirname, "analytics-broker-process.js"),
					this.$staticConfig.PATH_TO_BOOTSTRAP
				],
				{
					stdio: ["ignore", "ignore", "ignore", "ipc"],
					detached: true
				}
			);

			broker.unref();

			let isSettled = false;

			const timeoutId = setTimeout(() => {
				if (!isSettled) {
					reject(new Error("Unable to start Analytics Broker process."));
				}
			}, AnalyticsService.ANALYTICS_BROKER_START_TIMEOUT);

			broker.on("error", (err: Error) => {
				clearTimeout(timeoutId);

				if (!isSettled) {
					isSettled = true;
					reject(err);
				}
			});

			broker.on("message", (data: any) => {
				if (data === AnalyticsMessages.BrokerReadyToReceive) {
					clearTimeout(timeoutId);

					if (!isSettled) {
						isSettled = true;

						this.$processService.attachToProcessExitSignals(this, () => {
							broker.send({
								type: TrackingTypes.Finish
							});
						});

						resolve(broker);
					}
				}
			});
		});
	}

	private async sendInfoForTracking(trackingInfo: ITrackingInformation, settingName: string): Promise<void> {
		await this.initAnalyticsStatuses();

		if (!this.$staticConfig.disableAnalytics && this.analyticsStatuses[settingName] === AnalyticsStatus.enabled) {
			return this.sendMessageToBroker(trackingInfo);
		}
	}

	private async sendMessageToBroker(message: ITrackingInformation): Promise<void> {
		const broker = await this.getAnalyticsBroker();
		return new Promise<void>((resolve, reject) => broker.send(message, resolve));
	}
}

$injector.register("analyticsService", AnalyticsService);
