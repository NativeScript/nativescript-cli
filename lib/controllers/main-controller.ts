import { AddPlatformService } from "../services/platform/add-platform-service";
import { BuildPlatformService } from "../services/platform/build-platform-service";
import { DeviceInstallAppService } from "../services/device/device-install-app-service";
import { EventEmitter } from "events";
import { FILES_CHANGE_EVENT_NAME, INITIAL_SYNC_EVENT_NAME, RunOnDeviceEvents } from "../constants";
import { PreparePlatformService } from "../services/platform/prepare-platform-service";
import { WorkflowDataService } from "../services/workflow/workflow-data-service";
import { RunOnDevicesController } from "./run-on-devices-controller";
import { RunOnDevicesDataService } from "../services/run-on-devices-data-service";
import { cache } from "../common/decorators";
import { DeviceDiscoveryEventNames } from "../common/constants";
import { RunOnDevicesEmitter } from "../run-on-devices-emitter";
import { PlatformWatcherService } from "../services/platform/platform-watcher-service";

export class MainController extends EventEmitter {
	constructor(
		private $addPlatformService: AddPlatformService,
		private $buildPlatformService: BuildPlatformService,
		private $deviceInstallAppService: DeviceInstallAppService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $hooksService: IHooksService,
		private $logger: ILogger,
		private $platformWatcherService: PlatformWatcherService,
		private $pluginsService: IPluginsService,
		private $preparePlatformService: PreparePlatformService,
		private $projectDataService: IProjectDataService,
		private $runOnDevicesController: RunOnDevicesController,
		private $runOnDevicesDataService: RunOnDevicesDataService,
		private $runOnDevicesEmitter: RunOnDevicesEmitter,
		private $workflowDataService: WorkflowDataService
	) { super(); }

	public async preparePlatform(platform: string, projectDir: string, options: IOptions): Promise<void> {
		const { nativePlatformData, projectData, addPlatformData, preparePlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, options);

		await this.$addPlatformService.addPlatformIfNeeded(nativePlatformData, projectData, addPlatformData);
		await this.$preparePlatformService.preparePlatform(nativePlatformData, projectData, preparePlatformData);
	}

	public async buildPlatform(platform: string, projectDir: string, options: IOptions): Promise<string> {
		const { nativePlatformData, projectData, buildPlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, options);

		await this.preparePlatform(platform, projectDir, options);
		const result = await this.$buildPlatformService.buildPlatform(nativePlatformData, projectData, buildPlatformData);

		return result;
	}

	public async deployOnDevices(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncInfo: ILiveSyncInfo): Promise<void> {
		const platforms = this.$devicesService.getPlatformsFromDeviceDescriptors(deviceDescriptors);

		for (const platform of platforms) {
			await this.preparePlatform(platform, projectDir, <any>liveSyncInfo);
		}

		const executeAction = async (device: Mobile.IDevice) => {
			const { nativePlatformData, projectData, buildPlatformData } = this.$workflowDataService.createWorkflowData(device.deviceInfo.platform, projectDir, liveSyncInfo);
			await this.$buildPlatformService.buildPlatformIfNeeded(nativePlatformData, projectData, buildPlatformData);
			await this.$deviceInstallAppService.installOnDeviceIfNeeded(device, nativePlatformData, projectData, buildPlatformData);
		};

		await this.$devicesService.execute(executeAction, (device: Mobile.IDevice) => true);
	}

	public async runOnDevices(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncInfo: ILiveSyncInfo): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		await this.initializeSetup(projectData);

		const platforms = this.$devicesService.getPlatformsFromDeviceDescriptors(deviceDescriptors);

		for (const platform of platforms) {
			const { nativePlatformData, addPlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, { ...liveSyncInfo, platformParam: platform });
			await this.$addPlatformService.addPlatformIfNeeded(nativePlatformData, projectData, addPlatformData);
		}

		// TODO: Consider to handle correctly the descriptors when livesync is executed for second time for the same projectDir

		this.$runOnDevicesDataService.persistData(projectDir, deviceDescriptors);

		const shouldStartWatcher = !liveSyncInfo.skipWatcher && (liveSyncInfo.syncToPreviewApp || this.$runOnDevicesDataService.hasDeviceDescriptors(projectDir));
		if (shouldStartWatcher) {
			this.handleRunOnDeviceEvents(projectDir);

			this.$platformWatcherService.on(INITIAL_SYNC_EVENT_NAME, async (data: IInitialSyncEventData) => {
				await this.$runOnDevicesController.syncInitialDataOnDevice(data, projectData, liveSyncInfo, deviceDescriptors);
			});
			this.$platformWatcherService.on(FILES_CHANGE_EVENT_NAME, async (data: IFilesChangeEventData) => {
				await this.$runOnDevicesController.syncChangedDataOnDevice(data, projectData, liveSyncInfo, deviceDescriptors);
			});

			for (const platform of platforms) {
				const { nativePlatformData, preparePlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, liveSyncInfo);
				await this.$platformWatcherService.startWatchers(nativePlatformData, projectData, preparePlatformData);
			}
		}

		// TODO: Consider how to handle --justlaunch

		this.attachDeviceLostHandler();
	}

	public async stopRunOnDevices(projectDir: string, deviceIdentifiers?: string[], stopOptions?: { shouldAwaitAllActions: boolean }): Promise<void> {
		const liveSyncProcessInfo = this.$runOnDevicesDataService.getData(projectDir);
		if (liveSyncProcessInfo && !liveSyncProcessInfo.isStopped) {
			// In case we are coming from error during livesync, the current action is the one that erred (but we are still executing it),
			// so we cannot await it as this will cause infinite loop.
			const shouldAwaitPendingOperation = !stopOptions || stopOptions.shouldAwaitAllActions;

			const deviceIdentifiersToRemove = deviceIdentifiers || _.map(liveSyncProcessInfo.deviceDescriptors, d => d.identifier);

			const removedDeviceIdentifiers = _.remove(liveSyncProcessInfo.deviceDescriptors, descriptor => _.includes(deviceIdentifiersToRemove, descriptor.identifier))
				.map(descriptor => descriptor.identifier);

			// In case deviceIdentifiers are not passed, we should stop the whole LiveSync.
			if (!deviceIdentifiers || !deviceIdentifiers.length || !liveSyncProcessInfo.deviceDescriptors || !liveSyncProcessInfo.deviceDescriptors.length) {
				if (liveSyncProcessInfo.timer) {
					clearTimeout(liveSyncProcessInfo.timer);
				}

				_.each(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => {
					const device = this.$devicesService.getDeviceByIdentifier(deviceDescriptor.identifier);
					this.$platformWatcherService.stopWatchers(projectDir, device.deviceInfo.platform);
				});

				liveSyncProcessInfo.isStopped = true;

				if (liveSyncProcessInfo.actionsChain && shouldAwaitPendingOperation) {
					await liveSyncProcessInfo.actionsChain;
				}

				liveSyncProcessInfo.deviceDescriptors = [];

				if (liveSyncProcessInfo.syncToPreviewApp) {
					// await this.$previewAppLiveSyncService.stopLiveSync();
					// this.$previewAppLiveSyncService.removeAllListeners();
				}

				// Kill typescript watcher
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

	private handleRunOnDeviceEvents(projectDir: string): void {
		this.$runOnDevicesController.on(RunOnDeviceEvents.runOnDeviceError, async data => {
			await this.stopRunOnDevices(projectDir, [data.deviceIdentifier], { shouldAwaitAllActions: false });
		});
	}

	// TODO: expose previewOnDevice() method { }
	// TODO: enableDebugging -> mainController
	// TODO: disableDebugging -> mainController
	// TODO: attachDebugger -> mainController
	// mainController.runOnDevices(), runOnDevicesController.on("event", () => {})

	// debugOnDevicesController.enableDebugging()
	// debugOnDevicesController.disableDebugging()
	// debugOnDevicesController.attachDebugger

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
}
$injector.register("mainController", MainController);
