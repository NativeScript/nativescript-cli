import { BuildPlatformService } from "../services/platform/build-platform-service";
import { DeviceDebugAppService } from "../services/device/device-debug-app-service";
import { DeviceInstallAppService } from "../services/device/device-install-app-service";
import { DeviceRefreshAppService } from "../services/device/device-refresh-app-service";
import { EventEmitter } from "events";
import { LiveSyncServiceResolver } from "../resolvers/livesync-service-resolver";
import { RunOnDevicesDataService } from "../services/run-on-devices-data-service";
import { RunOnDevicesEmitter } from "../run-on-devices-emitter";
import { WorkflowDataService } from "../services/workflow/workflow-data-service";
import { HmrConstants } from "../common/constants";

export class RunOnDevicesController extends EventEmitter {
	constructor(
		private $buildPlatformService: BuildPlatformService,
		private $deviceDebugAppService: DeviceDebugAppService,
		private $deviceInstallAppService: DeviceInstallAppService,
		private $deviceRefreshAppService: DeviceRefreshAppService,
		private $devicesService: Mobile.IDevicesService,
		private $hmrStatusService: IHmrStatusService,
		public $hooksService: IHooksService,
		private $liveSyncServiceResolver: LiveSyncServiceResolver,
		private $logger: ILogger,
		private $runOnDevicesDataService: RunOnDevicesDataService,
		private $runOnDevicesEmitter: RunOnDevicesEmitter,
		private $workflowDataService: WorkflowDataService
	) { super(); }

	public async syncInitialDataOnDevice(data: IInitialSyncEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const deviceAction = async (device: Mobile.IDevice) => {
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			const { nativePlatformData: platformData, buildPlatformData } = this.$workflowDataService.createWorkflowData(device.deviceInfo.platform, projectData.projectDir, liveSyncInfo);

			try {
				const outputPath = deviceDescriptor.outputPath || platformData.getBuildOutputPath(buildPlatformData);
				const packageFilePath = await this.$buildPlatformService.buildPlatformIfNeeded(platformData, projectData, buildPlatformData, outputPath);

				await this.$deviceInstallAppService.installOnDeviceIfNeeded(device, platformData, projectData, buildPlatformData, packageFilePath, outputPath);

				const platformLiveSyncService = this.$liveSyncServiceResolver.resolveLiveSyncService(platformData.platformNameLowerCase);
				const { force, useHotModuleReload, skipWatcher } = liveSyncInfo;
				const liveSyncResultInfo = await platformLiveSyncService.fullSync({ force, useHotModuleReload, projectData, device, watch: !skipWatcher, liveSyncDeviceInfo: deviceDescriptor });

				const refreshInfo = await this.$deviceRefreshAppService.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, deviceDescriptor);

				this.$runOnDevicesEmitter.emitRunOnDeviceExecutedEvent(projectData, liveSyncResultInfo.deviceAppData.device, {
					syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
					isFullSync: liveSyncResultInfo.isFullSync
				});

				if (liveSyncResultInfo && deviceDescriptor.debuggingEnabled) {
					await this.$deviceDebugAppService.enableDebugging(projectData, deviceDescriptor, refreshInfo);
				}

				this.$logger.info(`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`);

				this.$runOnDevicesEmitter.emitRunOnDeviceStartedEvent(projectData, device);
			} catch (err) {
				this.$logger.warn(`Unable to apply changes on device: ${device.deviceInfo.identifier}. Error is: ${err.message}.`);

				this.$runOnDevicesEmitter.emitRunOnDeviceErrorEvent(projectData, device, err);

				// TODO: Consider to call here directly stopRunOnDevices
			}
		};

		await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === data.platform.toLowerCase() && _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier)));
	}

	public async syncChangedDataOnDevice(data: IFilesChangeEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const deviceAction = async (device: Mobile.IDevice) => {
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			const { nativePlatformData, buildPlatformData } = this.$workflowDataService.createWorkflowData(device.deviceInfo.platform, projectData.projectDir, liveSyncInfo);

			try {
				if (data.hasNativeChanges) {
					// TODO: Consider to handle nativePluginsChange here (aar rebuilt)
					await this.$buildPlatformService.buildPlatform(nativePlatformData, projectData, buildPlatformData);
				}

				const isInHMRMode = liveSyncInfo.useHotModuleReload && data.hmrData && data.hmrData.hash;
				if (isInHMRMode) {
					this.$hmrStatusService.watchHmrStatus(device.deviceInfo.identifier, data.hmrData.hash);
				}

				const platformLiveSyncService = this.$liveSyncServiceResolver.resolveLiveSyncService(device.deviceInfo.platform);
				const watchInfo = {
					liveSyncDeviceInfo: deviceDescriptor,
					projectData,
					filesToRemove: <any>[],
					filesToSync: data.files,
					isReinstalled: false,
					hmrData: data.hmrData,
					useHotModuleReload: liveSyncInfo.useHotModuleReload,
					force: liveSyncInfo.force,
					connectTimeout: 1000
				};
				let liveSyncResultInfo = await platformLiveSyncService.liveSyncWatchAction(device, watchInfo);

				await this.refreshApplication(projectData, liveSyncResultInfo, deviceDescriptor);

				if (!liveSyncResultInfo.didRecover && isInHMRMode) {
					const status = await this.$hmrStatusService.getHmrStatus(device.deviceInfo.identifier, data.hmrData.hash);
					if (status === HmrConstants.HMR_ERROR_STATUS) {
						watchInfo.filesToSync = data.hmrData.fallbackFiles;
						liveSyncResultInfo = await platformLiveSyncService.liveSyncWatchAction(device, watchInfo);
						// We want to force a restart of the application.
						liveSyncResultInfo.isFullSync = true;
						await this.refreshApplication(projectData, liveSyncResultInfo, deviceDescriptor);
					}
				}

				this.$logger.info(`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`);
			} catch (err) {
				const allErrors = (<Mobile.IDevicesOperationError>err).allErrors;

				if (allErrors && _.isArray(allErrors)) {
					for (const deviceError of allErrors) {
						this.$logger.warn(`Unable to apply changes for device: ${deviceError.deviceIdentifier}. Error is: ${deviceError.message}.`);
						this.$runOnDevicesEmitter.emitRunOnDeviceErrorEvent(projectData, device, deviceError);
					}
				}
			}
		};

		await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) => {
			const liveSyncProcessInfo = this.$runOnDevicesDataService.getData(projectData.projectDir);
			return (data.platform.toLowerCase() === device.deviceInfo.platform.toLowerCase()) && liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
		}));
	}

	private async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, deviceDescriptor: ILiveSyncDeviceInfo) {
		const refreshInfo = await this.$deviceRefreshAppService.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, deviceDescriptor);

		this.$runOnDevicesEmitter.emitRunOnDeviceExecutedEvent(projectData, liveSyncResultInfo.deviceAppData.device, {
			syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
			isFullSync: liveSyncResultInfo.isFullSync
		});

		if (liveSyncResultInfo && deviceDescriptor.debuggingEnabled) {
			await this.$deviceDebugAppService.enableDebugging(projectData, deviceDescriptor, refreshInfo);
		}
	}

	private async addActionToChain<T>(projectDir: string, action: () => Promise<T>): Promise<T> {
		const liveSyncInfo = this.$runOnDevicesDataService.getData(projectDir);
		if (liveSyncInfo) {
			liveSyncInfo.actionsChain = liveSyncInfo.actionsChain.then(async () => {
				if (!liveSyncInfo.isStopped) {
					liveSyncInfo.currentSyncAction = action();
					const res = await liveSyncInfo.currentSyncAction;
					return res;
				}
			});

			const result = await liveSyncInfo.actionsChain;
			return result;
		}
	}
}
$injector.register("runOnDevicesController", RunOnDevicesController);
