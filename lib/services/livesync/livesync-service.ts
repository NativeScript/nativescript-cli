// import * as path from "path";
// import * as choki from "chokidar";
import { EOL } from "os";
import { EventEmitter } from "events";
import { hook } from "../../common/helpers";
import {
	PACKAGE_JSON_FILE_NAME,
	USER_INTERACTION_NEEDED_EVENT_NAME,
	DEBUGGER_ATTACHED_EVENT_NAME,
	DEBUGGER_DETACHED_EVENT_NAME,
	TrackActionNames,
	LiveSyncEvents
} from "../../constants";
import { DeviceTypes, DeviceDiscoveryEventNames, HmrConstants } from "../../common/constants";
import { cache } from "../../common/decorators";
import { performanceLog } from "../../common/decorators";

const deviceDescriptorPrimaryKey = "identifier";

export class LiveSyncService extends EventEmitter implements IDebugLiveSyncService {
	// key is projectDir
	protected liveSyncProcessesInfo: IDictionary<ILiveSyncProcessInfo> = {};

	constructor(private $platformService: IPlatformService,
		private $projectDataService: IProjectDataService,
		private $devicesService: Mobile.IDevicesService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		private $logger: ILogger,
		private $hooksService: IHooksService,
		private $pluginsService: IPluginsService,
		private $debugService: IDebugService,
		private $errors: IErrors,
		private $debugDataService: IDebugDataService,
		private $analyticsService: IAnalyticsService,
		private $usbLiveSyncService: DeprecatedUsbLiveSyncService,
		private $previewAppLiveSyncService: IPreviewAppLiveSyncService,
		private $previewQrCodeService: IPreviewQrCodeService,
		private $previewSdkService: IPreviewSdkService,
		private $hmrStatusService: IHmrStatusService,
		private $injector: IInjector) {
		super();
	}

	public async liveSync(deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(liveSyncData.projectDir);
		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		await this.liveSyncOperation(deviceDescriptors, liveSyncData, projectData);
	}

	public async liveSyncToPreviewApp(data: IPreviewAppLiveSyncData): Promise<IQrCodeImageData> {
		this.attachToPreviewAppLiveSyncError();

		await this.liveSync([], {
			syncToPreviewApp: true,
			projectDir: data.projectDir,
			bundle: data.bundle,
			useHotModuleReload: data.useHotModuleReload,
			release: false,
			env: data.env,
		});

		const url = this.$previewSdkService.getQrCodeUrl({ projectDir: data.projectDir, useHotModuleReload: data.useHotModuleReload });
		const result = await this.$previewQrCodeService.getLiveSyncQrCode(url);
		return result;
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
					await this.$previewAppLiveSyncService.stopLiveSync();
					this.$previewAppLiveSyncService.removeAllListeners();
				}

				// Kill typescript watcher
				const projectData = this.$projectDataService.getProjectData(projectDir);
				await this.$hooksService.executeAfterHooks('watch', {
					hookArgs: {
						projectData
					}
				});

				// In case we are stopping the LiveSync we must set usbLiveSyncService.isInitialized to false,
				// as in case we execute nativescript-dev-typescript's before-prepare hook again in the same process, it MUST transpile the files.
				this.$usbLiveSyncService.isInitialized = false;
			} else if (liveSyncProcessInfo.currentSyncAction && shouldAwaitPendingOperation) {
				await liveSyncProcessInfo.currentSyncAction;
			}

			// Emit LiveSync stopped when we've really stopped.
			_.each(removedDeviceIdentifiers, deviceIdentifier => {
				this.emitLivesyncEvent(LiveSyncEvents.liveSyncStopped, { projectDir, deviceIdentifier });
			});
		}
	}

	public getLiveSyncDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[] {
		const liveSyncProcessesInfo = this.liveSyncProcessesInfo[projectDir] || <ILiveSyncProcessInfo>{};
		const currentDescriptors = liveSyncProcessesInfo.deviceDescriptors;
		return currentDescriptors || [];
	}

	private attachToPreviewAppLiveSyncError(): void {
		if (!this.$usbLiveSyncService.isInitialized) {
			this.$previewAppLiveSyncService.on(LiveSyncEvents.previewAppLiveSyncError, liveSyncData => {
				this.$logger.error(liveSyncData.error);
				this.emit(LiveSyncEvents.previewAppLiveSyncError, liveSyncData);
			});
		}
	}

	@performanceLog()
	private async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOpts?: IDebugOptions, outputPath?: string): Promise<IRestartApplicationInfo | IDebugInformation> {
		const deviceDescriptor = this.getDeviceDescriptor(liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier, projectData.projectDir);

		return deviceDescriptor && deviceDescriptor.debugggingEnabled ?
			this.refreshApplicationWithDebug(projectData, liveSyncResultInfo, debugOpts, outputPath) :
			this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOpts, outputPath);
	}

	private async refreshApplicationWithoutDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOpts?: IDebugOptions, outputPath?: string, settings?: IRefreshApplicationSettings): Promise<IRestartApplicationInfo> {
		const result = { didRestart: false };
		const platform = liveSyncResultInfo.deviceAppData.platform;
		const platformLiveSyncService = this.getLiveSyncService(platform);
		const applicationIdentifier = projectData.projectIdentifiers[platform.toLowerCase()];
		try {
			let shouldRestart = await platformLiveSyncService.shouldRestart(projectData, liveSyncResultInfo);
			if (!shouldRestart) {
				shouldRestart = !await platformLiveSyncService.tryRefreshApplication(projectData, liveSyncResultInfo);
			}

			if (shouldRestart) {
				const deviceIdentifier = liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier;
				this.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });
				await platformLiveSyncService.restartApplication(projectData, liveSyncResultInfo);
				result.didRestart = true;
			}
		} catch (err) {
			this.$logger.info(`Error while trying to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Error is: ${err.message || err}`);
			const msg = `Unable to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
			this.$logger.warn(msg);
			if (!settings || !settings.shouldSkipEmitLiveSyncNotification) {
				this.emitLivesyncEvent(LiveSyncEvents.liveSyncNotification, {
					projectDir: projectData.projectDir,
					applicationIdentifier,
					deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
					notification: msg
				});
			}

			if (settings && settings.shouldCheckDeveloperDiscImage) {
				this.handleDeveloperDiskImageError(err, liveSyncResultInfo, projectData, debugOpts, outputPath);
			}
		}

		this.emitLivesyncEvent(LiveSyncEvents.liveSyncExecuted, {
			projectDir: projectData.projectDir,
			applicationIdentifier,
			syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
			deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
			isFullSync: liveSyncResultInfo.isFullSync
		});

		return result;
	}

	@performanceLog()
	private async refreshApplicationWithDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOptions: IDebugOptions, outputPath?: string): Promise<IDebugInformation> {
		debugOptions = debugOptions || {};
		if (debugOptions.debugBrk) {
			liveSyncResultInfo.waitForDebugger = true;
		}

		const refreshInfo = await this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOptions, outputPath, { shouldSkipEmitLiveSyncNotification: true, shouldCheckDeveloperDiscImage: true });

		// we do not stop the application when debugBrk is false, so we need to attach, instead of launch
		// if we try to send the launch request, the debugger port will not be printed and the command will timeout
		debugOptions.start = !debugOptions.debugBrk;

		debugOptions.forceDebuggerAttachedEvent = refreshInfo.didRestart;
		const deviceOption = {
			deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
			debugOptions: debugOptions,
		};

		return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, { projectDir: projectData.projectDir });
	}

	private handleDeveloperDiskImageError(err: any, liveSyncResultInfo: ILiveSyncResultInfo, projectData: IProjectData, debugOpts: IDebugOptions, outputPath: string) {
		if ((err.message || err) === "Could not find developer disk image") {
			const deviceIdentifier = liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier;
			const attachDebuggerOptions: IAttachDebuggerOptions = {
				platform: liveSyncResultInfo.deviceAppData.device.deviceInfo.platform,
				isEmulator: liveSyncResultInfo.deviceAppData.device.isEmulator,
				projectDir: projectData.projectDir,
				deviceIdentifier,
				debugOptions: debugOpts,
				outputPath
			};
			this.emit(USER_INTERACTION_NEEDED_EVENT_NAME, attachDebuggerOptions);
		}
	}

	public async attachDebugger(settings: IAttachDebuggerOptions): Promise<IDebugInformation> {
		// Default values
		if (settings.debugOptions) {
			settings.debugOptions.chrome = settings.debugOptions.chrome === undefined ? true : settings.debugOptions.chrome;
			settings.debugOptions.start = settings.debugOptions.start === undefined ? true : settings.debugOptions.start;
		} else {
			settings.debugOptions = {
				chrome: true,
				start: true
			};
		}

		const projectData = this.$projectDataService.getProjectData(settings.projectDir);
		const debugData = this.$debugDataService.createDebugData(projectData, { device: settings.deviceIdentifier });

		// Of the properties below only `buildForDevice` and `release` are currently used.
		// Leaving the others with placeholder values so that they may not be forgotten in future implementations.
		const buildConfig = this.getInstallApplicationBuildConfig(settings.deviceIdentifier, settings.projectDir, { isEmulator: settings.isEmulator });
		debugData.pathToAppPackage = this.$platformService.lastOutputPath(settings.platform, buildConfig, projectData, settings.outputPath);
		const debugInfo = await this.$debugService.debug(debugData, settings.debugOptions);
		const result = this.printDebugInformation(debugInfo, settings.debugOptions.forceDebuggerAttachedEvent);
		return result;
	}

	public printDebugInformation(debugInformation: IDebugInformation, fireDebuggerAttachedEvent: boolean = true): IDebugInformation {
		if (!!debugInformation.url) {
			if (fireDebuggerAttachedEvent) {
				this.emit(DEBUGGER_ATTACHED_EVENT_NAME, debugInformation);
			}

			this.$logger.info(`To start debugging, open the following URL in Chrome:${EOL}${debugInformation.url}${EOL}`.cyan);
		}

		return debugInformation;
	}

	public enableDebugging(deviceOpts: IEnableDebuggingDeviceOptions[], debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<IDebugInformation>[] {
		return _.map(deviceOpts, d => this.enableDebuggingCore(d, debuggingAdditionalOptions));
	}

	private getDeviceDescriptor(deviceIdentifier: string, projectDir: string) {
		const deviceDescriptors = this.getLiveSyncDeviceDescriptors(projectDir);

		return _.find(deviceDescriptors, d => d.identifier === deviceIdentifier);
	}

	@performanceLog()
	private async enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption: IEnableDebuggingDeviceOptions, debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<IDebugInformation> {
		const currentDeviceDescriptor = this.getDeviceDescriptor(deviceOption.deviceIdentifier, debuggingAdditionalOptions.projectDir);
		if (!currentDeviceDescriptor) {
			this.$errors.failWithoutHelp(`Couldn't enable debugging for ${deviceOption.deviceIdentifier}`);
		}

		currentDeviceDescriptor.debugggingEnabled = true;
		currentDeviceDescriptor.debugOptions = deviceOption.debugOptions;
		const currentDeviceInstance = this.$devicesService.getDeviceByIdentifier(deviceOption.deviceIdentifier);
		const attachDebuggerOptions: IAttachDebuggerOptions = {
			deviceIdentifier: deviceOption.deviceIdentifier,
			isEmulator: currentDeviceInstance.isEmulator,
			outputPath: currentDeviceDescriptor.outputPath,
			platform: currentDeviceInstance.deviceInfo.platform,
			projectDir: debuggingAdditionalOptions.projectDir,
			debugOptions: deviceOption.debugOptions
		};

		let debugInformation: IDebugInformation;
		try {
			debugInformation = await this.attachDebugger(attachDebuggerOptions);
		} catch (err) {
			this.$logger.trace("Couldn't attach debugger, will modify options and try again.", err);
			attachDebuggerOptions.debugOptions.start = false;
			try {
				debugInformation = await this.attachDebugger(attachDebuggerOptions);
			} catch (innerErr) {
				this.$logger.trace("Couldn't attach debugger with modified options.", innerErr);
				throw err;
			}
		}

		return debugInformation;
	}

	private async enableDebuggingCore(deviceOption: IEnableDebuggingDeviceOptions, debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<IDebugInformation> {
		const liveSyncProcessInfo: ILiveSyncProcessInfo = this.liveSyncProcessesInfo[debuggingAdditionalOptions.projectDir];
		if (liveSyncProcessInfo && liveSyncProcessInfo.currentSyncAction) {
			await liveSyncProcessInfo.currentSyncAction;
		}

		return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, debuggingAdditionalOptions);
	}

	public disableDebugging(deviceOptions: IDisableDebuggingDeviceOptions[], debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<void>[] {
		return _.map(deviceOptions, d => this.disableDebuggingCore(d, debuggingAdditionalOptions));
	}

	@hook('watchPatterns')
	public async getWatcherPatterns(liveSyncData: ILiveSyncInfo, projectData: IProjectData, platforms: string[]): Promise<string[]> {
		// liveSyncData and platforms are used by plugins that make use of the watchPatterns hook
		// TODO: ignore getAppDirectoryRelativePath
		// TODO: watch platforms folder of node_modules e.g native source folders of nativescript plugins
		return [projectData.getAppDirectoryRelativePath(), projectData.getAppResourcesRelativeDirectoryPath()];
	}

	public async disableDebuggingCore(deviceOption: IDisableDebuggingDeviceOptions, debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<void> {
		const liveSyncProcessInfo = this.liveSyncProcessesInfo[debuggingAdditionalOptions.projectDir];
		if (liveSyncProcessInfo.currentSyncAction) {
			await liveSyncProcessInfo.currentSyncAction;
		}

		const currentDeviceDescriptor = this.getDeviceDescriptor(deviceOption.deviceIdentifier, debuggingAdditionalOptions.projectDir);
		if (currentDeviceDescriptor) {
			currentDeviceDescriptor.debugggingEnabled = false;
		} else {
			this.$errors.failWithoutHelp(`Couldn't disable debugging for ${deviceOption.deviceIdentifier}`);
		}

		const currentDevice = this.$devicesService.getDeviceByIdentifier(currentDeviceDescriptor.identifier);
		if (!currentDevice) {
			this.$errors.failWithoutHelp(`Couldn't disable debugging for ${deviceOption.deviceIdentifier}. Could not find device.`);
		}

		await this.$debugService.debugStop(currentDevice.deviceInfo.identifier);
		this.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier: currentDeviceDescriptor.identifier });
	}

	@hook("liveSync")
	private async liveSyncOperation(deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo, projectData: IProjectData): Promise<void> {
		let deviceDescriptorsForInitialSync: ILiveSyncDeviceInfo[] = [];

		if (liveSyncData.syncToPreviewApp) {
			await this.$previewAppLiveSyncService.initialize({
				projectDir: projectData.projectDir,
				bundle: liveSyncData.bundle,
				useHotModuleReload: liveSyncData.useHotModuleReload,
				env: liveSyncData.env
			});
		} else {
			// In case liveSync is called for a second time for the same projectDir.
			const isAlreadyLiveSyncing = this.liveSyncProcessesInfo[projectData.projectDir] && !this.liveSyncProcessesInfo[projectData.projectDir].isStopped;

			// Prevent cases where liveSync is called consecutive times with the same device, for example [ A, B, C ] and then [ A, B, D ] - we want to execute initialSync only for D.
			const currentlyRunningDeviceDescriptors = this.getLiveSyncDeviceDescriptors(projectData.projectDir);
			deviceDescriptorsForInitialSync = isAlreadyLiveSyncing ? _.differenceBy(deviceDescriptors, currentlyRunningDeviceDescriptors, deviceDescriptorPrimaryKey) : deviceDescriptors;
		}

		this.setLiveSyncProcessInfo(liveSyncData, deviceDescriptors);

		const shouldStartWatcher = !liveSyncData.skipWatcher && (liveSyncData.syncToPreviewApp || this.liveSyncProcessesInfo[projectData.projectDir].deviceDescriptors.length);
		if (shouldStartWatcher) {
			// Should be set after prepare
			this.$usbLiveSyncService.isInitialized = true;
			await this.startWatcher(projectData, liveSyncData, deviceDescriptors);
		}

		await this.initialSync(projectData, liveSyncData, deviceDescriptorsForInitialSync);
	}

	private setLiveSyncProcessInfo(liveSyncData: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): void {
		const { projectDir } = liveSyncData;
		this.liveSyncProcessesInfo[projectDir] = this.liveSyncProcessesInfo[projectDir] || Object.create(null);
		this.liveSyncProcessesInfo[projectDir].actionsChain = this.liveSyncProcessesInfo[projectDir].actionsChain || Promise.resolve();
		this.liveSyncProcessesInfo[projectDir].currentSyncAction = this.liveSyncProcessesInfo[projectDir].actionsChain;
		this.liveSyncProcessesInfo[projectDir].isStopped = false;
		this.liveSyncProcessesInfo[projectDir].syncToPreviewApp = liveSyncData.syncToPreviewApp;

		const currentDeviceDescriptors = this.getLiveSyncDeviceDescriptors(projectDir);
		this.liveSyncProcessesInfo[projectDir].deviceDescriptors = _.uniqBy(currentDeviceDescriptors.concat(deviceDescriptors), deviceDescriptorPrimaryKey);
	}

	private getLiveSyncService(platform: string): IPlatformLiveSyncService {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return this.$injector.resolve("iOSLiveSyncService");
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return this.$injector.resolve("androidLiveSyncService");
		}

		this.$errors.failWithoutHelp(`Invalid platform ${platform}. Supported platforms are: ${this.$mobileHelper.platformNames.join(", ")}`);
	}

	private async ensureLatestAppPackageIsInstalledOnDevice(options: IEnsureLatestAppPackageIsInstalledOnDeviceOptions, nativePrepare?: INativePrepare): Promise<IAppInstalledOnDeviceResult> {
		const platform = options.device.deviceInfo.platform;
		const appInstalledOnDeviceResult: IAppInstalledOnDeviceResult = { appInstalled: false };
		if (options.preparedPlatforms.indexOf(platform) === -1) {
			options.preparedPlatforms.push(platform);
		}

		const buildResult = await this.installedCachedAppPackage(platform, options);
		if (buildResult) {
			appInstalledOnDeviceResult.appInstalled = true;
			return appInstalledOnDeviceResult;
		}

		const shouldBuild = await this.$platformService.shouldBuild(platform,
			options.projectData,
			<any>{ buildForDevice: !options.device.isEmulator, clean: options.liveSyncData && options.liveSyncData.clean },
			options.deviceBuildInfoDescriptor.outputPath);
		let pathToBuildItem = null;
		if (shouldBuild) {
			pathToBuildItem = await options.deviceBuildInfoDescriptor.buildAction();
			options.rebuiltInformation.push({ isEmulator: options.device.isEmulator, platform, pathToBuildItem });
		} else {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.LiveSync,
				device: options.device,
				projectDir: options.projectData.projectDir
			});
		}

		await this.$platformService.validateInstall(options.device, options.projectData, options, options.deviceBuildInfoDescriptor.outputPath);
		const shouldInstall = await this.$platformService.shouldInstall(options.device, options.projectData, options, options.deviceBuildInfoDescriptor.outputPath);
		if (shouldInstall) {
			const buildConfig = this.getInstallApplicationBuildConfig(options.device.deviceInfo.identifier, options.projectData.projectDir, { isEmulator: options.device.isEmulator });
			await this.$platformService.installApplication(options.device, buildConfig, options.projectData, pathToBuildItem, options.deviceBuildInfoDescriptor.outputPath);
			appInstalledOnDeviceResult.appInstalled = true;
		}

		return appInstalledOnDeviceResult;
	}

	private async installedCachedAppPackage(platform: string, options: IEnsureLatestAppPackageIsInstalledOnDeviceOptions): Promise<any> {
		const rebuildInfo = _.find(options.rebuiltInformation, info => info.platform === platform && (this.$mobileHelper.isAndroidPlatform(platform) || info.isEmulator === options.device.isEmulator));

		if (rebuildInfo) {
			// Case where we have three devices attached, a change that requires build is found,
			// we'll rebuild the app only for the first device, but we should install new package on all three devices.
			const buildConfig = this.getInstallApplicationBuildConfig(options.device.deviceInfo.identifier, options.projectData.projectDir, { isEmulator: options.device.isEmulator });
			await this.$platformService.installApplication(options.device, buildConfig, options.projectData, rebuildInfo.pathToBuildItem, options.deviceBuildInfoDescriptor.outputPath);
			return rebuildInfo.pathToBuildItem;
		}

		return null;
	}

	private async initialSync(projectData: IProjectData, liveSyncData: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		if (!liveSyncData.syncToPreviewApp) {
			await this.initialCableSync(projectData, liveSyncData, deviceDescriptors);
		}
	}

	private async initialCableSync(projectData: IProjectData, liveSyncData: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const preparedPlatforms: string[] = [];
		const rebuiltInformation: ILiveSyncBuildInfo[] = [];

		const settings = this.getDefaultLatestAppPackageInstalledSettings();
		// Now fullSync
		const deviceAction = async (device: Mobile.IDevice): Promise<void> => {
			const platform = device.deviceInfo.platform;
			try {
				const platformLiveSyncService = this.getLiveSyncService(platform);

				const deviceBuildInfoDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);

				await this.ensureLatestAppPackageIsInstalledOnDevice({
					device,
					preparedPlatforms,
					rebuiltInformation,
					projectData,
					deviceBuildInfoDescriptor,
					liveSyncData,
					settings,
					bundle: liveSyncData.bundle,
					release: liveSyncData.release,
					env: liveSyncData.env
				}, { skipNativePrepare: deviceBuildInfoDescriptor.skipNativePrepare });

				const liveSyncResultInfo = await platformLiveSyncService.fullSync({
					projectData,
					device,
					syncAllFiles: liveSyncData.watchAllFiles,
					useHotModuleReload: liveSyncData.useHotModuleReload,
					watch: !liveSyncData.skipWatcher,
					force: liveSyncData.force,
					liveSyncDeviceInfo: deviceBuildInfoDescriptor
				});

				await this.refreshApplication(projectData, liveSyncResultInfo, deviceBuildInfoDescriptor.debugOptions, deviceBuildInfoDescriptor.outputPath);

				this.$logger.info(`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`);

				this.emitLivesyncEvent(LiveSyncEvents.liveSyncStarted, {
					projectDir: projectData.projectDir,
					deviceIdentifier: device.deviceInfo.identifier,
					applicationIdentifier: projectData.projectIdentifiers[platform.toLowerCase()]
				});
			} catch (err) {
				this.$logger.warn(`Unable to apply changes on device: ${device.deviceInfo.identifier}. Error is: ${err.message}.`);

				this.emitLivesyncEvent(LiveSyncEvents.liveSyncError, {
					error: err,
					deviceIdentifier: device.deviceInfo.identifier,
					projectDir: projectData.projectDir,
					applicationIdentifier: projectData.projectIdentifiers[platform.toLowerCase()]
				});

				await this.stopLiveSync(projectData.projectDir, [device.deviceInfo.identifier], { shouldAwaitAllActions: false });
			}
		};

		// Execute the action only on the deviceDescriptors passed to initialSync.
		// In case where we add deviceDescriptors to already running application, we've already executed initialSync for them.
		await this.addActionToChain(projectData.projectDir, () => this.$devicesService.execute(deviceAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier)));

		this.attachDeviceLostHandler();
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

	private async startWatcher(projectData: IProjectData, liveSyncData: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const devicesIds = deviceDescriptors.map(dd => dd.identifier);
		const devices = _.filter(this.$devicesService.getDeviceInstances(), device => _.includes(devicesIds, device.deviceInfo.identifier));
		const platforms = _(devices).map(device => device.deviceInfo.platform).uniq().value();
		const patterns = await this.getWatcherPatterns(liveSyncData, projectData, platforms);

		if (liveSyncData.useHotModuleReload) {
			this.$hmrStatusService.attachToHmrStatusEvent();
		}

		if (liveSyncData.watchAllFiles) {
			const productionDependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir);
			patterns.push(PACKAGE_JSON_FILE_NAME);

			// watch only production node_module/packages same one prepare uses
			for (const index in productionDependencies) {
				patterns.push(productionDependencies[index].directory);
			}
		}

		const currentWatcherInfo = this.liveSyncProcessesInfo[liveSyncData.projectDir].watcherInfo;
		const areWatcherPatternsDifferent = () => _.xor(currentWatcherInfo.patterns, patterns).length;
		if (!currentWatcherInfo || areWatcherPatternsDifferent()) {
			if (currentWatcherInfo) {
				currentWatcherInfo.watcher.close();
			}

			let filesToSync: string[] = [];
			const hmrData: IDictionary<IPlatformHmrData> = {};
			const filesToSyncMap: IDictionary<string[]> = {};
			let filesToRemove: string[] = [];
			let timeoutTimer: NodeJS.Timer;

			const startSyncFilesTimeout = (files: string[], platform?: string, opts?: { calledFromHook: boolean }) => {
				timeoutTimer = setTimeout(async () => {
					if (platform && liveSyncData.bundle) {
						filesToSync = filesToSyncMap[platform];
					}

					if (files) {
						filesToSync = files;
					}

					if ((filesToSync && filesToSync.length) || (filesToRemove && filesToRemove.length)) {
						console.log("============================== FILES_TO_SYNC ==================== ", filesToSync);
						const currentFilesToSync = _.cloneDeep(filesToSync);
						filesToSync.splice(0, filesToSync.length);

						const currentFilesToRemove = _.cloneDeep(filesToRemove);
						filesToRemove = [];

						if (liveSyncData.syncToPreviewApp) {
							await this.addActionToChain(projectData.projectDir, async () => {
								await this.$previewAppLiveSyncService.syncFiles({
									projectDir: projectData.projectDir,
									bundle: liveSyncData.bundle,
									useHotModuleReload: liveSyncData.useHotModuleReload,
									env: liveSyncData.env
								}, currentFilesToSync, currentFilesToRemove);
							});
						} else {
							// Push actions to the queue, do not start them simultaneously
							await this.addActionToChain(projectData.projectDir, async () => {
								try {
									const currentHmrData = _.cloneDeep(hmrData);

									const allModifiedFiles = [].concat(currentFilesToSync).concat(currentFilesToRemove);

									const preparedPlatforms: string[] = [];
									const rebuiltInformation: ILiveSyncBuildInfo[] = [];

									const latestAppPackageInstalledSettings = this.getDefaultLatestAppPackageInstalledSettings();

									await this.$devicesService.execute(async (device: Mobile.IDevice) => {
										const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
										const deviceBuildInfoDescriptor = _.find(liveSyncProcessInfo.deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
										const platformHmrData = (currentHmrData && currentHmrData[device.deviceInfo.platform]) || <any>{};

										const settings: ILiveSyncWatchInfo = {
											liveSyncDeviceInfo: deviceBuildInfoDescriptor,
											projectData,
											filesToRemove: currentFilesToRemove,
											filesToSync: currentFilesToSync,
											isReinstalled: false,
											syncAllFiles: liveSyncData.watchAllFiles,
											hmrData: platformHmrData,
											useHotModuleReload: liveSyncData.useHotModuleReload,
											force: liveSyncData.force,
											connectTimeout: 1000
										};

										const service = this.getLiveSyncService(device.deviceInfo.platform);

										const watchAction = async (watchInfo: ILiveSyncWatchInfo): Promise<void> => {
											const isInHMRMode = liveSyncData.useHotModuleReload && platformHmrData.hash;
											if (isInHMRMode) {
												this.$hmrStatusService.watchHmrStatus(device.deviceInfo.identifier, platformHmrData.hash);
											}

											let liveSyncResultInfo = await service.liveSyncWatchAction(device, watchInfo);

											await this.refreshApplication(projectData, liveSyncResultInfo, deviceBuildInfoDescriptor.debugOptions, deviceBuildInfoDescriptor.outputPath);

											// If didRecover is true, this means we were in ErrorActivity and fallback files were already transferred and app will be restarted.
											if (!liveSyncResultInfo.didRecover && isInHMRMode) {
												const status = await this.$hmrStatusService.getHmrStatus(device.deviceInfo.identifier, platformHmrData.hash);
												if (status === HmrConstants.HMR_ERROR_STATUS) {
													watchInfo.filesToSync = platformHmrData.fallbackFiles;
													liveSyncResultInfo = await service.liveSyncWatchAction(device, watchInfo);
													// We want to force a restart of the application.
													liveSyncResultInfo.isFullSync = true;
													await this.refreshApplication(projectData, liveSyncResultInfo, deviceBuildInfoDescriptor.debugOptions, deviceBuildInfoDescriptor.outputPath);
												}
											}

											this.$logger.info(`Successfully synced application ${liveSyncResultInfo.deviceAppData.appIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}.`);
										};

										if (liveSyncData.useHotModuleReload && opts && opts.calledFromHook) {
											try {
												this.$logger.trace("Try executing watch action without any preparation of files.");
												await watchAction(settings);
												this.$logger.trace("Successfully executed watch action without any preparation of files.");
												return;
											} catch (err) {
												this.$logger.trace(`Error while trying to execute fast sync. Now we'll check the state of the app and we'll try to resurrect from the error. The error is: ${err}`);
											}
										}

										const appInstalledOnDeviceResult = await this.ensureLatestAppPackageIsInstalledOnDevice({
											device,
											preparedPlatforms,
											rebuiltInformation,
											projectData,
											deviceBuildInfoDescriptor,
											// the clean option should be respected only during initial sync
											liveSyncData: _.assign({}, liveSyncData, { clean: false }),
											settings: latestAppPackageInstalledSettings,
											modifiedFiles: allModifiedFiles,
											filesToRemove: currentFilesToRemove,
											filesToSync: currentFilesToSync,
											bundle: liveSyncData.bundle,
											release: liveSyncData.release,
											env: liveSyncData.env,
											skipModulesNativeCheck: !liveSyncData.watchAllFiles
										}, { skipNativePrepare: deviceBuildInfoDescriptor.skipNativePrepare });

										settings.isReinstalled = appInstalledOnDeviceResult.appInstalled;
										settings.connectTimeout = null;

										if (liveSyncData.useHotModuleReload && appInstalledOnDeviceResult.appInstalled) {
											_.each(platformHmrData.fallbackFiles, fileToSync => currentFilesToSync.push(fileToSync));
										}

										await watchAction(settings);
									},
										(device: Mobile.IDevice) => {
											const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
											return (!platform || platform.toLowerCase() === device.deviceInfo.platform.toLowerCase()) && liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
										}
									);
								} catch (err) {
									const allErrors = (<Mobile.IDevicesOperationError>err).allErrors;

									if (allErrors && _.isArray(allErrors)) {
										for (const deviceError of allErrors) {
											this.$logger.warn(`Unable to apply changes for device: ${deviceError.deviceIdentifier}. Error is: ${deviceError.message}.`);
											const device = this.$devicesService.getDeviceByIdentifier(deviceError.deviceIdentifier);
											this.emitLivesyncEvent(LiveSyncEvents.liveSyncError, {
												error: deviceError,
												deviceIdentifier: deviceError.deviceIdentifier,
												projectDir: projectData.projectDir,
												applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()]
											});

											await this.stopLiveSync(projectData.projectDir, [deviceError.deviceIdentifier], { shouldAwaitAllActions: false });
										}
									}
								}
							});
						}
					}
				}, liveSyncData.useHotModuleReload ? 0 : 250);

				this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;
			};

			await this.$hooksService.executeBeforeHooks('watch', {
				hookArgs: {
					projectData,
					config: {
						env: liveSyncData.env,
						appFilesUpdaterOptions: {
							bundle: liveSyncData.bundle,
							release: liveSyncData.release,
							watchAllFiles: liveSyncData.watchAllFiles,
							useHotModuleReload: liveSyncData.useHotModuleReload
						},
						platforms
					},
					filesToSync,
					filesToSyncMap,
					hmrData,
					filesToRemove,
					// startSyncFilesTimeout: async (platform: string) => {
					// 	const opts = { calledFromHook: true };
					// 	if (platform) {
					// 		await startSyncFilesTimeout(platform, opts);
					// 	} else {
					// 		// This code is added for backwards compatibility with old versions of nativescript-dev-webpack plugin.
					// 		await startSyncFilesTimeout(null, opts);
					// 	}
					// }
				}
			});

			let isFirstSync = true;
			this.$platformService.on("changedFiles", async files => {
				console.log("===================== CHANGED FILES =============== ", files);
				if (!isFirstSync) {
					// filesToSyncMap["ios"] = files;
					await startSyncFilesTimeout(files, "ios", { calledFromHook: true });
				} else {
					isFirstSync = false;
				}
			});

			// const platformSpecificOptions = options.deviceBuildInfoDescriptor.platformSpecificOptions || <IPlatformOptions>{};
			const prepareInfo: IPreparePlatformInfo = {
				platform: "ios",
				appFilesUpdaterOptions: {
					bundle: true,
					release: false,
					watchAllFiles: false,
					useHotModuleReload: false
				},
				projectData: this.$projectDataService.getProjectData(liveSyncData.projectDir),
				env: liveSyncData.env,
				nativePrepare: null,
				// filesToSync: options.filesToSync,
				// filesToRemove: options.filesToRemove,
				// skipModulesNativeCheck: liveSyncData.skipModulesNativeCheck,
				config: <any>{},
				webpackCompilerConfig: {
					watch: true,
					env: liveSyncData.env
				}
			};

			await this.$platformService.preparePlatform(prepareInfo);

			// const watcherOptions: choki.WatchOptions = {
			// 	ignoreInitial: true,
			// 	cwd: liveSyncData.projectDir,
			// 	awaitWriteFinish: {
			// 		pollInterval: 100,
			// 		stabilityThreshold: 500
			// 	},
			// 	ignored: ["**/.*", ".*"] // hidden files
			// };

			// const watcher = choki.watch(patterns, watcherOptions)
			// 	.on("all", async (event: string, filePath: string) => {

			// 		clearTimeout(timeoutTimer);

			// 		filePath = path.join(liveSyncData.projectDir, filePath);

			// 		this.$logger.trace(`Chokidar raised event ${event} for ${filePath}.`);

			// 		if (event === "add" || event === "addDir" || event === "change" /* <--- what to do when change event is raised ? */) {
			// 			filesToSync.push(filePath);
			// 		} else if (event === "unlink" || event === "unlinkDir") {
			// 			filesToRemove.push(filePath);
			// 		}

			// 		startSyncFilesTimeout();
			// 	});

			// this.liveSyncProcessesInfo[liveSyncData.projectDir].watcherInfo = { watcher, patterns };
			this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;
		}
	}

	@cache()
	private attachDeviceLostHandler(): void {
		this.$devicesService.on(DeviceDiscoveryEventNames.DEVICE_LOST, async (device: Mobile.IDevice) => {
			this.$logger.trace(`Received ${DeviceDiscoveryEventNames.DEVICE_LOST} event in LiveSync service for ${device.deviceInfo.identifier}. Will stop LiveSync operation for this device.`);

			for (const projectDir in this.liveSyncProcessesInfo) {
				try {
					if (_.find(this.liveSyncProcessesInfo[projectDir].deviceDescriptors, d => d.identifier === device.deviceInfo.identifier)) {
						await this.stopLiveSync(projectDir, [device.deviceInfo.identifier]);
					}
				} catch (err) {
					this.$logger.warn(`Unable to stop LiveSync operation for ${device.deviceInfo.identifier}.`, err);
				}
			}
		});
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

	private getInstallApplicationBuildConfig(deviceIdentifier: string, projectDir: string, opts: { isEmulator: boolean }): IBuildConfig {
		const buildConfig: IBuildConfig = {
			buildForDevice: !opts.isEmulator,
			iCloudContainerEnvironment: null,
			release: false,
			device: deviceIdentifier,
			provision: null,
			teamId: null,
			projectDir
		};

		return buildConfig;
	}

	public emitLivesyncEvent(event: string, livesyncData: ILiveSyncEventData): boolean {
		this.$logger.trace(`Will emit event ${event} with data`, livesyncData);
		return this.emit(event, livesyncData);
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
