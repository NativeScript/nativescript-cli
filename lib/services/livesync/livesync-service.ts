import * as path from "path";
import * as choki from "chokidar";
import * as iOSLs from "./ios-livesync-service";
import * as androidLs from "./android-livesync-service";
import { EventEmitter } from "events";
import { exported } from "../../common/decorators";
import { hook } from "../../common/helpers";

const LiveSyncEvents = {
	liveSyncStarted: "liveSyncStarted",
	liveSyncStopped: "liveSyncStopped",
	liveSyncError: "liveSyncError", // Do we need this or we can use liveSyncStopped event?
	liveSyncWatcherStarted: "liveSyncWatcherStarted",
	liveSyncWatcherStopped: "liveSyncWatcherStopped",
	liveSyncFileChangedEvent: "liveSyncFileChangedEvent",
	liveSyncOperationStartingEvent: "liveSyncOperationStartedEvent"
};

// TODO: emit events for "successfull livesync", "stoppedLivesync",
export class LiveSyncService extends EventEmitter implements ILiveSyncService {
	// key is projectDir
	private liveSyncProcessesInfo: IDictionary<ILiveSyncProcessInfo> = {};

	constructor(protected $platformService: IPlatformService,
		private $projectDataService: IProjectDataService,
		protected $devicesService: Mobile.IDevicesService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		protected $logger: ILogger,
		private $processService: IProcessService,
		private $hooksService: IHooksService,
		private $projectChangesService: IProjectChangesService,
		protected $injector: IInjector) {
		super();
	}

	// TODO: Add finishLivesync method in the platform specific services
	@exported("liveSyncService")
	@hook("liveSync")
	public async liveSync(deviceDescriptors: ILiveSyncDeviceInfo[],
		liveSyncData: ILiveSyncInfo): Promise<void> {

		this.emit(LiveSyncEvents.liveSyncStarted, { projectDir: liveSyncData.projectDir, deviceIdentifiers: deviceDescriptors.map(dd => dd.identifier) });
		// TODO: Initialize devicesService before that.
		const projectData = this.$projectDataService.getProjectData(liveSyncData.projectDir);
		await this.initialSync(projectData, deviceDescriptors, liveSyncData);

		// Should be set after prepare
		this.$injector.resolve<DeprecatedUsbLiveSyncService>("usbLiveSyncService").isInitialized = true;

		if (liveSyncData.shouldStartWatcher) {
			await this.startWatcher(projectData, deviceDescriptors, liveSyncData);
		}
	}

	@exported("liveSyncService")
	public async stopLiveSync(projectDir: string): Promise<void> {
		const liveSyncProcessInfo = _.find(this.liveSyncProcessesInfo, (info, key) => key === projectDir);

		if (liveSyncProcessInfo) {
			if (liveSyncProcessInfo.timer) {
				clearTimeout(liveSyncProcessInfo.timer);
			}

			if (liveSyncProcessInfo.watcher) {
				liveSyncProcessInfo.watcher.close();
			}

			delete this.liveSyncProcessesInfo[projectDir];

			// Kill typescript watcher
			await this.$hooksService.executeAfterHooks('watch');
		}
	}

	protected async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo): Promise<void> {
		const platformLiveSyncService = this.getLiveSyncService(liveSyncResultInfo.deviceAppData.platform);
		await platformLiveSyncService.refreshApplication(projectData, liveSyncResultInfo);
	}

	// TODO: Register both livesync services in injector
	private getLiveSyncService(platform: string): IPlatformLiveSyncService {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return this.$injector.resolve(iOSLs.IOSLiveSyncService);
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return this.$injector.resolve(androidLs.AndroidLiveSyncService);
		}

		throw new Error(`Invalid platform ${platform}. Supported platforms are: ${this.$mobileHelper.platformNames.join(", ")}`);
	}

	private async ensureLatestAppPackageIsInstalledOnDevice(device: Mobile.IDevice,
		preparedPlatforms: string[],
		rebuiltInformation: ILiveSyncBuildInfo[],
		projectData: IProjectData,
		deviceBuildInfoDescriptor: ILiveSyncDeviceInfo,
		modifiedFiles?: string[]): Promise<void> {

		const platform = device.deviceInfo.platform;
		if (preparedPlatforms.indexOf(platform) === -1) {
			preparedPlatforms.push(platform);
			// TODO: fix args cast to any
			await this.$platformService.preparePlatform(platform, <any>{}, null, projectData, <any>{}, modifiedFiles);
		}

		// TODO: fix args cast to any
		const shouldBuild = await this.$platformService.shouldBuild(platform, projectData, <any>{ buildForDevice: !device.isEmulator }, deviceBuildInfoDescriptor.outputPath);
		if (shouldBuild) {
			const pathToBuildItem = await deviceBuildInfoDescriptor.buildAction();
			// Is it possible to return shouldBuild for two devices? What about android device and android emulator?
			rebuiltInformation.push({ isEmulator: device.isEmulator, platform, pathToBuildItem });
		}

		const rebuildInfo = _.find(rebuiltInformation, info => info.isEmulator === device.isEmulator && info.platform === platform);

		if (rebuildInfo) {
			// Case where we have three devices attached, a change that requires build is found,
			// we'll rebuild the app only for the first device, but we should install new package on all three devices.
			await this.$platformService.installApplication(device, { release: false }, projectData, rebuildInfo.pathToBuildItem, deviceBuildInfoDescriptor.outputPath);
		}

		const shouldInstall = await this.$platformService.shouldInstall(device, projectData, deviceBuildInfoDescriptor.outputPath);
		if (shouldInstall) {
			// device.applicationManager.installApplication()
			console.log("TODO!!!!!!");
			// call platformService.installApplication here as well.
		}
	}

	private async initialSync(projectData: IProjectData, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void> {
		const preparedPlatforms: string[] = [];
		const rebuiltInformation: ILiveSyncBuildInfo[] = [];

		// Now fullSync
		const deviceAction = async (device: Mobile.IDevice): Promise<void> => {
			// TODO: Call androidDeviceLiveSyncService.beforeLiveSyncAction
			const platform = device.deviceInfo.platform;
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			await this.ensureLatestAppPackageIsInstalledOnDevice(device, preparedPlatforms, rebuiltInformation, projectData, deviceDescriptor);

			const liveSyncResultInfo = await this.getLiveSyncService(platform).fullSync({ projectData, device, syncAllFiles: liveSyncData.syncAllFiles, useLiveEdit: liveSyncData.useLiveEdit });
			await this.refreshApplication(projectData, liveSyncResultInfo);
			//await device.applicationManager.restartApplication(projectData.projectId, projectData.projectName);
		};

		await this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier));
	}

	private async startWatcher(projectData: IProjectData,
		deviceDescriptors: ILiveSyncDeviceInfo[],
		liveSyncData: ILiveSyncInfo): Promise<void> {

		let pattern = ["app"];

		if (liveSyncData.syncAllFiles) {
			const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);
			pattern.push("package.json");

			// watch only production node_module/packages same one prepare uses
			for (let index in productionDependencies) {
				pattern.push(productionDependencies[index].directory);
			}
		}

		console.log("now starting watcher!", pattern);

		let filesToSync: string[] = [],
			filesToRemove: string[] = [];
		let timeoutTimer: NodeJS.Timer;

		const removeDeviceDescriptor = async (deviceId: string) => {
			_.remove(deviceDescriptors, descriptor => descriptor.identifier === deviceId);

			if (!deviceDescriptors.length) {
				await this.stopLiveSync(liveSyncData.projectDir);
			}
		};

		const startTimeout = () => {
			timeoutTimer = setTimeout(async () => {
				await this.addActionToQueue(projectData.projectDir, async () => {
					// TODO: Push consecutive actions to the queue, do not start them simultaneously
					if (filesToSync.length || filesToRemove.length) {
						try {
							let currentFilesToSync = _.cloneDeep(filesToSync);
							filesToSync = [];

							let currentFilesToRemove = _.cloneDeep(filesToRemove);
							filesToRemove = [];

							const allModifiedFiles = [].concat(currentFilesToSync).concat(currentFilesToRemove);
							console.log(this.$projectChangesService.currentChanges);

							const preparedPlatforms: string[] = [];
							const rebuiltInformation: ILiveSyncBuildInfo[] = [];
							await this.$devicesService.execute(async (device: Mobile.IDevice) => {
								// const platform = device.deviceInfo.platform;
								const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);

								await this.ensureLatestAppPackageIsInstalledOnDevice(device, preparedPlatforms, rebuiltInformation,
									projectData, deviceDescriptor, allModifiedFiles);

								const service = this.getLiveSyncService(device.deviceInfo.platform);
								const settings: ILiveSyncWatchInfo = {
									projectData,
									filesToRemove: currentFilesToRemove,
									filesToSync: currentFilesToSync,
									isRebuilt: !!_.find(rebuiltInformation, info => info.isEmulator === device.isEmulator && info.platform === device.deviceInfo.platform),
									syncAllFiles: liveSyncData.syncAllFiles,
									useLiveEdit: liveSyncData.useLiveEdit
								};

								const liveSyncResultInfo = await service.liveSyncWatchAction(device, settings);
								await this.refreshApplication(projectData, liveSyncResultInfo);
							},
								(device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier)
							);
						} catch (err) {
							// this.$logger.info(`Unable to sync file ${filePath}. Error is:${err.message}`.red.bold);
							this.$logger.info("Try saving it again or restart the livesync operation.");
							// we can remove the descriptor from action:
							const allErrors = err.allErrors;
							console.log(allErrors);
							_.each(allErrors, (deviceError: any) => {
								console.log("for error: ", deviceError, " device ID: ", deviceError.deviceIdentifier);
								removeDeviceDescriptor(deviceError.deviceIdentifier);
							});
						}
					}
				});
			}, 250);

			this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;
		};

		await this.$hooksService.executeBeforeHooks('watch');

		const watcherOptions: choki.WatchOptions = {
			ignoreInitial: true,
			cwd: liveSyncData.projectDir,
			awaitWriteFinish: {
				pollInterval: 100,
				stabilityThreshold: 500
			},
			ignored: ["**/.*", ".*"] // hidden files
		};

		this.emit(LiveSyncEvents.liveSyncWatcherStarted, { projectDir: liveSyncData.projectDir, deviceIdentifiers: deviceDescriptors.map(dd => dd.identifier), watcherOptions, });

		const watcher = choki.watch(pattern, watcherOptions)
			.on("all", async (event: string, filePath: string) => {
				clearTimeout(timeoutTimer);

				filePath = path.join(liveSyncData.projectDir, filePath);

				this.$logger.trace(`Chokidar raised event ${event} for ${filePath}.`);

				if (event === "add" || event === "addDir" || event === "change" /* <--- what to do when change event is raised ? */) {
					filesToSync.push(filePath);
				} else if (event === "unlink" || event === "unlinkDir") {
					filesToRemove.push(filePath);
				}

				startTimeout();
			});

		// TODO: Extract to separate method.
		this.liveSyncProcessesInfo[liveSyncData.projectDir] = this.liveSyncProcessesInfo[liveSyncData.projectDir] || <any>{
			actionsChain: Promise.resolve()
		};

		this.liveSyncProcessesInfo[liveSyncData.projectDir].watcher = watcher;
		this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;
		this.liveSyncProcessesInfo[liveSyncData.projectDir].isStopped = false;

		this.$processService.attachToProcessExitSignals(this, () => {
			_.keys(this.liveSyncProcessesInfo).forEach(projectDir => {
				// Do not await here, we are in process exit's handler.
				this.stopLiveSync(projectDir);
			});
		});

		this.$devicesService.on("deviceLost", async (device: Mobile.IDevice) => {
			await removeDeviceDescriptor(device.deviceInfo.identifier);
		});
	}

	private async addActionToQueue<T>(projectDir: string, action: () => Promise<T>): Promise<T> {
		const liveSyncInfo = this.liveSyncProcessesInfo[projectDir];
		if (liveSyncInfo) {
			liveSyncInfo.actionsChain = liveSyncInfo.actionsChain.then(async () => {
				if (!liveSyncInfo.isStopped) {
					const res = await action();
					return res;
				}
			});

			const result = await liveSyncInfo.actionsChain;
			return result;
		}
	}

}

$injector.register("liveSyncService", LiveSyncService);

/**
 * This class is used only for old versions of nativescript-dev-typescript plugin.
 * It should be replaced with liveSyncService.isInitalized.
 * Consider adding get and set methods for isInitialized,
 * so whenever someone tries to access the value of isInitialized,
 * they'll get a warning to update the plugins (like nativescript-dev-typescript).
 */
export class DeprecatedUsbLiveSyncService {
	public isInitialized = false;
}

$injector.register("usbLiveSyncService", DeprecatedUsbLiveSyncService);
