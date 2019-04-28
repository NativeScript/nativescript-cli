// import * as path from "path";
// import * as constants from "../constants";

const deviceDescriptorPrimaryKey = "identifier";

// TODO: Rename this class to RunWorkflowService
export class BundleWorkflowService implements IBundleWorkflowService {
	private liveSyncProcessesInfo: IDictionary<any> = {};

	constructor(
		private $devicesService: Mobile.IDevicesService,
		private $deviceWorkflowService: IDeviceWorkflowService,
		private $errors: IErrors,
		private $liveSyncService: ILiveSyncService2,
		// private $fs: IFileSystem,
		private $logger: ILogger,
		// private $platformAddService: IPlatformAddService,
		private $platformsData: IPlatformsData,
		private $platformWatcherService: IPlatformWatcherService,
		private $platformWorkflowService: IPlatformWorkflowService,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		// private $projectChangesService: IProjectChangesService
	) { }

	// processInfo[projectDir] = {
	// 		deviceDescriptors, nativeFilesWatcher, jsFilesWatcher
	// }

	public async start(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncInfo: ILiveSyncInfo): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		await this.initializeSetup(projectData);

		const platforms = _(deviceDescriptors)
			.map(device => this.$devicesService.getDeviceByIdentifier(device.identifier))
			.map(device => device.deviceInfo.platform)
			.uniq()
			.value();

		const workflowData: IPlatformWorkflowData = {
			platformParam: null,
			nativePrepare: liveSyncInfo.nativePrepare,
			release: liveSyncInfo.release,
			useHotModuleReload: liveSyncInfo.useHotModuleReload,
			signingOptions: {
				teamId: (<any>liveSyncInfo).teamId,
				provision: (<any>liveSyncInfo).provision
			}
		};

		// Ensure platform is added before starting JS(webpack) and native prepare
		for (const platform of platforms) {
			const platformNameLowerCase = platform.toLowerCase();
			const platformData = this.$platformsData.getPlatformData(platformNameLowerCase, projectData);
			workflowData.platformParam = platformNameLowerCase;
			await this.$platformWorkflowService.addPlatformIfNeeded(platformData, projectData, workflowData);
		}

		this.setLiveSyncProcessInfo(projectDir, liveSyncInfo, deviceDescriptors);

		const initalSyncDeviceAction = async (device: Mobile.IDevice): Promise<void> => {
			console.log("================== INITIAL SYNC DEVICE ACTION ================");
			const deviceBuildInfoDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			const platform = device.deviceInfo.platform;
			const platformData = this.$platformsData.getPlatformData(platform, projectData);
			const buildConfig = {
				buildForDevice: !device.isEmulator,
				device: device.deviceInfo.identifier,
				release: liveSyncInfo.release,
				clean: liveSyncInfo.clean,
				iCloudContainerEnvironment: "",
				projectDir: projectData.projectDir,
				teamId: <any>null,
				provision: <any>null,
			};
			const outputPath = deviceBuildInfoDescriptor.outputPath || platformData.getBuildOutputPath(buildConfig);
			const packageFilePath = await this.$platformWorkflowService.buildPlatformIfNeeded(platformData, projectData, workflowData, buildConfig, outputPath);

			await this.$deviceWorkflowService.installOnDeviceIfNeeded(device, platformData, projectData, buildConfig, packageFilePath, outputPath);

			await this.$liveSyncService.fullSync(device, deviceBuildInfoDescriptor, projectData, liveSyncInfo);
		};

		// const filesChangeDeviceAction = async (device: Mobile.IDevice): Promise<void> {
		// 	// test
		// };

		this.$platformWatcherService.on("onInitialSync", async () => { // TODO: emit correct initialSyncData -> platform + hasNativeChange
			await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(initalSyncDeviceAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier)));
		});
		this.$platformWatcherService.on("fileChangeData", () => {
			console.log("=================== RECEIVED FILES CHANGE ================ ");
			// Emitted when webpack compilatation is done and native prepare is done
			// console.log("--------- ========= ---------- ", data);
			// AddActionToChain
		});

		const shouldStartWatcher = !liveSyncInfo.skipWatcher && (liveSyncInfo.syncToPreviewApp || this.liveSyncProcessesInfo[projectData.projectDir].deviceDescriptors.length);

		if (shouldStartWatcher) {
			// TODO: Extract the preparePlatformData to separate variable
			for (const platform of platforms) {
				const platformData = this.$platformsData.getPlatformData(platform.toLocaleLowerCase(), projectData);
				await this.$platformWatcherService.startWatcher(platformData, projectData, {
					webpackCompilerConfig: liveSyncInfo.webpackCompilerConfig,
					preparePlatformData: {
						release: liveSyncInfo.release,
						useHotModuleReload: liveSyncInfo.useHotModuleReload,
						nativePrepare: liveSyncInfo.nativePrepare,
						signingOptions: {
							teamId: (<any>liveSyncInfo).teamId,
							provision: (<any>liveSyncInfo).provision
						}
					}
				});
			}
		}
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
}
$injector.register("bundleWorkflowService", BundleWorkflowService);
