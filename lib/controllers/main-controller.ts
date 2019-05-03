import { AddPlatformService } from "../services/platform/add-platform-service";
import { BuildPlatformService } from "../services/platform/build-platform-service";
import { DeviceInstallAppService } from "../services/device/device-install-app-service";
import { DeviceRefreshAppService } from "../services/device/device-refresh-app-service";
import { EventEmitter } from "events";
import { FILES_CHANGE_EVENT_NAME, INITIAL_SYNC_EVENT_NAME, LiveSyncEvents } from "../constants";
import { PreparePlatformService } from "../services/platform/prepare-platform-service";
import { WorkflowDataService } from "../services/workflow/workflow-data-service";

const deviceDescriptorPrimaryKey = "identifier";

export class MainController extends EventEmitter {
	private liveSyncProcessesInfo: IDictionary<ILiveSyncProcessInfo> = {};

	constructor(
		private $addPlatformService: AddPlatformService,
		private $buildPlatformService: BuildPlatformService,
		private $deviceInstallAppService: DeviceInstallAppService,
		private $deviceRefreshAppService: DeviceRefreshAppService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $hooksService: IHooksService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformWatcherService: IPlatformWatcherService,
		private $pluginsService: IPluginsService,
		private $preparePlatformService: PreparePlatformService,
		private $projectDataService: IProjectDataService,
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

	public async deployPlatform(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncInfo: ILiveSyncInfo): Promise<void> {
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

	public async runPlatform(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncInfo: ILiveSyncInfo): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		await this.initializeSetup(projectData);

		const platforms = this.$devicesService.getPlatformsFromDeviceDescriptors(deviceDescriptors);

		for (const platform of platforms) {
			const { nativePlatformData, addPlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, { ...liveSyncInfo, platformParam: platform });
			await this.$addPlatformService.addPlatformIfNeeded(nativePlatformData, projectData, addPlatformData);
		}

		this.setLiveSyncProcessInfo(projectDir, liveSyncInfo, deviceDescriptors);

		const shouldStartWatcher = !liveSyncInfo.skipWatcher && (liveSyncInfo.syncToPreviewApp || this.liveSyncProcessesInfo[projectData.projectDir].deviceDescriptors.length);
		if (shouldStartWatcher) {
			this.$platformWatcherService.on(INITIAL_SYNC_EVENT_NAME, async (data: IInitialSyncEventData) => {
				const executeAction = async (device: Mobile.IDevice) => {
					const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
					await this.syncInitialDataOnDevice(device, deviceDescriptor, projectData, liveSyncInfo);
				};
				const canExecuteAction = (device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === data.platform.toLowerCase() && _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
				await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(executeAction, canExecuteAction));
			});
			this.$platformWatcherService.on(FILES_CHANGE_EVENT_NAME, async (data: IFilesChangeEventData) => {
				const executeAction = async (device: Mobile.IDevice) => {
					const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
					await this.syncChangedDataOnDevice(device, deviceDescriptor, data, projectData, liveSyncInfo);
				};
				const canExecuteAction = (device: Mobile.IDevice) => {
					const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
					return (data.platform.toLowerCase() === device.deviceInfo.platform.toLowerCase()) && liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
				};
				await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(executeAction, canExecuteAction));
			});

			for (const platform of platforms) {
				const { nativePlatformData, preparePlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, liveSyncInfo);
				await this.$platformWatcherService.startWatcher(nativePlatformData, projectData, preparePlatformData);
			}
		}
	}

	private async syncInitialDataOnDevice(device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo): Promise<void> {
		const { nativePlatformData: platformData, buildPlatformData } = this.$workflowDataService.createWorkflowData(device.deviceInfo.platform, projectData.projectDir, liveSyncInfo);

		try {
			const outputPath = deviceDescriptor.outputPath || platformData.getBuildOutputPath(buildPlatformData);
			const packageFilePath = await this.$buildPlatformService.buildPlatformIfNeeded(platformData, projectData, buildPlatformData, outputPath);

			await this.$deviceInstallAppService.installOnDeviceIfNeeded(device, platformData, projectData, buildPlatformData, packageFilePath, outputPath);

			// TODO: Consider to improve this
			const platformLiveSyncService = this.getLiveSyncService(platformData.platformNameLowerCase);
			const { force, useHotModuleReload, skipWatcher } = liveSyncInfo;
			const liveSyncResultInfo = await platformLiveSyncService.fullSync({ force, useHotModuleReload, projectData, device, watch: !skipWatcher, liveSyncDeviceInfo: deviceDescriptor });

			await this.$deviceRefreshAppService.refreshApplication(deviceDescriptor, projectData, liveSyncResultInfo, platformLiveSyncService, this);
		} catch (err) {
			this.$logger.warn(`Unable to apply changes on device: ${device.deviceInfo.identifier}. Error is: ${err.message}.`);

			this.emitLivesyncEvent(LiveSyncEvents.liveSyncError, {
				error: err,
				deviceIdentifier: device.deviceInfo.identifier,
				projectDir: projectData.projectDir,
				applicationIdentifier: projectData.projectIdentifiers[platformData.platformNameLowerCase]
			});

			await this.stopLiveSync(projectData.projectDir, [device.deviceInfo.identifier], { shouldAwaitAllActions: false });
		}
	}

	public async stopLiveSync(projectDir: string, deviceIdentifiers?: string[], stopOptions?: { shouldAwaitAllActions: boolean }): Promise<void> {
		const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectDir];
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

				if (liveSyncProcessInfo.watcherInfo && liveSyncProcessInfo.watcherInfo.watcher) {
					liveSyncProcessInfo.watcherInfo.watcher.close();
				}

				liveSyncProcessInfo.watcherInfo = null;
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

			// Emit LiveSync stopped when we've really stopped.
			_.each(removedDeviceIdentifiers, deviceIdentifier => {
				this.emitLivesyncEvent(LiveSyncEvents.liveSyncStopped, { projectDir, deviceIdentifier });
			});
		}
	}

	public emitLivesyncEvent(event: string, livesyncData: ILiveSyncEventData): boolean {
		this.$logger.trace(`Will emit event ${event} with data`, livesyncData);
		return this.emit(event, livesyncData);
	}

	private async syncChangedDataOnDevice(device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo, data: IFilesChangeEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo): Promise<void> {
		console.log("syncChangedDataOnDevice================ ", data);
		const { nativePlatformData, buildPlatformData } = this.$workflowDataService.createWorkflowData(device.deviceInfo.platform, projectData.projectDir, liveSyncInfo);

		if (data.hasNativeChanges) {
			// TODO: Consider to handle nativePluginsChange here (aar rebuilt)
			await this.$buildPlatformService.buildPlatform(nativePlatformData, projectData, buildPlatformData);
		}

		const platformLiveSyncService = this.getLiveSyncService(device.deviceInfo.platform);
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

		await this.$deviceRefreshAppService.refreshApplication(deviceDescriptor, projectData, liveSyncResultInfo, platformLiveSyncService, this);
	}

	public getLiveSyncDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[] {
		const liveSyncProcessesInfo = this.liveSyncProcessesInfo[projectDir] || <ILiveSyncProcessInfo>{};
		const currentDescriptors = liveSyncProcessesInfo.deviceDescriptors;
		return currentDescriptors || [];
	}

	private setLiveSyncProcessInfo(projectDir: string, liveSyncInfo: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): void {
		this.liveSyncProcessesInfo[projectDir] = this.liveSyncProcessesInfo[projectDir] || Object.create(null);
		this.liveSyncProcessesInfo[projectDir].actionsChain = this.liveSyncProcessesInfo[projectDir].actionsChain || Promise.resolve();
		this.liveSyncProcessesInfo[projectDir].currentSyncAction = this.liveSyncProcessesInfo[projectDir].actionsChain;
		this.liveSyncProcessesInfo[projectDir].isStopped = false;
		this.liveSyncProcessesInfo[projectDir].syncToPreviewApp = liveSyncInfo.syncToPreviewApp;

		const currentDeviceDescriptors = this.getLiveSyncDeviceDescriptors(projectDir);
		this.liveSyncProcessesInfo[projectDir].deviceDescriptors = _.uniqBy(currentDeviceDescriptors.concat(deviceDescriptors), deviceDescriptorPrimaryKey);
	}

	private async initializeSetup(projectData: IProjectData): Promise<void> {
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.failWithoutHelp(`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`);
		}
	}

	private async addActionToChain<T>(projectDir: string, action: () => Promise<T>): Promise<T> {
		const liveSyncInfo = this.liveSyncProcessesInfo[projectDir];
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

	private getLiveSyncService(platform: string): IPlatformLiveSyncService {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return this.$injector.resolve("iOSLiveSyncService");
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return this.$injector.resolve("androidLiveSyncService");
		}

		this.$errors.failWithoutHelp(`Invalid platform ${platform}. Supported platforms are: ${this.$mobileHelper.platformNames.join(", ")}`);
	}
}
$injector.register("mainController", MainController);
