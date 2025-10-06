import { HmrConstants, DeviceDiscoveryEventNames } from "../common/constants";
import {
	PREPARE_READY_EVENT_NAME,
	TrackActionNames,
	DEBUGGER_DETACHED_EVENT_NAME,
	RunOnDeviceEvents,
	USER_INTERACTION_NEEDED_EVENT_NAME,
} from "../constants";
import { cache, performanceLog } from "../common/decorators";
import { EventEmitter } from "events";
import * as util from "util";
import * as _ from "lodash";
import { IProjectDataService, IProjectData } from "../definitions/project";
import { IBuildController } from "../definitions/build";
import { IPlatformData, IPlatformsDataService } from "../definitions/platform";
import { IDebugController } from "../definitions/debug";
import { IPluginsService } from "../definitions/plugins";
import {
	IAnalyticsService,
	IErrors,
	IHooksService,
	IDictionary,
} from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { hook } from "../common/helpers";

export class RunController extends EventEmitter implements IRunController {
	private prepareReadyEventHandler: any = null;

	constructor(
		protected $analyticsService: IAnalyticsService,
		private $buildController: IBuildController,
		private $debugController: IDebugController,
		private $deviceInstallAppService: IDeviceInstallAppService,
		protected $devicesService: Mobile.IDevicesService,
		protected $errors: IErrors,
		protected $injector: IInjector,
		private $hmrStatusService: IHmrStatusService,
		public $hooksService: IHooksService,
		private $liveSyncServiceResolver: ILiveSyncServiceResolver,
		private $liveSyncProcessDataService: ILiveSyncProcessDataService,
		protected $logger: ILogger,
		protected $mobileHelper: Mobile.IMobileHelper,
		private $platformsDataService: IPlatformsDataService,
		private $pluginsService: IPluginsService,
		private $prepareController: IPrepareController,
		private $prepareDataService: IPrepareDataService,
		private $prepareNativePlatformService: IPrepareNativePlatformService,
		private $projectChangesService: IProjectChangesService,
		protected $projectDataService: IProjectDataService,
	) {
		super();
	}

	public async run(runData: IRunData): Promise<void> {
		const { liveSyncInfo, deviceDescriptors } = runData;
		const { projectDir } = liveSyncInfo;

		const projectData = this.$projectDataService.getProjectData(projectDir);
		await this.initializeSetup(projectData);

		const deviceDescriptorsForInitialSync =
			this.getDeviceDescriptorsForInitialSync(projectDir, deviceDescriptors);
		const newPlatforms =
			this.$devicesService.getPlatformsFromDeviceDescriptors(deviceDescriptors);
		const oldPlatforms =
			this.$liveSyncProcessDataService.getPlatforms(projectDir);
		const platforms = _.uniq(_.concat(newPlatforms, oldPlatforms));

		this.$liveSyncProcessDataService.persistData(
			projectDir,
			deviceDescriptors,
			platforms,
		);

		const shouldStartWatcher =
			!liveSyncInfo.skipWatcher &&
			this.$liveSyncProcessDataService.hasDeviceDescriptors(projectDir);
		if (shouldStartWatcher && liveSyncInfo.useHotModuleReload) {
			this.$hmrStatusService.attachToHmrStatusEvent();
		}

		if (!this.prepareReadyEventHandler) {
			const handler = async (data: IFilesChangeEventData) => {
				if (data.hasNativeChanges) {
					const platformData = this.$platformsDataService.getPlatformData(
						data.platform,
						projectData,
					);
					const prepareData = this.$prepareDataService.getPrepareData(
						liveSyncInfo.projectDir,
						data.platform,
						{ ...liveSyncInfo, watch: !liveSyncInfo.skipWatcher },
					);
					const changesInfo = await this.$projectChangesService.checkForChanges(
						platformData,
						projectData,
						prepareData,
					);
					if (changesInfo.hasChanges) {
						await this.syncChangedDataOnDevices(
							data,
							projectData,
							platformData,
							liveSyncInfo,
						);
					}
				} else {
					const platformData = this.$platformsDataService.getPlatformData(
						data.platform,
						projectData
					);
					await this.syncChangedDataOnDevices(
						data,
						projectData,
						platformData,
						liveSyncInfo
					);
				}
			};

			this.prepareReadyEventHandler = handler.bind(this);
			this.$prepareController.on(
				PREPARE_READY_EVENT_NAME,
				this.prepareReadyEventHandler,
			);
		}
		await this.syncInitialDataOnDevices(
			projectData,
			liveSyncInfo,
			deviceDescriptorsForInitialSync,
		);

		this.attachDeviceLostHandler();
	}

	public async stop(data: IStopRunData): Promise<void> {
		const { projectDir, deviceIdentifiers, stopOptions } = data;
		const liveSyncProcessInfo =
			this.$liveSyncProcessDataService.getPersistedData(projectDir);
		if (liveSyncProcessInfo && !liveSyncProcessInfo.isStopped) {
			// In case we are coming from error during livesync, the current action is the one that erred (but we are still executing it),
			// so we cannot await it as this will cause infinite loop.
			const shouldAwaitPendingOperation =
				!stopOptions || stopOptions.shouldAwaitAllActions;

			const deviceIdentifiersToRemove =
				deviceIdentifiers && deviceIdentifiers.length
					? deviceIdentifiers
					: _.map(liveSyncProcessInfo.deviceDescriptors, (d) => d.identifier);

			const removedDeviceIdentifiers = _.remove(
				liveSyncProcessInfo.deviceDescriptors,
				(descriptor) =>
					_.includes(deviceIdentifiersToRemove, descriptor.identifier),
			).map((descriptor) => descriptor.identifier);

			// Handle the case when no more devices left for any of the persisted platforms

			for (let i = 0; i < liveSyncProcessInfo.platforms.length; i++) {
				const platform = liveSyncProcessInfo.platforms[i];
				const devices = this.$devicesService.getDevicesForPlatform(platform);
				if (!devices || !devices.length) {
					await this.$prepareController.stopWatchers(projectDir, platform);
				}
			}

			// In case deviceIdentifiers are not passed, we should stop the whole LiveSync.
			if (
				!deviceIdentifiers ||
				!deviceIdentifiers.length ||
				!liveSyncProcessInfo.deviceDescriptors ||
				!liveSyncProcessInfo.deviceDescriptors.length
			) {
				if (liveSyncProcessInfo.timer) {
					clearTimeout(liveSyncProcessInfo.timer as unknown as number);
				}

				for (let k = 0; k < liveSyncProcessInfo.platforms.length; k++) {
					await this.$prepareController.stopWatchers(
						projectDir,
						liveSyncProcessInfo.platforms[k],
					);
				}

				liveSyncProcessInfo.isStopped = true;

				if (liveSyncProcessInfo.actionsChain && shouldAwaitPendingOperation) {
					await liveSyncProcessInfo.actionsChain;
				}

				liveSyncProcessInfo.deviceDescriptors = [];

				if (this.prepareReadyEventHandler) {
					this.$prepareController.removeListener(
						PREPARE_READY_EVENT_NAME,
						this.prepareReadyEventHandler,
					);
					this.prepareReadyEventHandler = null;
				}

				const projectData = this.$projectDataService.getProjectData(projectDir);
				await this.$hooksService.executeAfterHooks("watch", {
					hookArgs: {
						projectData,
					},
				});
			} else if (
				liveSyncProcessInfo.currentSyncAction &&
				shouldAwaitPendingOperation
			) {
				await liveSyncProcessInfo.currentSyncAction;
			}

			// Emit RunOnDevice stopped when we've really stopped.
			_.each(removedDeviceIdentifiers, (deviceIdentifier) => {
				this.emitCore(RunOnDeviceEvents.runOnDeviceStopped, {
					projectDir,
					deviceIdentifier,
					keepProcessAlive: stopOptions?.keepProcessAlive,
				});
			});

			if (stopOptions?.keepProcessAlive) {
				this.removeAllListeners(RunOnDeviceEvents.runOnDeviceStopped);
			}
		}
	}

	public getDeviceDescriptors(data: {
		projectDir: string;
	}): ILiveSyncDeviceDescriptor[] {
		return this.$liveSyncProcessDataService.getDeviceDescriptors(
			data.projectDir,
		);
	}

	protected async refreshApplication(
		projectData: IProjectData,
		liveSyncResultInfo: ILiveSyncResultInfo,
		filesChangeEventData: IFilesChangeEventData,
		deviceDescriptor: ILiveSyncDeviceDescriptor,
		fullSyncAction?: () => Promise<void>,
	): Promise<IRestartApplicationInfo> {
		const result = deviceDescriptor.debuggingEnabled
			? await this.refreshApplicationWithDebug(
					projectData,
					liveSyncResultInfo,
					filesChangeEventData,
					deviceDescriptor,
				)
			: await this.refreshApplicationWithoutDebug(
					projectData,
					liveSyncResultInfo,
					filesChangeEventData,
					deviceDescriptor,
					undefined,
					fullSyncAction,
				);

		const device = liveSyncResultInfo.deviceAppData.device;

		this.emitCore(RunOnDeviceEvents.runOnDeviceExecuted, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier:
				projectData.projectIdentifiers[
					device.deviceInfo.platform.toLowerCase()
				],
			syncedFiles: liveSyncResultInfo.modifiedFilesData.map((m) =>
				m.getLocalPath(),
			),
			isFullSync: liveSyncResultInfo.isFullSync,
		});

		return result;
	}

	protected async refreshApplicationWithDebug(
		projectData: IProjectData,
		liveSyncResultInfo: ILiveSyncResultInfo,
		filesChangeEventData: IFilesChangeEventData,
		deviceDescriptor: ILiveSyncDeviceDescriptor,
	): Promise<IRestartApplicationInfo> {
		const debugOptions = deviceDescriptor.debugOptions || {};

		liveSyncResultInfo.waitForDebugger = !!debugOptions.debugBrk;
		liveSyncResultInfo.forceRefreshWithSocket = true;

		const refreshInfo = await this.refreshApplicationWithoutDebug(
			projectData,
			liveSyncResultInfo,
			filesChangeEventData,
			deviceDescriptor,
			{
				shouldSkipEmitLiveSyncNotification: true,
				shouldCheckDeveloperDiscImage: true,
			},
		);

		// we do not stop the application when debugBrk is false, so we need to attach, instead of launch
		// if we try to send the launch request, the debugger port will not be printed and the command will timeout
		debugOptions.start = !debugOptions.debugBrk;
		debugOptions.forceDebuggerAttachedEvent = refreshInfo.didRestart;

		await this.$debugController.enableDebuggingCoreWithoutWaitingCurrentAction(
			projectData.projectDir,
			deviceDescriptor.identifier,
			debugOptions,
		);

		return refreshInfo;
	}

	@performanceLog()
	protected async refreshApplicationWithoutDebug(
		projectData: IProjectData,
		liveSyncResultInfo: ILiveSyncResultInfo,
		filesChangeEventData: IFilesChangeEventData,
		deviceDescriptor: ILiveSyncDeviceDescriptor,
		settings?: IRefreshApplicationSettings,
		fullSyncAction?: () => Promise<void>,
	): Promise<IRestartApplicationInfo> {
		const result = { didRestart: false };
		const platform = liveSyncResultInfo.deviceAppData.platform;
		const applicationIdentifier =
			projectData.projectIdentifiers[platform.toLowerCase()];
		const platformLiveSyncService =
			this.$liveSyncServiceResolver.resolveLiveSyncService(platform);

		try {
			const isFullSync =
				filesChangeEventData &&
				(filesChangeEventData.hasNativeChanges ||
					!filesChangeEventData.hasOnlyHotUpdateFiles);
			let shouldRestart = isFullSync;
			if (!shouldRestart) {
				shouldRestart = await platformLiveSyncService.shouldRestart(
					projectData,
					liveSyncResultInfo,
				);
			}

			if (!shouldRestart) {
				shouldRestart = !(await platformLiveSyncService.tryRefreshApplication(
					projectData,
					liveSyncResultInfo,
				));
			}

			if (!isFullSync && shouldRestart && fullSyncAction) {
				this.$logger.trace(
					`Syncing all files as the current app state does not support hot updates.`,
				);
				liveSyncResultInfo.didRecover = true;
				await fullSyncAction();
			}

			if (shouldRestart) {
				this.emit(DEBUGGER_DETACHED_EVENT_NAME, {
					deviceIdentifier:
						liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
				});
				await platformLiveSyncService.restartApplication(
					projectData,
					liveSyncResultInfo,
				);
				result.didRestart = true;
			}
		} catch (err) {
			this.$logger.info(
				`Error while trying to start application ${applicationIdentifier} on device ${
					liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier
				}. Error is: ${err.message || err}`,
			);
			const msg = `Unable to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
			this.$logger.warn(msg);

			const device = liveSyncResultInfo.deviceAppData.device;
			const deviceIdentifier = device.deviceInfo.identifier;

			if (!settings || !settings.shouldSkipEmitLiveSyncNotification) {
				this.emitCore(RunOnDeviceEvents.runOnDeviceNotification, {
					projectDir: projectData.projectDir,
					deviceIdentifier: device.deviceInfo.identifier,
					applicationIdentifier:
						projectData.projectIdentifiers[
							device.deviceInfo.platform.toLowerCase()
						],
					notification: msg,
				});
			}

			if (
				settings &&
				settings.shouldCheckDeveloperDiscImage &&
				(err.message || err) === "Could not find developer disk image"
			) {
				const attachDebuggerOptions: IAttachDebuggerData = {
					platform: device.deviceInfo.platform,
					isEmulator: device.isEmulator,
					projectDir: projectData.projectDir,
					deviceIdentifier,
					debugOptions: deviceDescriptor.debugOptions,
					outputPath: deviceDescriptor.buildData.outputPath,
				};
				this.emit(USER_INTERACTION_NEEDED_EVENT_NAME, attachDebuggerOptions);
			}
		}

		return result;
	}

	private getDeviceDescriptorsForInitialSync(
		projectDir: string,
		deviceDescriptors: ILiveSyncDeviceDescriptor[],
	) {
		const currentRunData =
			this.$liveSyncProcessDataService.getPersistedData(projectDir);
		const isAlreadyLiveSyncing = currentRunData && !currentRunData.isStopped;
		// Prevent cases where liveSync is called consecutive times with the same device, for example [ A, B, C ] and then [ A, B, D ] - we want to execute initialSync only for D.
		const deviceDescriptorsForInitialSync = isAlreadyLiveSyncing
			? _.differenceBy(
					deviceDescriptors,
					currentRunData.deviceDescriptors,
					"identifier",
				)
			: deviceDescriptors;

		return deviceDescriptorsForInitialSync;
	}

	private async initializeSetup(projectData: IProjectData): Promise<void> {
		try {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		} catch (err) {
			this.$logger.trace(err);
			this.$errors.fail(
				`Unable to install dependencies. Make sure your package.json is valid and all dependencies are correct. Error is: ${err.message}`,
			);
		}
	}

	@cache()
	private attachDeviceLostHandler(): void {
		this.$devicesService.on(
			DeviceDiscoveryEventNames.DEVICE_LOST,
			async (device: Mobile.IDevice) => {
				this.$logger.trace(
					`Received ${DeviceDiscoveryEventNames.DEVICE_LOST} event in LiveSync service for ${device.deviceInfo.identifier}. Will stop LiveSync operation for this device.`,
				);

				for (const projectDir in this.$liveSyncProcessDataService.getAllPersistedData()) {
					try {
						const deviceDescriptors = this.getDeviceDescriptors({ projectDir });
						if (
							_.find(
								deviceDescriptors,
								(d) => d.identifier === device.deviceInfo.identifier,
							)
						) {
							await this.stop({
								projectDir,
								deviceIdentifiers: [device.deviceInfo.identifier],
							});
						}
					} catch (err) {
						this.$logger.warn(
							`Unable to stop LiveSync operation for ${device.deviceInfo.identifier}.`,
							err,
						);
					}
				}
			},
		);
	}

	private async syncInitialDataOnDevices(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncInfo,
		deviceDescriptors: ILiveSyncDeviceDescriptor[],
	): Promise<void> {
		const rebuiltInformation: IDictionary<{
			platform: string;
			isEmulator: boolean;
		}> = {};

		const deviceAction = async (device: Mobile.IDevice) => {
			const deviceDescriptor = _.find(
				deviceDescriptors,
				(dd) => dd.identifier === device.deviceInfo.identifier,
			);
			const prepareData = this.$prepareDataService.getPrepareData(
				liveSyncInfo.projectDir,
				device.deviceInfo.platform,
				{
					...liveSyncInfo,
					...deviceDescriptor.buildData,
					nativePrepare: {
						skipNativePrepare: !!deviceDescriptor.skipNativePrepare,
					},
					watch: !liveSyncInfo.skipWatcher,
				},
			);

			const prepareResultData =
				await this.$prepareController.prepare(prepareData);

			const buildData = {
				...deviceDescriptor.buildData,
				buildForDevice: !device.isEmulator,
			};
			const platformData = this.$platformsDataService.getPlatformData(
				device.deviceInfo.platform,
				projectData,
			);

			try {
				// Case where we have three devices attached, a change that requires build is found,
				// we'll rebuild the app only for the first device, but we should install new package on all three devices.
				if (
					rebuiltInformation[platformData.platformNameLowerCase] &&
					(this.$mobileHelper.isAndroidPlatform(
						platformData.platformNameLowerCase,
					) ||
						rebuiltInformation[platformData.platformNameLowerCase]
							.isEmulator === device.isEmulator)
				) {
					await this.$deviceInstallAppService.installOnDevice(
						device,
						buildData,
					);
				} else {
					const shouldBuild =
						prepareResultData.hasNativeChanges ||
						buildData.nativePrepare.forceRebuildNativeApp ||
						(await this.$buildController.shouldBuild(buildData));
					if (shouldBuild) {
						await deviceDescriptor.buildAction();
						rebuiltInformation[platformData.platformNameLowerCase] = {
							isEmulator: device.isEmulator,
							platform: platformData.platformNameLowerCase,
						};
					} else {
						await this.$analyticsService.trackEventActionInGoogleAnalytics({
							action: TrackActionNames.LiveSync,
							device,
							projectDir: projectData.projectDir,
						});
					}

					await this.$deviceInstallAppService.installOnDeviceIfNeeded(
						device,
						buildData,
					);
				}

				const platformLiveSyncService =
					this.$liveSyncServiceResolver.resolveLiveSyncService(
						platformData.platformNameLowerCase,
					);
				const { force, useHotModuleReload, skipWatcher } = liveSyncInfo;
				const liveSyncResultInfo = await platformLiveSyncService.fullSync({
					force,
					useHotModuleReload,
					projectData,
					device,
					watch: !skipWatcher,
					liveSyncDeviceData: deviceDescriptor,
				});

				await this.refreshApplication(
					projectData,
					liveSyncResultInfo,
					null,
					deviceDescriptor,
				);

				this.$logger.info(
					`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`,
				);

				this.emitCore(RunOnDeviceEvents.runOnDeviceStarted, {
					projectDir: projectData.projectDir,
					deviceIdentifier: device.deviceInfo.identifier,
					applicationIdentifier:
						projectData.projectIdentifiers[
							device.deviceInfo.platform.toLowerCase()
						],
				});
			} catch (err) {
				this.$logger.warn(
					`Unable to apply changes on device: ${device.deviceInfo.identifier}. Error is: ${err.message}.`,
				);
				this.$logger.trace(err);

				this.emitCore(RunOnDeviceEvents.runOnDeviceError, {
					projectDir: projectData.projectDir,
					deviceIdentifier: device.deviceInfo.identifier,
					applicationIdentifier:
						projectData.projectIdentifiers[
							device.deviceInfo.platform.toLowerCase()
						],
					error: err,
				});

				await this.stop({
					projectDir: projectData.projectDir,
					deviceIdentifiers: [device.deviceInfo.identifier],
					stopOptions: { shouldAwaitAllActions: false },
				});
			}
		};

		await this.addActionToChain(projectData.projectDir, () =>
			this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) =>
				_.some(
					deviceDescriptors,
					(deviceDescriptor) =>
						deviceDescriptor.identifier === device.deviceInfo.identifier,
				),
			),
		);
	}

	@hook("syncChangedDataOnDevices")
	private async syncChangedDataOnDevices(
		data: IFilesChangeEventData,
		projectData: IProjectData,
		platformData: IPlatformData,
		liveSyncInfo: ILiveSyncInfo,
	): Promise<void> {
		const successfullySyncedMessageFormat = `Successfully synced application %s on device %s.`;
		const rebuiltInformation: IDictionary<{
			packageFilePath: string;
			platform: string;
			isEmulator: boolean;
		}> = {};

		const deviceAction = async (device: Mobile.IDevice) => {
			const deviceDescriptors =
				this.$liveSyncProcessDataService.getDeviceDescriptors(
					projectData.projectDir,
				);
			const deviceDescriptor = _.find(
				deviceDescriptors,
				(dd) => dd.identifier === device.deviceInfo.identifier,
			);
			const platformData = this.$platformsDataService.getPlatformData(
				data.platform,
				projectData,
			);
			const prepareData = this.$prepareDataService.getPrepareData(
				liveSyncInfo.projectDir,
				device.deviceInfo.platform,
				{
					...liveSyncInfo,
					...deviceDescriptor.buildData,
					nativePrepare: {
						skipNativePrepare: !!deviceDescriptor.skipNativePrepare,
					},
					watch: !liveSyncInfo.skipWatcher,
				},
			);

			try {
				const platformLiveSyncService =
					this.$liveSyncServiceResolver.resolveLiveSyncService(
						device.deviceInfo.platform,
					);
				const allAppFiles = data.hmrData?.fallbackFiles?.length
					? data.hmrData.fallbackFiles
					: data.files;
				const filesToSync = data.hasOnlyHotUpdateFiles
					? data.files
					: allAppFiles;
				const watchInfo = {
					liveSyncDeviceData: deviceDescriptor,
					projectData,
					// todo: remove stale files once everything is stable
					// currently, watcher fires multiple times & may clean up unsynced files
					// filesToRemove: data.staleFiles ?? [],
					filesToRemove: [] as string[],
					filesToSync,
					hmrData: data.hmrData,
					useHotModuleReload: liveSyncInfo.useHotModuleReload,
					force: liveSyncInfo.force,
					connectTimeout: 1000,
				};
				const deviceAppData = await platformLiveSyncService.getAppData(
					_.merge({ device, watch: true }, watchInfo),
				);

				if (data.hasNativeChanges) {
					const rebuiltInfo =
						rebuiltInformation[platformData.platformNameLowerCase] &&
						(this.$mobileHelper.isAndroidPlatform(
							platformData.platformNameLowerCase,
						) ||
							rebuiltInformation[platformData.platformNameLowerCase]
								.isEmulator === device.isEmulator);
					if (!rebuiltInfo) {
						await this.$prepareNativePlatformService.prepareNativePlatform(
							platformData,
							projectData,
							prepareData,
						);
						await deviceDescriptor.buildAction();
						rebuiltInformation[platformData.platformNameLowerCase] = {
							isEmulator: device.isEmulator,
							platform: platformData.platformNameLowerCase,
							packageFilePath: null,
						};
					}

					await this.$deviceInstallAppService.installOnDevice(
						device,
						deviceDescriptor.buildData,
					//	rebuiltInformation[platformData.platformNameLowerCase]
					//		.packageFilePath,
					);
					await platformLiveSyncService.syncAfterInstall(device, watchInfo);
					await this.refreshApplication(
						projectData,
						{
							deviceAppData,
							modifiedFilesData: [],
							isFullSync: false,
							useHotModuleReload: liveSyncInfo.useHotModuleReload,
						},
						data,
						deviceDescriptor,
					);
					this.$logger.info(
						util.format(
							successfullySyncedMessageFormat,
							deviceAppData.appIdentifier,
							device.deviceInfo.identifier,
						),
					);
				} else {
					const isInHMRMode =
						liveSyncInfo.useHotModuleReload &&
						data.hmrData &&
						data.hmrData.hash;
					if (isInHMRMode) {
						this.$hmrStatusService.watchHmrStatus(
							device.deviceInfo.identifier,
							data.hmrData.hash,
						);
					}

					const watchAction = async (): Promise<void> => {
						const liveSyncResultInfo =
							await platformLiveSyncService.liveSyncWatchAction(
								device,
								watchInfo,
							);
						const fullSyncAction = async () => {
							watchInfo.filesToSync = allAppFiles;
							const fullLiveSyncResultInfo =
								await platformLiveSyncService.liveSyncWatchAction(
									device,
									watchInfo,
								);
							// IMPORTANT: keep the same instance as we rely on side effects
							_.assign(liveSyncResultInfo, fullLiveSyncResultInfo);
						};
						await this.$hooksService.executeBeforeHooks("watchAction", {
							hookArgs: {
								liveSyncResultInfo,
								filesToSync,
								allAppFiles,
								isInHMRMode,
								filesChangedEvent: data,
							},
						});

						await this.refreshApplication(
							projectData,
							liveSyncResultInfo,
							data,
							deviceDescriptor,
							fullSyncAction,
						);

						if (!liveSyncResultInfo.didRecover && isInHMRMode) {
							const status = await this.$hmrStatusService.getHmrStatus(
								device.deviceInfo.identifier,
								data.hmrData.hash,
							);

							// the timeout is assumed OK as the app could be blocked on a breakpoint
							if (status === HmrConstants.HMR_ERROR_STATUS) {
								await fullSyncAction();
								liveSyncResultInfo.isFullSync = true;
								await this.refreshApplication(
									projectData,
									liveSyncResultInfo,
									data,
									deviceDescriptor,
								);
							}
						}
						await this.$hooksService.executeAfterHooks("watchAction", {
							liveSyncResultInfo,
							filesToSync,
							allAppFiles,
							filesChangedEvent: data,
							isInHMRMode,
						});

						this.$logger.info(
							util.format(
								successfullySyncedMessageFormat,
								deviceAppData.appIdentifier,
								device.deviceInfo.identifier,
							),
						);
					};

					if (liveSyncInfo.useHotModuleReload) {
						try {
							this.$logger.trace(
								"Try executing watch action without any preparation of files.",
							);
							await watchAction();
							this.$logger.trace(
								"Successfully executed watch action without any preparation of files.",
							);
							return;
						} catch (err) {
							this.$logger.trace(
								`Error while trying to execute fast sync. Now we'll check the state of the app and we'll try to resurrect from the error. The error is: ${err}`,
							);
						}
					}

					await this.$deviceInstallAppService.installOnDeviceIfNeeded(
						device,
						deviceDescriptor.buildData,
					);
					watchInfo.connectTimeout = null;
					await watchAction();
				}
			} catch (err) {
				this.$logger.warn(
					`Unable to apply changes for device: ${
						device.deviceInfo.identifier
					}. Error is: ${err && err.message}.`,
				);

				this.emitCore(RunOnDeviceEvents.runOnDeviceError, {
					projectDir: projectData.projectDir,
					deviceIdentifier: device.deviceInfo.identifier,
					applicationIdentifier:
						projectData.projectIdentifiers[
							device.deviceInfo.platform.toLowerCase()
						],
					error: err,
				});

				await this.stop({
					projectDir: projectData.projectDir,
					deviceIdentifiers: [device.deviceInfo.identifier],
					stopOptions: { shouldAwaitAllActions: false },
				});
			}
		};

		await this.addActionToChain(projectData.projectDir, () =>
			this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) => {
				const liveSyncProcessInfo =
					this.$liveSyncProcessDataService.getPersistedData(
						projectData.projectDir,
					);
				return (
					data.platform.toLowerCase() ===
						device.deviceInfo.platform.toLowerCase() &&
					liveSyncProcessInfo &&
					_.some(
						liveSyncProcessInfo.deviceDescriptors,
						(deviceDescriptor) =>
							deviceDescriptor.identifier === device.deviceInfo.identifier,
					)
				);
			}),
		);
	}

	private async addActionToChain<T>(
		projectDir: string,
		action: () => Promise<T>,
	): Promise<T> {
		const liveSyncInfo =
			this.$liveSyncProcessDataService.getPersistedData(projectDir);
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

	private emitCore(event: string, data: ILiveSyncEventData): void {
		this.$logger.trace(`Will emit event ${event} with data`, data);
		this.emit(event, data);
	}
}
injector.register("runController", RunController);
