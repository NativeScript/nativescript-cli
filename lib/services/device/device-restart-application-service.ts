import { performanceLog } from "../../common/decorators";

export class DeviceRestartApplicationService implements IDeviceRestartApplicationService {

	constructor(private $logger: ILogger) { }

	@performanceLog()
	public async restartOnDevice(deviceDescriptor: ILiveSyncDeviceInfo, projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, platformLiveSyncService: IPlatformLiveSyncService): Promise<IRestartApplicationInfo | IDebugInformation> {
		return liveSyncResultInfo && deviceDescriptor.debugggingEnabled ?
			this.refreshApplicationWithDebug(projectData, liveSyncResultInfo, deviceDescriptor.debugOptions, platformLiveSyncService) :
			this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, deviceDescriptor.debugOptions, platformLiveSyncService);
	}

	@performanceLog()
	private async refreshApplicationWithDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOptions: IDebugOptions, platformLiveSyncService: IPlatformLiveSyncService): Promise<IDebugInformation> {
		debugOptions = debugOptions || {};
		if (debugOptions.debugBrk) {
			liveSyncResultInfo.waitForDebugger = true;
		}

		const refreshInfo = await this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOptions, platformLiveSyncService, { shouldSkipEmitLiveSyncNotification: true, shouldCheckDeveloperDiscImage: true });

		// we do not stop the application when debugBrk is false, so we need to attach, instead of launch
		// if we try to send the launch request, the debugger port will not be printed and the command will timeout
		debugOptions.start = !debugOptions.debugBrk;

		debugOptions.forceDebuggerAttachedEvent = refreshInfo.didRestart;
		// const deviceOption = {
		// 	deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
		// 	debugOptions: debugOptions,
		// };

		// return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, { projectDir: projectData.projectDir });
		return null;
	}

	private async refreshApplicationWithoutDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOpts: IDebugOptions, platformLiveSyncService: IPlatformLiveSyncService, settings?: IRefreshApplicationSettings): Promise<IRestartApplicationInfo> {
		const result = { didRestart: false };
		const platform = liveSyncResultInfo.deviceAppData.platform;
		const applicationIdentifier = projectData.projectIdentifiers[platform.toLowerCase()];
		try {
			let shouldRestart = await platformLiveSyncService.shouldRestart(projectData, liveSyncResultInfo);
			if (!shouldRestart) {
				shouldRestart = !await platformLiveSyncService.tryRefreshApplication(projectData, liveSyncResultInfo);
			}

			if (shouldRestart) {
				// const deviceIdentifier = liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier;
				// this.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });
				await platformLiveSyncService.restartApplication(projectData, liveSyncResultInfo);
				result.didRestart = true;
			}
		} catch (err) {
			this.$logger.info(`Error while trying to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Error is: ${err.message || err}`);
			const msg = `Unable to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
			this.$logger.warn(msg);
			if (!settings || !settings.shouldSkipEmitLiveSyncNotification) {
				// this.emitLivesyncEvent(LiveSyncEvents.liveSyncNotification, {
				// 	projectDir: projectData.projectDir,
				// 	applicationIdentifier,
				// 	deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
				// 	notification: msg
				// });
			}

			if (settings && settings.shouldCheckDeveloperDiscImage) {
				// this.handleDeveloperDiskImageError(err, liveSyncResultInfo, projectData, debugOpts, outputPath);
			}
		}

		// this.emitLivesyncEvent(LiveSyncEvents.liveSyncExecuted, {
		// 	projectDir: projectData.projectDir,
		// 	applicationIdentifier,
		// 	syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
		// 	deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
		// 	isFullSync: liveSyncResultInfo.isFullSync
		// });

		return result;
	}
}
$injector.register("deviceRestartApplicationService", DeviceRestartApplicationService);
