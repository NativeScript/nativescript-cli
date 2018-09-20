import * as helpers from "../helpers";
import { AnalyticsClients } from "../constants";
import { cache } from "../decorators";

const cliGlobal = <ICliGlobal>global;
// HACK
cliGlobal.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
cliGlobal.XMLHttpRequest.prototype.withCredentials = false;
// HACK -end

export abstract class AnalyticsServiceBase implements IAnalyticsService, IDisposable {
	private static MAX_WAIT_SENDING_INTERVAL = 30000; // in milliseconds
	protected eqatecMonitors: IDictionary<IEqatecMonitor> = {};
	protected featureTrackingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_API_KEY
	];

	protected acceptUsageReportingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_API_KEY
	];

	protected exceptionsTrackingAPIKeys: string[] = [
		this.$staticConfig.ANALYTICS_EXCEPTIONS_API_KEY
	];

	protected shouldDisposeInstance: boolean = true;

	protected analyticsStatuses: IDictionary<AnalyticsStatus> = {};

	constructor(protected $logger: ILogger,
		protected $options: ICommonOptions,
		protected $staticConfig: Config.IStaticConfig,
		protected $processService: IProcessService,
		private $prompter: IPrompter,
		private $userSettingsService: UserSettings.IUserSettingsService,
		private $analyticsSettingsService: IAnalyticsSettingsService,
		private $osInfo: IOsInfo) { }

	protected get acceptTrackFeatureSetting(): string {
		return `Accept${this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME}`;
	}

	public setShouldDispose(shouldDispose: boolean): void {
		this.shouldDisposeInstance = shouldDispose;
	}

	public abstract dispose(): void;

	public async checkConsent(): Promise<void> {
		if (await this.$analyticsSettingsService.canDoRequest()) {
			const initialTrackFeatureUsageStatus = await this.getStatus(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME);
			let trackFeatureUsage = initialTrackFeatureUsageStatus === AnalyticsStatus.enabled;

			if (await this.isNotConfirmed(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME) && helpers.isInteractive()) {
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

	public async trackAcceptFeatureUsage(settings: { acceptTrackFeatureUsage: boolean }): Promise<void> {
		try {
			await this.sendDataToEqatecMonitors(this.acceptUsageReportingAPIKeys,
				(eqatecMonitor: IEqatecMonitor) => eqatecMonitor.trackFeature(`${this.acceptTrackFeatureSetting}.${settings.acceptTrackFeatureUsage}`));
		} catch (e) {
			this.$logger.trace("Analytics exception: ", e);
		}
	}

	public trackFeature(featureName: string): Promise<void> {
		const category = this.$options.analyticsClient ||
			(helpers.isInteractive() ? AnalyticsClients.Cli : AnalyticsClients.NonInteractive);
		return this.track(category, featureName);
	}

	public async track(featureName: string, featureValue: string): Promise<void> {
		await this.initAnalyticsStatuses();
		this.$logger.trace(`Trying to track feature '${featureName}' with value '${featureValue}'.`);

		if (this.analyticsStatuses[this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME] === AnalyticsStatus.enabled) {
			await this.trackFeatureCore(`${featureName}.${featureValue}`);
		}
	}

	public async trackException(exception: any, message: string): Promise<void> {
		await this.initAnalyticsStatuses();

		if (this.analyticsStatuses[this.$staticConfig.ERROR_REPORT_SETTING_NAME] === AnalyticsStatus.enabled
			&& await this.$analyticsSettingsService.canDoRequest()) {
			try {
				this.$logger.trace(`Trying to track exception with message '${message}'.`);

				await this.sendDataToEqatecMonitors(this.exceptionsTrackingAPIKeys,
					(eqatecMonitor: IEqatecMonitor) => eqatecMonitor.trackException(exception, message));
			} catch (e) {
				this.$logger.trace("Analytics exception: ", e);
			}
		}
	}

	public async trackInGoogleAnalytics(gaSettings: IGoogleAnalyticsData): Promise<void> {
		// Intentionally left blank.
	}

	public async trackEventActionInGoogleAnalytics(data: IEventActionData): Promise<void> {
		// Intentionally left blank.
	}

	public async setStatus(settingName: string, enabled: boolean): Promise<void> {
		this.analyticsStatuses[settingName] = enabled ? AnalyticsStatus.enabled : AnalyticsStatus.disabled;
		await this.$userSettingsService.saveSetting(settingName, enabled.toString());

		if (this.analyticsStatuses[settingName] === AnalyticsStatus.disabled
			&& this.analyticsStatuses[settingName] === AnalyticsStatus.disabled) {
			this.tryStopEqatecMonitors();
		}
	}

	public async isEnabled(settingName: string): Promise<boolean> {
		const analyticsStatus = await this.getStatus(settingName);
		return analyticsStatus === AnalyticsStatus.enabled;
	}

	public tryStopEqatecMonitors(code?: string | number): void {
		for (const eqatecMonitorApiKey in this.eqatecMonitors) {
			const eqatecMonitor = this.eqatecMonitors[eqatecMonitorApiKey];
			eqatecMonitor.stop();
			delete this.eqatecMonitors[eqatecMonitorApiKey];
		}
	}

	public getStatusMessage(settingName: string, jsonFormat: boolean, readableSettingName: string): Promise<string> {
		if (jsonFormat) {
			return this.getJsonStatusMessage(settingName);
		}

		return this.getHumanReadableStatusMessage(settingName, readableSettingName);
	}

	protected async trackFeatureCore(featureTrackString: string, settings?: { userInteraction: boolean }): Promise<void> {
		try {
			if (await this.$analyticsSettingsService.canDoRequest()) {
				await this.sendDataToEqatecMonitors(this.featureTrackingAPIKeys, (eqatecMonitor: IEqatecMonitor) => eqatecMonitor.trackFeature(featureTrackString));
			}
		} catch (e) {
			this.$logger.trace("Analytics exception: ", e);
		}
	}

	@cache()
	protected async initAnalyticsStatuses(): Promise<void> {
		if (await this.$analyticsSettingsService.canDoRequest()) {
			this.$logger.trace("Initializing analytics statuses.");
			const settingsNames = [this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME, this.$staticConfig.ERROR_REPORT_SETTING_NAME];

			for (const settingName of settingsNames) {
				await this.getStatus(settingName);
			}

			this.$logger.trace("Analytics statuses: ", this.analyticsStatuses);
		}
	}

	private getIsSending(eqatecMonitor: IEqatecMonitor): boolean {
		return eqatecMonitor.status().isSending;
	}

	private waitForSending(eqatecMonitor: IEqatecMonitor): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const intervalTime = 100;
			let remainingTime = AnalyticsServiceBase.MAX_WAIT_SENDING_INTERVAL;

			if (this.getIsSending(eqatecMonitor)) {
				const message = `Waiting for analytics to send information. Will check in ${intervalTime}ms.`;
				this.$logger.trace(message);
				const interval = setInterval(() => {
					if (!this.getIsSending(eqatecMonitor) || remainingTime <= 0) {
						clearInterval(interval);
						resolve();
					}

					remainingTime -= intervalTime;
					this.$logger.trace(`${message} Remaining time is: ${remainingTime}`);
				}, intervalTime);
			} else {
				resolve();
			}
		});
	}

	private async sendDataToEqatecMonitors(analyticsAPIKeys: string[], eqatecMonitorAction: (eqatecMonitor: IEqatecMonitor) => void): Promise<void> {
		for (const eqatecAPIKey of analyticsAPIKeys) {
			const eqatecMonitor = await this.start(eqatecAPIKey);
			eqatecMonitorAction(eqatecMonitor);
			await this.waitForSending(eqatecMonitor);
		}
	}

	private async getCurrentSessionCount(analyticsProjectKey: string): Promise<number> {
		let currentCount = await this.$analyticsSettingsService.getUserSessionsCount(analyticsProjectKey);
		await this.$analyticsSettingsService.setUserSessionsCount(++currentCount, analyticsProjectKey);

		return currentCount;
	}

	private async getEqatecSettings(analyticsAPIKey: string): Promise<IEqatecInitializeData> {
		return {
			analyticsAPIKey,
			analyticsInstallationId: await this.$analyticsSettingsService.getClientId(),
			type: TrackingTypes.Initialization,
			userId: await this.$analyticsSettingsService.getUserId(),
			userSessionCount: await this.getCurrentSessionCount(analyticsAPIKey)
		};
	}

	private async getStatus(settingName: string): Promise<AnalyticsStatus> {
		if (!_.has(this.analyticsStatuses, settingName)) {
			const settingValue = await this.$userSettingsService.getSettingValue<string>(settingName);

			if (settingValue) {
				const isEnabled = helpers.toBoolean(settingValue);
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

	private async start(analyticsAPIKey: string): Promise<IEqatecMonitor> {
		const eqatecMonitorForSpecifiedAPIKey = this.eqatecMonitors[analyticsAPIKey];
		if (eqatecMonitorForSpecifiedAPIKey) {
			return eqatecMonitorForSpecifiedAPIKey;
		}

		const analyticsSettings = await this.getEqatecSettings(analyticsAPIKey);
		return this.startEqatecMonitor(analyticsSettings);
	}

	private async startEqatecMonitor(analyticsSettings: IEqatecInitializeData): Promise<IEqatecMonitor> {
		const eqatecMonitorForSpecifiedAPIKey = this.eqatecMonitors[analyticsSettings.analyticsAPIKey];
		if (eqatecMonitorForSpecifiedAPIKey) {
			return eqatecMonitorForSpecifiedAPIKey;
		}

		require("../vendor/EqatecMonitor.min");
		const analyticsProjectKey = analyticsSettings.analyticsAPIKey;
		const settings = cliGlobal._eqatec.createSettings(analyticsProjectKey);
		settings.useHttps = false;
		settings.userAgent = this.getUserAgentString();
		settings.version = this.$staticConfig.version;
		settings.useCookies = false;
		settings.loggingInterface = {
			logMessage: this.$logger.trace.bind(this.$logger),
			logError: this.$logger.debug.bind(this.$logger)
		};

		const eqatecMonitor = cliGlobal._eqatec.createMonitor(settings);
		this.eqatecMonitors[analyticsSettings.analyticsAPIKey] = eqatecMonitor;

		const analyticsInstallationId = analyticsSettings.analyticsInstallationId;

		this.$logger.trace(`${this.$staticConfig.ANALYTICS_INSTALLATION_ID_SETTING_NAME}: ${analyticsInstallationId}`);
		eqatecMonitor.setInstallationID(analyticsInstallationId);

		try {
			await eqatecMonitor.setUserID(analyticsSettings.userId);

			const currentCount = analyticsSettings.userSessionCount;
			eqatecMonitor.setStartCount(currentCount);
		} catch (e) {
			// user not logged in. don't care.
			this.$logger.trace("Error while initializing eqatecMonitor", e);
		}

		eqatecMonitor.start();

		// End the session on process.exit only or in case user disables both usage tracking and exceptions tracking.
		this.$processService.attachToProcessExitSignals(this, this.tryStopEqatecMonitors);

		await this.reportNodeVersion(analyticsSettings.analyticsAPIKey);

		return eqatecMonitor;
	}

	private async reportNodeVersion(apiKey: string): Promise<void> {
		const reportedVersion: string = process.version.slice(1).replace(/[.]/g, "_");
		await this.sendDataToEqatecMonitors([apiKey], (eqatecMonitor: IEqatecMonitor) => eqatecMonitor.trackFeature(`NodeJSVersion.${reportedVersion}`));
	}

	private getUserAgentString(): string {
		let userAgentString: string;
		const osType = this.$osInfo.type();
		if (osType === "Windows_NT") {
			userAgentString = "(Windows NT " + this.$osInfo.release() + ")";
		} else if (osType === "Darwin") {
			userAgentString = "(Mac OS X " + this.$osInfo.release() + ")";
		} else {
			userAgentString = "(" + osType + ")";
		}

		return userAgentString;
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

}
