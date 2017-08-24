import { ChildProcess } from "child_process";
import * as path from "path";

import { createGUID } from "../../common/helpers";
import { cache } from "../../common/decorators";

export class EqatecAnalyticsProvider implements IAnalyticsProvider {
	private static NEW_PROJECT_ANALYTICS_API_KEY = "b40f24fcb4f94bccaf64e4dc6337422e";
	private _eqatecExceptionChildProcess: ChildProcess = null;
	private _eqatecFeatureChildProcesses: ChildProcess[] = [];

	@cache()
	private get pathToEqatecEntryPoint(): string {
		return path.join(__dirname, "eqatec-analytics-process.js");
	}

	private get eqatecFeatureChildProcesses(): ChildProcess[] {
		return this._eqatecFeatureChildProcesses;
	}

	private get _eqatecFeatureProjectAPIKeys(): string[] {
		return [
			this.$staticConfig.ANALYTICS_API_KEY,
			EqatecAnalyticsProvider.NEW_PROJECT_ANALYTICS_API_KEY
		];
	}

	private get _eqatecExceptionProjectAPIKey(): string {
		return this.$staticConfig.ANALYTICS_EXCEPTIONS_API_KEY;
	}

	constructor(private pathToBootstrap: string,
		private $staticConfig: Config.IStaticConfig,
		private $userSettingsService: UserSettings.IUserSettingsService,
		private $analyticsSettingsService: IAnalyticsSettingsService,
		private $childProcess: IChildProcess) {
	}

	public async trackException(trackInfo: IExceptionsTrackingInformation): Promise<void> {
		const eqatecExceptionChildProcess = await this.getEqatecProcessForExceptions();
		eqatecExceptionChildProcess.send(trackInfo);
	}

	public async trackFeature(trackInfo: IFeatureTrackingInformation): Promise<void> {
		await this.initializeEqatecProcessesForFeatureTracking();

		for (const eqatecChildProcess of this.eqatecFeatureChildProcesses) {
			eqatecChildProcess.send(trackInfo);
		}
	}

	public async finishTracking(): Promise<void> {
		const trackInfo: ITrackingInformation = {
			type: TrackingTypes.Finish
		};

		for (const eqatecChildProcess of this.eqatecFeatureChildProcesses) {
			eqatecChildProcess.send(trackInfo);
		}

		const eqatecExceptionChildProcess = await this.getEqatecProcessForExceptions({ skipInitialization: true });
		if (eqatecExceptionChildProcess) {
			eqatecExceptionChildProcess.send(trackInfo);
		}
	}

	@cache()
	private async initializeEqatecProcessesForFeatureTracking(): Promise<void> {
		const analyticsInstallationId = await this.getEqatecInstallationId();
		const userId = await this.$analyticsSettingsService.getUserId();

		for (const analyticsAPIKey of this._eqatecFeatureProjectAPIKeys) {
			let userSessionCount = await this.$analyticsSettingsService.getUserSessionsCount(analyticsAPIKey);
			await this.$analyticsSettingsService.setUserSessionsCount(++userSessionCount, analyticsAPIKey);
			const trackingInformation = {
				analyticsInstallationId,
				analyticsAPIKey,
				type: TrackingTypes.Initialization,
				userId,
				userSessionCount
			};

			await this.initializeEqatecFeatureChildProcess(trackingInformation);
		}
	}

	@cache()
	private async getEqatecInstallationId(): Promise<string> {
		let analyticsInstallationId = await this.$userSettingsService.getSettingValue<string>(this.$staticConfig.ANALYTICS_INSTALLATION_ID_SETTING_NAME);
		if (!analyticsInstallationId) {
			analyticsInstallationId = createGUID(false);
			await this.$userSettingsService.saveSetting(this.$staticConfig.ANALYTICS_INSTALLATION_ID_SETTING_NAME, analyticsInstallationId);
		}

		return analyticsInstallationId;
	}

	private initializeEqatecChildProcess(eqatecInitData: IEqatecInitializeData): Promise<ChildProcess> {
		return new Promise<ChildProcess>((resolve, reject) => {
			const eqatecChildProcess: ChildProcess = this.$childProcess.spawn("node", [
				this.pathToEqatecEntryPoint,
				this.pathToBootstrap
			],
				{
					stdio: ["ignore", "ignore", "ignore", "ipc"],
					detached: true
				}
			);

			eqatecChildProcess.unref();

			eqatecChildProcess.on("message", (data) => {
				if (data === AnalyticsMessages.EqatecAnalyticsReadyToReceive) {
					eqatecChildProcess.send(eqatecInitData, () => {
						resolve(eqatecChildProcess);
					});
				}
			});

			eqatecChildProcess.on("error", (err: Error) => {
				reject(err);
			});

			return eqatecChildProcess;
		});
	}

	private async initializeEqatecFeatureChildProcess(eqatecInitData: IEqatecInitializeData): Promise<void> {
		const eqatecFeatureChildProcesses = await this.initializeEqatecChildProcess(eqatecInitData);
		this.eqatecFeatureChildProcesses.push(eqatecFeatureChildProcesses);
	}

	@cache()
	private async initializeEqatecChildProcessForExceptions(): Promise<ChildProcess> {
		const analyticsInstallationId = await this.getEqatecInstallationId();
		const userId = await this.$analyticsSettingsService.getUserId();
		let userSessionCount = await this.$analyticsSettingsService.getUserSessionsCount(this._eqatecExceptionProjectAPIKey);

		await this.$analyticsSettingsService.setUserSessionsCount(++userSessionCount, this._eqatecExceptionProjectAPIKey);

		const trackingInformation = {
			analyticsInstallationId,
			analyticsAPIKey: this._eqatecExceptionProjectAPIKey,
			type: TrackingTypes.Initialization,
			userId,
			userSessionCount
		};

		const eqatecExceptionChildProcess = await this.initializeEqatecChildProcess(trackingInformation);

		return eqatecExceptionChildProcess;
	}

	private async getEqatecProcessForExceptions(processSettings?: { skipInitialization: boolean }): Promise<ChildProcess> {
		const callerRequiresChildProcess = !processSettings || !processSettings.skipInitialization;

		if (!this._eqatecExceptionChildProcess && callerRequiresChildProcess) {
			this._eqatecExceptionChildProcess = await this.initializeEqatecChildProcessForExceptions();
		}

		return this._eqatecExceptionChildProcess;
	}
}

$injector.register("eqatecAnalyticsProvider", EqatecAnalyticsProvider);
