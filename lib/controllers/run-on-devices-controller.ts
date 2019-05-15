import { DeviceDebugAppService } from "../services/device/device-debug-app-service";
import { DeviceInstallAppService } from "../services/device/device-install-app-service";
import { DeviceRefreshAppService } from "../services/device/device-refresh-app-service";
import { EventEmitter } from "events";
import { LiveSyncServiceResolver } from "../resolvers/livesync-service-resolver";
import { RunOnDevicesDataService } from "../services/run-on-devices-data-service";
import { RunOnDevicesEmitter } from "../run-on-devices-emitter";
import { HmrConstants, DeviceDiscoveryEventNames } from "../common/constants";
import { PrepareNativePlatformService } from "../services/platform/prepare-native-platform-service";
import { PrepareController } from "./prepare-controller";
import { PREPARE_READY_EVENT_NAME } from "../constants";
import { cache } from "../common/decorators";
import { RunOnDevicesData } from "../data/run-on-devices-data";
import { PrepareDataService } from "../services/prepare-data-service";
import { BuildController } from "./build-controller";
import { BuildDataService } from "../services/build-data-service";

export class RunOnDevicesController extends EventEmitter {
	constructor(
		private $buildDataService: BuildDataService,
		private $buildController: BuildController,
		private $deviceDebugAppService: DeviceDebugAppService,
		private $deviceInstallAppService: DeviceInstallAppService,
		private $deviceRefreshAppService: DeviceRefreshAppService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $hmrStatusService: IHmrStatusService,
		public $hooksService: IHooksService,
		private $liveSyncServiceResolver: LiveSyncServiceResolver,
		private $logger: ILogger,
		private $pluginsService: IPluginsService,
		private $platformsDataService: IPlatformsDataService,
		private $prepareNativePlatformService: PrepareNativePlatformService,
		private $prepareController: PrepareController,
		private $prepareDataService: PrepareDataService,
		private $projectDataService: IProjectDataService,
		private $runOnDevicesDataService: RunOnDevicesDataService,
		private $runOnDevicesEmitter: RunOnDevicesEmitter
	) { super(); }

	public async runOnDevices(runOnDevicesData: RunOnDevicesData): Promise<void> {
		const { projectDir, liveSyncInfo, deviceDescriptors } = runOnDevicesData;

		const projectData = this.$projectDataService.getProjectData(projectDir);
		await this.initializeSetup(projectData);

		const platforms = this.$devicesService.getPlatformsFromDeviceDescriptors(deviceDescriptors);
		const deviceDescriptorsForInitialSync = this.getDeviceDescriptorsForInitialSync(projectDir, deviceDescriptors);

		this.$runOnDevicesDataService.persistData(projectDir, deviceDescriptors, platforms);

		const shouldStartWatcher = !liveSyncInfo.skipWatcher && this.$runOnDevicesDataService.hasDeviceDescriptors(projectData.projectDir);
		if (shouldStartWatcher && liveSyncInfo.useHotModuleReload) {
			this.$hmrStatusService.attachToHmrStatusEvent();
		}

		this.$prepareController.on(PREPARE_READY_EVENT_NAME, async data => {
			await this.syncChangedDataOnDevices(data, projectData, liveSyncInfo, deviceDescriptors);
		});

		for (const platform of platforms) {
			const prepareData = this.$prepareDataService.getPrepareData(projectDir, platform, { ...liveSyncInfo, watch: !liveSyncInfo.skipWatcher });
			const prepareResult = await this.$prepareController.preparePlatform(prepareData);
			await this.syncInitialDataOnDevices(prepareResult, projectData, liveSyncInfo, deviceDescriptorsForInitialSync);
		}

		this.attachDeviceLostHandler();
	}

	public async stopRunOnDevices(projectDir: string, deviceIdentifiers?: string[], stopOptions?: { shouldAwaitAllActions: boolean }): Promise<void> {
		const liveSyncProcessInfo = this.$runOnDevicesDataService.getDataForProject(projectDir);
		if (liveSyncProcessInfo && !liveSyncProcessInfo.isStopped) {
			// In case we are coming from error during livesync, the current action is the one that erred (but we are still executing it),
			// so we cannot await it as this will cause infinite loop.
			const shouldAwaitPendingOperation = !stopOptions || stopOptions.shouldAwaitAllActions;

			const deviceIdentifiersToRemove = deviceIdentifiers || _.map(liveSyncProcessInfo.deviceDescriptors, d => d.identifier);

			const removedDeviceIdentifiers = _.remove(liveSyncProcessInfo.deviceDescriptors, descriptor => _.includes(deviceIdentifiersToRemove, descriptor.identifier))
				.map(descriptor => descriptor.identifier);

			// Handle the case when no more devices left for any of the persisted platforms
			_.each(liveSyncProcessInfo.platforms, platform => {
				const devices = this.$devicesService.getDevicesForPlatform(platform);
				if (!devices || !devices.length) {
					this.$prepareController.stopWatchers(projectDir, platform);
				}
			});

			// In case deviceIdentifiers are not passed, we should stop the whole LiveSync.
			if (!deviceIdentifiers || !deviceIdentifiers.length || !liveSyncProcessInfo.deviceDescriptors || !liveSyncProcessInfo.deviceDescriptors.length) {
				if (liveSyncProcessInfo.timer) {
					clearTimeout(liveSyncProcessInfo.timer);
				}

				_.each(liveSyncProcessInfo.platforms, platform => {
					this.$prepareController.stopWatchers(projectDir, platform);
				});

				liveSyncProcessInfo.isStopped = true;

				if (liveSyncProcessInfo.actionsChain && shouldAwaitPendingOperation) {
					await liveSyncProcessInfo.actionsChain;
				}

				liveSyncProcessInfo.deviceDescriptors = [];

				const projectData = this.$projectDataService.getProjectData(projectDir);
				await this.$hooksService.executeAfterHooks('watch', {
					hookArgs: {
						projectData
					}
				});
			} else if (liveSyncProcessInfo.currentSyncAction && shouldAwaitPendingOperation) {
				await liveSyncProcessInfo.currentSyncAction;
			}

			// Emit RunOnDevice stopped when we've really stopped.
			_.each(removedDeviceIdentifiers, deviceIdentifier => {
				this.$runOnDevicesEmitter.emitRunOnDeviceStoppedEvent(projectDir, deviceIdentifier);
			});
		}
	}

	public getRunOnDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[] {
		return this.$runOnDevicesDataService.getDeviceDescriptors(projectDir);
	}

	private getDeviceDescriptorsForInitialSync(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[]) {
		const currentRunOnDevicesData = this.$runOnDevicesDataService.getDataForProject(projectDir);
		const isAlreadyLiveSyncing = currentRunOnDevicesData && !currentRunOnDevicesData.isStopped;
		// Prevent cases where liveSync is called consecutive times with the same device, for example [ A, B, C ] and then [ A, B, D ] - we want to execute initialSync only for D.
		const deviceDescriptorsForInitialSync = isAlreadyLiveSyncing ? _.differenceBy(deviceDescriptors, currentRunOnDevicesData.deviceDescriptors, "identifier") : deviceDescriptors;

		return deviceDescriptorsForInitialSync;
	}

	private async initializeSetup(projectData: IProjectData): Promise<void> {
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
		}
	}

	@cache()
	private attachDeviceLostHandler(): void {
		this.$devicesService.on(DeviceDiscoveryEventNames.DEVICE_LOST, async (device: Mobile.IDevice) => {
			this.$logger.trace(`Received ${DeviceDiscoveryEventNames.DEVICE_LOST} event in LiveSync service for ${device.deviceInfo.identifier}. Will stop LiveSync operation for this device.`);

			for (const projectDir in this.$runOnDevicesDataService.getAllData()) {
				try {
					const deviceDescriptors = this.$runOnDevicesDataService.getDeviceDescriptors(projectDir);
					if (_.find(deviceDescriptors, d => d.identifier === device.deviceInfo.identifier)) {
						await this.stopRunOnDevices(projectDir, [device.deviceInfo.identifier]);
					}
				} catch (err) {
					this.$logger.warn(`Unable to stop LiveSync operation for ${device.deviceInfo.identifier}.`, err);
				}
			}
		});
	}

	private async syncInitialDataOnDevices(data: IPrepareOutputData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const deviceAction = async (device: Mobile.IDevice) => {
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			const platformData = this.$platformsDataService.getPlatformData(data.platform, projectData);
			const buildData = this.$buildDataService.getBuildData(projectData.projectDir, data.platform, { ...liveSyncInfo, outputPath: deviceDescriptor.outputPath });

			try {
				const packageFilePath = data.hasNativeChanges ?
					await this.$buildController.prepareAndBuildPlatform(buildData) :
					await this.$buildController.buildPlatformIfNeeded(buildData);

				await this.$deviceInstallAppService.installOnDeviceIfNeeded(device, buildData, packageFilePath);

				const platformLiveSyncService = this.$liveSyncServiceResolver.resolveLiveSyncService(platformData.platformNameLowerCase);
				const { force, useHotModuleReload, skipWatcher } = liveSyncInfo;
				const liveSyncResultInfo = await platformLiveSyncService.fullSync({ force, useHotModuleReload, projectData, device, watch: !skipWatcher, liveSyncDeviceInfo: deviceDescriptor });

				const refreshInfo = await this.$deviceRefreshAppService.refreshApplication(projectData, liveSyncResultInfo, deviceDescriptor);

				this.$runOnDevicesEmitter.emitRunOnDeviceExecutedEvent(projectData, device, {
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
			}
		};

		await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === data.platform.toLowerCase() && _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier)));
	}

	private async syncChangedDataOnDevices(data: IFilesChangeEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const deviceAction = async (device: Mobile.IDevice) => {
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			const platformData = this.$platformsDataService.getPlatformData(data.platform, projectData);
			const prepareData = this.$prepareDataService.getPrepareData(projectData.projectDir, data.platform, { ...liveSyncInfo, watch: !liveSyncInfo.skipWatcher });
			const buildData = this.$buildDataService.getBuildData(projectData.projectDir, data.platform, { ...liveSyncInfo, outputPath: deviceDescriptor.outputPath });

			try {
				if (data.hasNativeChanges) {
					await this.$prepareNativePlatformService.prepareNativePlatform(platformData, projectData, prepareData);
					await this.$buildController.prepareAndBuildPlatform(buildData);
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
			const liveSyncProcessInfo = this.$runOnDevicesDataService.getDataForProject(projectData.projectDir);
			return (data.platform.toLowerCase() === device.deviceInfo.platform.toLowerCase()) && liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
		}));
	}

	private async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, deviceDescriptor: ILiveSyncDeviceInfo) {
		const refreshInfo = await this.$deviceRefreshAppService.refreshApplication(projectData, liveSyncResultInfo, deviceDescriptor);

		this.$runOnDevicesEmitter.emitRunOnDeviceExecutedEvent(projectData, liveSyncResultInfo.deviceAppData.device, {
			syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
			isFullSync: liveSyncResultInfo.isFullSync
		});

		if (liveSyncResultInfo && deviceDescriptor.debuggingEnabled) {
			await this.$deviceDebugAppService.enableDebugging(projectData, deviceDescriptor, refreshInfo);
		}
	}

	private async addActionToChain<T>(projectDir: string, action: () => Promise<T>): Promise<T> {
		const liveSyncInfo = this.$runOnDevicesDataService.getDataForProject(projectDir);
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
