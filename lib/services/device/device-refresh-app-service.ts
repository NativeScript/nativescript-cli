import { performanceLog } from "../../common/decorators";
import { RunOnDevicesEmitter } from "../../run-on-devices-emitter";
import { LiveSyncServiceResolver } from "../../resolvers/livesync-service-resolver";

export class DeviceRefreshAppService {

	constructor(
		private $liveSyncServiceResolver: LiveSyncServiceResolver,
		private $logger: ILogger,
		private $runOnDevicesEmitter: RunOnDevicesEmitter
	) { }

	@performanceLog()
	public async refreshApplicationWithoutDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, deviceDescriptor: ILiveSyncDeviceInfo, settings?: IRefreshApplicationSettings): Promise<IRestartApplicationInfo> {
		if (deviceDescriptor && deviceDescriptor.debugggingEnabled) {
			liveSyncResultInfo.waitForDebugger = deviceDescriptor.debugOptions && deviceDescriptor.debugOptions.debugBrk;
		}

		const result = { didRestart: false };
		const platform = liveSyncResultInfo.deviceAppData.platform;
		const applicationIdentifier = projectData.projectIdentifiers[platform.toLowerCase()];
		const platformLiveSyncService = this.$liveSyncServiceResolver.resolveLiveSyncService(platform);

		try {
			let shouldRestart = await platformLiveSyncService.shouldRestart(projectData, liveSyncResultInfo);
			if (!shouldRestart) {
				shouldRestart = !await platformLiveSyncService.tryRefreshApplication(projectData, liveSyncResultInfo);
			}

			if (shouldRestart) {
				this.$runOnDevicesEmitter.emitDebuggerDetachedEvent(liveSyncResultInfo.deviceAppData.device);
				await platformLiveSyncService.restartApplication(projectData, liveSyncResultInfo);
				result.didRestart = true;
			}
		} catch (err) {
			this.$logger.info(`Error while trying to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Error is: ${err.message || err}`);
			const msg = `Unable to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
			this.$logger.warn(msg);
			if (!settings || !settings.shouldSkipEmitLiveSyncNotification) {
				this.$runOnDevicesEmitter.emitRunOnDeviceNotificationEvent(projectData, liveSyncResultInfo.deviceAppData.device, msg);
			}

			if (settings && settings.shouldCheckDeveloperDiscImage && (err.message || err) === "Could not find developer disk image") {
				this.$runOnDevicesEmitter.emitUserInteractionNeededEvent(projectData, liveSyncResultInfo.deviceAppData.device, deviceDescriptor);
			}
		}

		return result;
	}
}
$injector.register("deviceRefreshAppService", DeviceRefreshAppService);
