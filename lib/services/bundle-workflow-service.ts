import { INITIAL_SYNC_EVENT_NAME, FILES_CHANGE_EVENT_NAME } from "../constants";
import { WorkflowDataService } from "./workflow/workflow-data-service";

const deviceDescriptorPrimaryKey = "identifier";

export class BundleWorkflowService implements IBundleWorkflowService {
	private liveSyncProcessesInfo: IDictionary<any> = {};

	constructor(
		private $deviceInstallationService: IDeviceInstallationService,
		private $deviceRestartApplicationService: IDeviceRestartApplicationService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $injector: IInjector,
		private $mobileHelper: Mobile.IMobileHelper,
		private $logger: ILogger,
		private $platformService: IPlatformService,
		private $platformAddService: IPlatformAddService,
		private $platformBuildService: IPlatformBuildService,
		private $platformWatcherService: IPlatformWatcherService,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $workflowDataService: WorkflowDataService
	) { }

	public async preparePlatform(platform: string, projectDir: string, options: IOptions): Promise<void> {
		const { nativePlatformData, projectData, addPlatformData, preparePlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, options);

		await this.$platformAddService.addPlatformIfNeeded(nativePlatformData, projectData, addPlatformData);
		await this.$platformService.preparePlatform(nativePlatformData, projectData, preparePlatformData);
	}

	public async buildPlatform(platform: string, projectDir: string, options: IOptions): Promise<string> {
		const { nativePlatformData, projectData, buildPlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, options);

		await this.preparePlatform(platform, projectDir, options);
		const result = await this.$platformBuildService.buildPlatform(nativePlatformData, projectData, buildPlatformData);

		return result;
	}

	public async runPlatform(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncInfo: ILiveSyncInfo): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		await this.initializeSetup(projectData);

		const platforms = _(deviceDescriptors)
			.map(device => this.$devicesService.getDeviceByIdentifier(device.identifier))
			.map(device => device.deviceInfo.platform)
			.uniq()
			.value();

		for (const platform of platforms) {
			const { nativePlatformData, addPlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, { ...liveSyncInfo, platformParam: platform });
			await this.$platformAddService.addPlatformIfNeeded(nativePlatformData, projectData, addPlatformData);
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

		const outputPath = deviceDescriptor.outputPath || platformData.getBuildOutputPath(buildPlatformData);
		const packageFilePath = await this.$platformBuildService.buildPlatformIfNeeded(platformData, projectData, buildPlatformData, outputPath);

		await this.$deviceInstallationService.installOnDeviceIfNeeded(device, platformData, projectData, buildPlatformData, packageFilePath, outputPath);

		// TODO: Consider to improve this
		const platformLiveSyncService = this.getLiveSyncService(platformData.platformNameLowerCase);
		const { force, useHotModuleReload, skipWatcher } = liveSyncInfo;
		const liveSyncResultInfo = await platformLiveSyncService.fullSync({ force, useHotModuleReload, projectData, device, watch: !skipWatcher, liveSyncDeviceInfo: deviceDescriptor });

		await this.$deviceRestartApplicationService.restartOnDevice(deviceDescriptor, projectData, liveSyncResultInfo, platformLiveSyncService);
	}

	private async syncChangedDataOnDevice(device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo, data: IFilesChangeEventData, projectData: IProjectData, liveSyncInfo: ILiveSyncInfo): Promise<void> {
		console.log("syncChangedDataOnDevice================ ", data);
		const { nativePlatformData, buildPlatformData } = this.$workflowDataService.createWorkflowData(device.deviceInfo.platform, projectData.projectDir, liveSyncInfo);

		if (data.hasNativeChanges) {
			// TODO: Consider to handle nativePluginsChange here (aar rebuilt)
			await this.$platformBuildService.buildPlatform(nativePlatformData, projectData, buildPlatformData);
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
		await this.$deviceRestartApplicationService.restartOnDevice(deviceDescriptor, projectData, liveSyncResultInfo, platformLiveSyncService);
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
$injector.register("bundleWorkflowService", BundleWorkflowService);
