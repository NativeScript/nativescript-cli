import * as path from "path";
import * as choki from "chokidar";
import { EventEmitter } from "events";
import { hook } from "../../common/helpers";
import { APP_FOLDER_NAME, PACKAGE_JSON_FILE_NAME, LiveSyncTrackActionNames } from "../../constants";
import { FileExtensions, DeviceTypes } from "../../common/constants";
const deviceDescriptorPrimaryKey = "identifier";

const LiveSyncEvents = {
	liveSyncStopped: "liveSyncStopped",
	// In case we name it error, EventEmitter expects instance of Error to be raised and will also raise uncaught exception in case there's no handler
	liveSyncError: "liveSyncError",
	liveSyncExecuted: "liveSyncExecuted",
	liveSyncStarted: "liveSyncStarted",
	liveSyncNotification: "notify"
};

export class LiveSyncService extends EventEmitter implements ILiveSyncService {
	// key is projectDir
	private liveSyncProcessesInfo: IDictionary<ILiveSyncProcessInfo> = {};

	constructor(protected $platformService: IPlatformService,
		private $projectDataService: IProjectDataService,
		protected $devicesService: Mobile.IDevicesService,
		private $mobileHelper: Mobile.IMobileHelper,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		protected $logger: ILogger,
		private $processService: IProcessService,
		private $hooksService: IHooksService,
		private $pluginsService: IPluginsService,
		protected $injector: IInjector) {
		super();
	}

	public async liveSync(deviceDescriptors: ILiveSyncDeviceInfo[],
		liveSyncData: ILiveSyncInfo): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(liveSyncData.projectDir);
		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		await this.liveSyncOperation(deviceDescriptors, liveSyncData, projectData);
	}

	public async stopLiveSync(projectDir: string, deviceIdentifiers?: string[], stopOptions?: { shouldAwaitAllActions: boolean }): Promise<void> {
		const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectDir];

		if (liveSyncProcessInfo) {
			_.each(deviceIdentifiers, deviceId => {
				_.remove(liveSyncProcessInfo.deviceDescriptors, descriptor => {
					const shouldRemove = descriptor.identifier === deviceId;
					if (shouldRemove) {
						this.emit(LiveSyncEvents.liveSyncStopped, { projectDir, deviceIdentifier: descriptor.identifier });
					}

					return shouldRemove;
				});
			});

			// In case deviceIdentifiers are not passed, we should stop the whole LiveSync.
			if (!deviceIdentifiers || !deviceIdentifiers.length || !liveSyncProcessInfo.deviceDescriptors || !liveSyncProcessInfo.deviceDescriptors.length) {
				if (liveSyncProcessInfo.timer) {
					clearTimeout(liveSyncProcessInfo.timer);
				}

				if (liveSyncProcessInfo.watcherInfo && liveSyncProcessInfo.watcherInfo.watcher) {
					liveSyncProcessInfo.watcherInfo.watcher.close();
				}

				liveSyncProcessInfo.watcherInfo = null;

				if (liveSyncProcessInfo.actionsChain && (!stopOptions || stopOptions.shouldAwaitAllActions)) {
					await liveSyncProcessInfo.actionsChain;
				}

				_.each(liveSyncProcessInfo.deviceDescriptors, descriptor => {
					this.emit(LiveSyncEvents.liveSyncStopped, { projectDir, deviceIdentifier: descriptor.identifier });
				});

				liveSyncProcessInfo.isStopped = true;
				liveSyncProcessInfo.deviceDescriptors = [];

				// Kill typescript watcher
				const projectData = this.$projectDataService.getProjectData(projectDir);
				await this.$hooksService.executeAfterHooks('watch', {
					hookArgs: {
						projectData
					}
				});
			}
		}
	}

	protected async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo): Promise<void> {
		const platformLiveSyncService = this.getLiveSyncService(liveSyncResultInfo.deviceAppData.platform);
		try {
			await platformLiveSyncService.refreshApplication(projectData, liveSyncResultInfo);
		} catch (err) {
			this.$logger.info(`Error while trying to start application ${projectData.projectId} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Error is: ${err.message || err}`);
			const msg = `Unable to start application ${projectData.projectId} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
			this.$logger.warn(msg);
			this.emit(LiveSyncEvents.liveSyncNotification, {
				projectDir: projectData.projectDir,
				applicationIdentifier: projectData.projectId,
				deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
				notification: msg
			});
		}

		this.emit(LiveSyncEvents.liveSyncExecuted, {
			projectDir: projectData.projectDir,
			applicationIdentifier: projectData.projectId,
			syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
			deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
			isFullSync: liveSyncResultInfo.isFullSync
		});

		this.$logger.info(`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`);
	}

	@hook("liveSync")
	private async liveSyncOperation(deviceDescriptors: ILiveSyncDeviceInfo[],
		liveSyncData: ILiveSyncInfo, projectData: IProjectData): Promise<void> {
		// In case liveSync is called for a second time for the same projectDir.
		const isAlreadyLiveSyncing = this.liveSyncProcessesInfo[projectData.projectDir] && !this.liveSyncProcessesInfo[projectData.projectDir].isStopped;

		// Prevent cases where liveSync is called consecutive times with the same device, for example [ A, B, C ] and then [ A, B, D ] - we want to execute initialSync only for D.
		const deviceDescriptorsForInitialSync = isAlreadyLiveSyncing ? _.differenceBy(deviceDescriptors, this.liveSyncProcessesInfo[projectData.projectDir].deviceDescriptors, deviceDescriptorPrimaryKey) : deviceDescriptors;
		this.setLiveSyncProcessInfo(liveSyncData.projectDir, deviceDescriptors);

		await this.initialSync(projectData, deviceDescriptorsForInitialSync, liveSyncData);

		if (!liveSyncData.skipWatcher && this.liveSyncProcessesInfo[projectData.projectDir].deviceDescriptors.length) {
			// Should be set after prepare
			this.$injector.resolve<DeprecatedUsbLiveSyncService>("usbLiveSyncService").isInitialized = true;

			await this.startWatcher(projectData, liveSyncData);
		}
	}

	private setLiveSyncProcessInfo(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[]): void {
		this.liveSyncProcessesInfo[projectDir] = this.liveSyncProcessesInfo[projectDir] || Object.create(null);
		this.liveSyncProcessesInfo[projectDir].actionsChain = this.liveSyncProcessesInfo[projectDir].actionsChain || Promise.resolve();
		this.liveSyncProcessesInfo[projectDir].isStopped = false;

		const currentDeviceDescriptors = this.liveSyncProcessesInfo[projectDir].deviceDescriptors || [];
		this.liveSyncProcessesInfo[projectDir].deviceDescriptors = _.uniqBy(currentDeviceDescriptors.concat(deviceDescriptors), deviceDescriptorPrimaryKey);
	}

	private getLiveSyncService(platform: string): IPlatformLiveSyncService {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return this.$injector.resolve("iOSLiveSyncService");
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return this.$injector.resolve("androidLiveSyncService");
		}

		throw new Error(`Invalid platform ${platform}. Supported platforms are: ${this.$mobileHelper.platformNames.join(", ")}`);
	}

	private async ensureLatestAppPackageIsInstalledOnDevice(options: IEnsureLatestAppPackageIsInstalledOnDeviceOptions, nativePrepare?: INativePrepare): Promise<IAppInstalledOnDeviceResult> {
		const platform = options.device.deviceInfo.platform;
		const appInstalledOnDeviceResult: IAppInstalledOnDeviceResult = { appInstalled: false };
		if (options.preparedPlatforms.indexOf(platform) === -1) {
			options.preparedPlatforms.push(platform);
			// TODO: Pass provision and sdk as a fifth argument here
			await this.$platformService.preparePlatform(platform, {
				bundle: false,
				release: false,
			}, null, options.projectData, <any>{}, options.modifiedFiles, nativePrepare);
		}

		const buildResult = await this.installedCachedAppPackage(platform, options);
		if (buildResult) {
			appInstalledOnDeviceResult.appInstalled = true;
			return appInstalledOnDeviceResult;
		}

		// TODO: Pass provision and sdk as a fifth argument here
		const shouldBuild = await this.$platformService.shouldBuild(platform, options.projectData, <any>{ buildForDevice: !options.device.isEmulator, clean: options.liveSyncData && options.liveSyncData.clean }, options.deviceBuildInfoDescriptor.outputPath);
		let pathToBuildItem = null;
		let action = LiveSyncTrackActionNames.LIVESYNC_OPERATION;
		if (shouldBuild) {
			pathToBuildItem = await options.deviceBuildInfoDescriptor.buildAction();
			options.rebuiltInformation.push({ isEmulator: options.device.isEmulator, platform, pathToBuildItem });
			action = LiveSyncTrackActionNames.LIVESYNC_OPERATION_BUILD;
		}

		await this.trackAction(action, platform, options);

		const shouldInstall = await this.$platformService.shouldInstall(options.device, options.projectData, options.deviceBuildInfoDescriptor.outputPath);
		if (shouldInstall) {
			await this.$platformService.installApplication(options.device, { release: false }, options.projectData, pathToBuildItem, options.deviceBuildInfoDescriptor.outputPath);
			appInstalledOnDeviceResult.appInstalled = true;
		}

		return appInstalledOnDeviceResult;
	}

	private async trackAction(action: string, platform: string, options: IEnsureLatestAppPackageIsInstalledOnDeviceOptions): Promise<void> {
		if (!options.settings[platform][options.device.deviceInfo.type]) {
			let isForDevice = !options.device.isEmulator;
			options.settings[platform][options.device.deviceInfo.type] = true;
			if (this.$mobileHelper.isAndroidPlatform(platform)) {
				options.settings[platform][DeviceTypes.Emulator] = true;
				options.settings[platform][DeviceTypes.Device] = true;
				isForDevice = null;
			}

			await this.$platformService.trackActionForPlatform({ action, platform, isForDevice });
		}

		await this.$platformService.trackActionForPlatform({ action: LiveSyncTrackActionNames.DEVICE_INFO, platform, isForDevice: !options.device.isEmulator, deviceOsVersion: options.device.deviceInfo.version });
	}

	private async installedCachedAppPackage(platform: string, options: IEnsureLatestAppPackageIsInstalledOnDeviceOptions): Promise<any> {
		const rebuildInfo = _.find(options.rebuiltInformation, info => info.isEmulator === options.device.isEmulator && info.platform === platform);

		if (rebuildInfo) {
			// Case where we have three devices attached, a change that requires build is found,
			// we'll rebuild the app only for the first device, but we should install new package on all three devices.
			await this.$platformService.installApplication(options.device, { release: false }, options.projectData, rebuildInfo.pathToBuildItem, options.deviceBuildInfoDescriptor.outputPath);
			return rebuildInfo.pathToBuildItem;
		}

		return null;
	}

	private async initialSync(projectData: IProjectData, deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void> {
		const preparedPlatforms: string[] = [];
		const rebuiltInformation: ILiveSyncBuildInfo[] = [];

		const settings = this.getDefaultLatestAppPackageInstalledSettings();
		// Now fullSync
		const deviceAction = async (device: Mobile.IDevice): Promise<void> => {
			try {
				const platform = device.deviceInfo.platform;
				const deviceBuildInfoDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);

				await this.ensureLatestAppPackageIsInstalledOnDevice({
					device,
					preparedPlatforms,
					rebuiltInformation,
					projectData,
					deviceBuildInfoDescriptor,
					liveSyncData,
					settings
				}, { skipNativePrepare: deviceBuildInfoDescriptor.skipNativePrepare });

				const liveSyncResultInfo = await this.getLiveSyncService(platform).fullSync({
					projectData, device,
					syncAllFiles: liveSyncData.watchAllFiles,
					useLiveEdit: liveSyncData.useLiveEdit,
					watch: !liveSyncData.skipWatcher
				});
				await this.$platformService.trackActionForPlatform({ action: "LiveSync", platform: device.deviceInfo.platform, isForDevice: !device.isEmulator, deviceOsVersion: device.deviceInfo.version });
				await this.refreshApplication(projectData, liveSyncResultInfo);

				this.emit(LiveSyncEvents.liveSyncStarted, {
					projectDir: projectData.projectDir,
					deviceIdentifier: device.deviceInfo.identifier,
					applicationIdentifier: projectData.projectId
				});
			} catch (err) {
				this.$logger.warn(`Unable to apply changes on device: ${device.deviceInfo.identifier}. Error is: ${err.message}.`);

				this.emit(LiveSyncEvents.liveSyncError, {
					error: err,
					deviceIdentifier: device.deviceInfo.identifier,
					projectDir: projectData.projectDir,
					applicationIdentifier: projectData.projectId
				});

				await this.stopLiveSync(projectData.projectDir, [device.deviceInfo.identifier], { shouldAwaitAllActions: false });
			}
		};

		// Execute the action only on the deviceDescriptors passed to initialSync.
		// In case where we add deviceDescriptors to already running application, we've already executed initialSync for them.
		await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier)));
	}

	private getDefaultLatestAppPackageInstalledSettings(): ILatestAppPackageInstalledSettings {
		return {
			[this.$devicePlatformsConstants.Android]: {
				[DeviceTypes.Device]: false,
				[DeviceTypes.Emulator]: false
			},
			[this.$devicePlatformsConstants.iOS]: {
				[DeviceTypes.Device]: false,
				[DeviceTypes.Emulator]: false
			}
		};
	}

	private async startWatcher(projectData: IProjectData, liveSyncData: ILiveSyncInfo): Promise<void> {
		let pattern = [APP_FOLDER_NAME];

		if (liveSyncData.watchAllFiles) {
			const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);
			pattern.push(PACKAGE_JSON_FILE_NAME);

			// watch only production node_module/packages same one prepare uses
			for (let index in productionDependencies) {
				pattern.push(productionDependencies[index].directory);
			}
		}

		const currentWatcherInfo = this.liveSyncProcessesInfo[liveSyncData.projectDir].watcherInfo;

		if (!currentWatcherInfo || currentWatcherInfo.pattern !== pattern) {
			if (currentWatcherInfo) {
				currentWatcherInfo.watcher.close();
			}

			let filesToSync: string[] = [],
				filesToRemove: string[] = [];
			let timeoutTimer: NodeJS.Timer;

			const startTimeout = () => {
				timeoutTimer = setTimeout(async () => {
					// Push actions to the queue, do not start them simultaneously
					await this.addActionToChain(projectData.projectDir, async () => {
						if (filesToSync.length || filesToRemove.length) {
							try {
								let currentFilesToSync = _.cloneDeep(filesToSync);
								filesToSync = [];

								let currentFilesToRemove = _.cloneDeep(filesToRemove);
								filesToRemove = [];

								const allModifiedFiles = [].concat(currentFilesToSync).concat(currentFilesToRemove);
								const preparedPlatforms: string[] = [];
								const rebuiltInformation: ILiveSyncBuildInfo[] = [];

								const latestAppPackageInstalledSettings = this.getDefaultLatestAppPackageInstalledSettings();

								await this.$devicesService.execute(async (device: Mobile.IDevice) => {
									const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
									const deviceBuildInfoDescriptor = _.find(liveSyncProcessInfo.deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);

									const appInstalledOnDeviceResult = await this.ensureLatestAppPackageIsInstalledOnDevice({
										device,
										preparedPlatforms,
										rebuiltInformation,
										projectData,
										deviceBuildInfoDescriptor,
										settings: latestAppPackageInstalledSettings,
										modifiedFiles: allModifiedFiles
									}, { skipNativePrepare: deviceBuildInfoDescriptor.skipNativePrepare });

									const service = this.getLiveSyncService(device.deviceInfo.platform);
									const settings: ILiveSyncWatchInfo = {
										projectData,
										filesToRemove: currentFilesToRemove,
										filesToSync: currentFilesToSync,
										isReinstalled: appInstalledOnDeviceResult.appInstalled,
										syncAllFiles: liveSyncData.watchAllFiles,
										useLiveEdit: liveSyncData.useLiveEdit
									};

									const liveSyncResultInfo = await service.liveSyncWatchAction(device, settings);
									await this.refreshApplication(projectData, liveSyncResultInfo);
								},
									(device: Mobile.IDevice) => {
										const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
										return liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
									}
								);
							} catch (err) {
								const allErrors = (<Mobile.IDevicesOperationError>err).allErrors;

								if (allErrors && _.isArray(allErrors)) {
									for (let deviceError of allErrors) {
										this.$logger.warn(`Unable to apply changes for device: ${deviceError.deviceIdentifier}. Error is: ${deviceError.message}.`);

										this.emit(LiveSyncEvents.liveSyncError, {
											error: deviceError,
											deviceIdentifier: deviceError.deviceIdentifier,
											projectDir: projectData.projectDir,
											applicationIdentifier: projectData.projectId
										});

										await this.stopLiveSync(projectData.projectDir, [deviceError.deviceIdentifier], { shouldAwaitAllActions: false });
									}
								}
							}
						}
					});
				}, 250);

				this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;
			};

			await this.$hooksService.executeBeforeHooks('watch', {
				hookArgs: {
					projectData
				}
			});

			const watcherOptions: choki.WatchOptions = {
				ignoreInitial: true,
				cwd: liveSyncData.projectDir,
				awaitWriteFinish: {
					pollInterval: 100,
					stabilityThreshold: 500
				},
				ignored: ["**/.*", ".*"] // hidden files
			};

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

					// Do not sync typescript files directly - wait for javascript changes to occur in order to restart the app only once
					if (path.extname(filePath) !== FileExtensions.TYPESCRIPT_FILE) {
						startTimeout();
					}
				});

			this.liveSyncProcessesInfo[liveSyncData.projectDir].watcherInfo = { watcher, pattern };
			this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;

			this.$processService.attachToProcessExitSignals(this, () => {
				_.keys(this.liveSyncProcessesInfo).forEach(projectDir => {
					// Do not await here, we are in process exit's handler.
					this.stopLiveSync(projectDir);
				});
			});

			this.$devicesService.on("deviceLost", async (device: Mobile.IDevice) => {
				await this.stopLiveSync(projectData.projectDir, [device.deviceInfo.identifier]);
			});
		}
	}

	private async addActionToChain<T>(projectDir: string, action: () => Promise<T>): Promise<T> {
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
