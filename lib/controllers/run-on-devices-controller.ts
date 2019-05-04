import { BuildPlatformService } from "../services/platform/build-platform-service";
import { DeviceDebugAppService } from "../services/device/device-debug-app-service";
import { DeviceInstallAppService } from "../services/device/device-install-app-service";
import { DeviceRefreshAppService } from "../services/device/device-refresh-app-service";
import { EventEmitter } from "events";
import { LiveSyncServiceResolver } from "../resolvers/livesync-service-resolver";
import { RunOnDevicesDataService } from "../services/run-on-devices-data-service";
import { RunOnDevicesEmitter } from "../run-on-devices-emitter";
import { WorkflowDataService } from "../services/workflow/workflow-data-service";

export class RunOnDevicesController extends EventEmitter {
	constructor(
		private $buildPlatformService: BuildPlatformService,
		private $deviceDebugAppService: DeviceDebugAppService,
		private $deviceInstallAppService: DeviceInstallAppService,
		private $deviceRefreshAppService: DeviceRefreshAppService,
		private $devicesService: Mobile.IDevicesService,
		public $hooksService: IHooksService,
		private $liveSyncServiceResolver: LiveSyncServiceResolver,
		private $logger: ILogger,
		private $runOnDevicesDataService: RunOnDevicesDataService,
		private $runOnDevicesEmitter: RunOnDevicesEmitter,
		private $workflowDataService: WorkflowDataService
	) { super(); }

	public async syncInitialDataOnDevice(data: IInitialSyncEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const executeAction = async (device: Mobile.IDevice) => {
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			await this.syncInitialDataOnDeviceSafe(device, deviceDescriptor, projectData, liveSyncInfo);
		};
		const canExecuteAction = (device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === data.platform.toLowerCase() && _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
		await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(executeAction, canExecuteAction));
	}

	public async syncChangedDataOnDevice(data: IFilesChangeEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const executeAction = async (device: Mobile.IDevice) => {
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			await this.syncChangedDataOnDeviceSafe(device, deviceDescriptor, data, projectData, liveSyncInfo);
		};
		const canExecuteAction = (device: Mobile.IDevice) => {
			const liveSyncProcessInfo = this.$runOnDevicesDataService.getData(projectData.projectDir);
			return (data.platform.toLowerCase() === device.deviceInfo.platform.toLowerCase()) && liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
		};
		await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(executeAction, canExecuteAction));
	}

	private async syncInitialDataOnDeviceSafe(device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo): Promise<void> {
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

			if (liveSyncResultInfo && deviceDescriptor.debugggingEnabled) {
				await this.$deviceDebugAppService.refreshApplicationWithDebug(projectData, deviceDescriptor, refreshInfo);
			}

			this.$logger.info(`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`);

			this.$runOnDevicesEmitter.emitRunOnDeviceStartedEvent(projectData, device);
		} catch (err) {
			this.$logger.warn(`Unable to apply changes on device: ${device.deviceInfo.identifier}. Error is: ${err.message}.`);

			this.$runOnDevicesEmitter.emitRunOnDeviceErrorEvent(projectData, device, err);

			// TODO: Consider to call here directly stopRunOnDevices
		}
	}

	private async syncChangedDataOnDeviceSafe(device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo, data: IFilesChangeEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo): Promise<void> {
		const { nativePlatformData, buildPlatformData } = this.$workflowDataService.createWorkflowData(device.deviceInfo.platform, projectData.projectDir, liveSyncInfo);

		try {
			if (data.hasNativeChanges) {
				// TODO: Consider to handle nativePluginsChange here (aar rebuilt)
				await this.$buildPlatformService.buildPlatform(nativePlatformData, projectData, buildPlatformData);
			}

			const platformLiveSyncService = this.$liveSyncServiceResolver.resolveLiveSyncService(device.deviceInfo.platform);
			const liveSyncResultInfo = await platformLiveSyncService.liveSyncWatchAction(device, {
				liveSyncDeviceInfo: deviceDescriptor,
				projectData,
				filesToRemove: [],
				filesToSync: data.files,
				isReinstalled: false,
				hmrData: null, // platformHmrData,
				useHotModuleReload: liveSyncInfo.useHotModuleReload,
				force: liveSyncInfo.force,
				connectTimeout: 1000
			});

			const refreshInfo = await this.$deviceRefreshAppService.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, deviceDescriptor);

			this.$runOnDevicesEmitter.emitRunOnDeviceExecutedEvent(projectData, liveSyncResultInfo.deviceAppData.device, {
				syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
				isFullSync: liveSyncResultInfo.isFullSync
			});

			if (liveSyncResultInfo && deviceDescriptor.debugggingEnabled) {
				await this.$deviceDebugAppService.refreshApplicationWithDebug(projectData, deviceDescriptor, refreshInfo);
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
