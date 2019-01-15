import { ChildProcess } from "child_process";
import * as path from "path";
import { cache } from "../../common/decorators";
import { isInteractive, toBoolean } from '../../common/helpers';
import { DeviceTypes, AnalyticsClients } from "../../common/constants";
import { TrackActionNames } from "../../constants";

export class AnalyticsService implements IAnalyticsService, IDisposable {
	private static ANALYTICS_BROKER_START_TIMEOUT = 10 * 1000;
	private brokerProcess: ChildProcess;
	private shouldDisposeInstance: boolean = true;
	private analyticsStatuses: IDictionary<AnalyticsStatus> = {};

	constructor(private $logger: ILogger,
		private $options: IOptions,
		private $processService: IProcessService,
		private $staticConfig: Config.IStaticConfig,
		private $prompter: IPrompter,
		private $userSettingsService: UserSettings.IUserSettingsService,
		private $analyticsSettingsService: IAnalyticsSettingsService,
		private $childProcess: IChildProcess,
		private $projectDataService: IProjectDataService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectHelper: IProjectHelper) {
	}

	public setShouldDispose(shouldDispose: boolean): void {
		this.shouldDisposeInstance = shouldDispose;
	}

	public async checkConsent(): Promise<void> {
		if (await this.$analyticsSettingsService.canDoRequest()) {
			const initialTrackFeatureUsageStatus = await this.getStatus(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
			let trackFeatureUsage = initialTrackFeatureUsageStatus === AnalyticsStatus.enabled;

			if (await this.isNotConfirmed(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) && isInteractive()) {
				this.$logger.out("Do you want to help us improve "
					+ this.$analyticsSettingsService.getClientName()
					+ " by automatically sending anonymous usage statistics? We will not use this information to identify or contact you."
					+ " You can read our official Privacy Policy at");

				const message = this.$analyticsSettingsService.getPrivacyPolicyLink();
				trackFeatureUsage = await this.$prompter.confirm(message, () => true);
				await this.setStatus(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, trackFeatureUsage);

				await this.trackAcceptFeatureUsage({ acceptTrackFeatureUsage: trackFeatureUsage });
			}

			const isErrorReportingUnset = await this.isNotConfirmed(this.$staticConfig.ERROR_REPORT_SETTING_NAME);
			const isUsageReportingConfirmed = !await this.isNotConfirmed(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
			if (isErrorReportingUnset && isUsageReportingConfirmed) {
				await this.setStatus(this.$staticConfig.ERROR_REPORT_SETTING_NAME, trackFeatureUsage);
			}
		}
	}

	public async setStatus(settingName: string, enabled: boolean): Promise<void> {
		this.analyticsStatuses[settingName] = enabled ? AnalyticsStatus.enabled : AnalyticsStatus.disabled;
		await this.$userSettingsService.saveSetting(settingName, enabled.toString());
	}

	public async isEnabled(settingName: string): Promise<boolean> {
		const analyticsStatus = await this.getStatus(settingName);
		return analyticsStatus === AnalyticsStatus.enabled;
	}

	public getStatusMessage(settingName: string, jsonFormat: boolean, readableSettingName: string): Promise<string> {
		if (jsonFormat) {
			return this.getJsonStatusMessage(settingName);
		}

		return this.getHumanReadableStatusMessage(settingName, readableSettingName);
	}

	public async trackAcceptFeatureUsage(settings: { acceptTrackFeatureUsage: boolean }): Promise<void> {
		const acceptTracking = !!(settings && settings.acceptTrackFeatureUsage);
		const googleAnalyticsEventData: IGoogleAnalyticsEventData = {
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			action: TrackActionNames.AcceptTracking,
			label: acceptTracking.toString()
		};

		await this.forcefullyTrackInGoogleAnalytics(googleAnalyticsEventData);
	}

	public async trackInGoogleAnalytics(gaSettings: IGoogleAnalyticsData): Promise<void> {
		await this.initAnalyticsStatuses();

		if (!this.$staticConfig.disableAnalytics && this.analyticsStatuses[this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME] === AnalyticsStatus.enabled) {
			return this.forcefullyTrackInGoogleAnalytics(gaSettings);
		}
	}

	public async trackEventActionInGoogleAnalytics(data: IEventActionData): Promise<void> {
		const device = data.device;
		const platform = device ? device.deviceInfo.platform : data.platform;
		const normalizedPlatform = platform ? this.$mobileHelper.normalizePlatformName(platform) : platform;
		const isForDevice = device ? !device.isEmulator : data.isForDevice;

		let label: string = "";
		label = this.addDataToLabel(label, normalizedPlatform);

		// In some cases (like in case action is Build and platform is Android), we do not know if the deviceType is emulator or device.
		// Just exclude the device_type in this case.
		if (isForDevice !== null && isForDevice !== undefined) {
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
		this.setProjectRelatedCustomDimensions(customDimensions, data.projectDir);

		const googleAnalyticsEventData: IGoogleAnalyticsEventData = {
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			action: data.action,
			label,
			customDimensions,
			value: data.value
		};

		await this.trackInGoogleAnalytics(googleAnalyticsEventData);
	}

	private forcefullyTrackInGoogleAnalytics(gaSettings: IGoogleAnalyticsData): Promise<void> {
		gaSettings.customDimensions = gaSettings.customDimensions || {};
		gaSettings.customDimensions[GoogleAnalyticsCustomDimensions.client] = this.$options.analyticsClient || (isInteractive() ? AnalyticsClients.Cli : AnalyticsClients.Unknown);
		this.setProjectRelatedCustomDimensions(gaSettings.customDimensions);

		const googleAnalyticsData: IGoogleAnalyticsTrackingInformation = _.merge({ type: TrackingTypes.GoogleAnalyticsData, category: AnalyticsClients.Cli }, gaSettings);
		this.$logger.trace("Will send the following information to Google Analytics:", googleAnalyticsData);
		return this.sendMessageToBroker(googleAnalyticsData);
	}

	private setProjectRelatedCustomDimensions(customDimensions: IStringDictionary, projectDir?: string): IStringDictionary {
		if (!projectDir) {
			try {
				projectDir = this.$projectHelper.projectDir;
			} catch (err) {
				// In case there's no project dir here, the above getter will fail.
				this.$logger.trace("Unable to get the projectDir from projectHelper", err);
			}
		}

		if (projectDir) {
			const projectData = this.$projectDataService.getProjectData(projectDir);
			customDimensions[GoogleAnalyticsCustomDimensions.projectType] = projectData.projectType;
			customDimensions[GoogleAnalyticsCustomDimensions.isShared] = projectData.isShared.toString();
		}

		return customDimensions;
	}

	public dispose(): void {
		if (this.brokerProcess && this.shouldDisposeInstance) {
			this.brokerProcess.disconnect();
		}
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
			const brokerProcessArgs = this.getBrokerProcessArgs();

			const broker = this.$childProcess.spawn(process.execPath,
				brokerProcessArgs,
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

						this.brokerProcess = broker;

						resolve(broker);
					}
				}
			});
		});
	}

	private getBrokerProcessArgs(): string[] {
		const brokerProcessArgs = [
			path.join(__dirname, "analytics-broker-process.js"),
			this.$staticConfig.PATH_TO_BOOTSTRAP,
		];

		if (this.$options.analyticsLogFile) {
			brokerProcessArgs.push(this.$options.analyticsLogFile);
		}

		return brokerProcessArgs;
	}

	private async sendInfoForTracking(trackingInfo: ITrackingInformation, settingName: string): Promise<void> {
		await this.initAnalyticsStatuses();

		if (!this.$staticConfig.disableAnalytics && this.analyticsStatuses[settingName] === AnalyticsStatus.enabled) {
			return this.sendMessageToBroker(trackingInfo);
		}
	}

	private async sendMessageToBroker(message: ITrackingInformation): Promise<void> {
		let broker: ChildProcess;
		try {
			broker = await this.getAnalyticsBroker();
		} catch (err) {
			this.$logger.trace("Unable to get broker instance due to error: ", err);
			return;
		}

		return new Promise<void>((resolve, reject) => {
			if (broker && broker.connected) {
				try {
					broker.send(message, (error: Error) => resolve());
				} catch (err) {
					this.$logger.trace("Error while trying to send message to broker:", err);
					resolve();
				}
			} else {
				this.$logger.trace("Broker not found or not connected.");
				resolve();
			}
		});
	}

	@cache()
	private async initAnalyticsStatuses(): Promise<void> {
		if (await this.$analyticsSettingsService.canDoRequest()) {
			this.$logger.trace("Initializing analytics statuses.");
			const settingsNames = [this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, this.$staticConfig.ERROR_REPORT_SETTING_NAME];

			for (const settingName of settingsNames) {
				await this.getStatus(settingName);
			}

			this.$logger.trace("Analytics statuses: ", this.analyticsStatuses);
		}
	}

	private async getStatus(settingName: string): Promise<AnalyticsStatus> {
		if (!_.has(this.analyticsStatuses, settingName)) {
			const settingValue = await this.$userSettingsService.getSettingValue<string>(settingName);

			if (settingValue) {
				const isEnabled = toBoolean(settingValue);
				if (isEnabled) {
					this.analyticsStatuses[settingName] = AnalyticsStatus.enabled;
				} else {
					this.analyticsStatuses[settingName] = AnalyticsStatus.disabled;
				}
			} else {
				this.analyticsStatuses[settingName] = AnalyticsStatus.notConfirmed;
			}
		}

		return this.analyticsStatuses[settingName];
	}

	private async isNotConfirmed(settingName: string): Promise<boolean> {
		const analyticsStatus = await this.getStatus(settingName);
		return analyticsStatus === AnalyticsStatus.notConfirmed;
	}

	private async getHumanReadableStatusMessage(settingName: string, readableSettingName: string): Promise<string> {
		let status: string = null;

		if (await this.isNotConfirmed(settingName)) {
			status = "disabled until confirmed";
		} else {
			status = await this.getStatus(settingName);
		}

		return `${readableSettingName} is ${status}.`;
	}

	private async getJsonStatusMessage(settingName: string): Promise<string> {
		const status = await this.getStatus(settingName);
		const enabled = status === AnalyticsStatus.notConfirmed ? null : status === AnalyticsStatus.enabled;
		return JSON.stringify({ enabled });
	}

	public trackException(exception: any, message: string): Promise<void> {
		const data: IExceptionsTrackingInformation = {
			type: TrackingTypes.Exception,
			exception,
			message
		};

		return this.sendInfoForTracking(data, this.$staticConfig.ERROR_REPORT_SETTING_NAME);
	}
}

$injector.register("analyticsService", AnalyticsService);
