import * as path from "path";
import * as choki from "chokidar";
import { EOL } from "os";
import { EventEmitter } from "events";
import { hook } from "../../common/helpers";
import { PACKAGE_JSON_FILE_NAME, LiveSyncTrackActionNames, USER_INTERACTION_NEEDED_EVENT_NAME, DEBUGGER_ATTACHED_EVENT_NAME, DEBUGGER_DETACHED_EVENT_NAME, TrackActionNames } from "../../constants";
import { DeviceTypes, DeviceDiscoveryEventNames } from "../../common/constants";
import { cache } from "../../common/decorators";

const deviceDescriptorPrimaryKey = "identifier";

const LiveSyncEvents = {
	liveSyncStopped: "liveSyncStopped",
	// In case we name it error, EventEmitter expects instance of Error to be raised and will also raise uncaught exception in case there's no handler
	liveSyncError: "liveSyncError",
	liveSyncExecuted: "liveSyncExecuted",
	liveSyncStarted: "liveSyncStarted",
	liveSyncNotification: "notify"
};

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
		private $processService: IProcessService,
		private $hooksService: IHooksService,
		private $pluginsService: IPluginsService,
		private $debugService: IDebugService,
		private $errors: IErrors,
		private $debugDataService: IDebugDataService,
		private $analyticsService: IAnalyticsService,
		private $usbLiveSyncService: DeprecatedUsbLiveSyncService,
		private $previewAppLiveSyncService: IPreviewAppLiveSyncService,
		private $injector: IInjector) {
		super();
	}

	public async liveSync(deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(liveSyncData.projectDir);
		await this.liveSyncOperation(deviceDescriptors, liveSyncData, projectData);
	}

	public async stopLiveSync(projectDir: string, deviceIdentifiers?: string[], stopOptions?: { shouldAwaitAllActions: boolean }): Promise<void> {
		const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectDir];

		if (liveSyncProcessInfo) {
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
				this.emit(LiveSyncEvents.liveSyncStopped, { projectDir, deviceIdentifier });
			});
		}
	}

	public getLiveSyncDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[] {
		const liveSyncProcessesInfo = this.liveSyncProcessesInfo[projectDir] || <ILiveSyncProcessInfo>{};
		const currentDescriptors = liveSyncProcessesInfo.deviceDescriptors;
		return currentDescriptors || [];
	}

	private async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOpts?: IDebugOptions, outputPath?: string): Promise<void | IDebugInformation> {
		const deviceDescriptor = this.getDeviceDescriptor(liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier, projectData.projectDir);

		return deviceDescriptor && deviceDescriptor.debugggingEnabled ?
			this.refreshApplicationWithDebug(projectData, liveSyncResultInfo, debugOpts, outputPath) :
			this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOpts, outputPath);
	}

	private async refreshApplicationWithoutDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOpts?: IDebugOptions, outputPath?: string, settings?: IShouldSkipEmitLiveSyncNotification): Promise<void> {
		const platformLiveSyncService = this.getLiveSyncService(liveSyncResultInfo.deviceAppData.platform);
		try {
			await platformLiveSyncService.refreshApplication(projectData, liveSyncResultInfo);
		} catch (err) {
			this.$logger.info(`Error while trying to start application ${projectData.projectId} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Error is: ${err.message || err}`);
			const msg = `Unable to start application ${projectData.projectId} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
			this.$logger.warn(msg);
			if (!settings || !settings.shouldSkipEmitLiveSyncNotification) {
				this.emit(LiveSyncEvents.liveSyncNotification, {
					projectDir: projectData.projectDir,
					applicationIdentifier: projectData.projectId,
					deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
					notification: msg
				});
			}
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

	private async refreshApplicationWithDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, debugOptions: IDebugOptions, outputPath?: string): Promise<IDebugInformation> {
		await this.$platformService.trackProjectType(projectData);

		const deviceAppData = liveSyncResultInfo.deviceAppData;

		const deviceIdentifier = liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier;
		await this.$debugService.debugStop(deviceIdentifier);
		this.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });

		const applicationId = deviceAppData.appIdentifier;
		const attachDebuggerOptions: IAttachDebuggerOptions = {
			platform: liveSyncResultInfo.deviceAppData.device.deviceInfo.platform,
			isEmulator: liveSyncResultInfo.deviceAppData.device.isEmulator,
			projectDir: projectData.projectDir,
			deviceIdentifier,
			debugOptions,
			outputPath
		};

		try {
			await deviceAppData.device.applicationManager.stopApplication({ appId: applicationId, projectName: projectData.projectName });
			// Now that we've stopped the application we know it isn't started, so set debugOptions.start to false
			// so that it doesn't default to true in attachDebugger method
			debugOptions = debugOptions || {};
			debugOptions.start = false;
		} catch (err) {
			this.$logger.trace("Could not stop application during debug livesync. Will try to restart app instead.", err);
			if ((err.message || err) === "Could not find developer disk image") {
				// Set isFullSync here to true because we are refreshing with debugger
				// We want to force a restart instead of accidentally performing LiveEdit or FastSync
				liveSyncResultInfo.isFullSync = true;
				await this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, debugOptions, outputPath, { shouldSkipEmitLiveSyncNotification: true });
				this.emit(USER_INTERACTION_NEEDED_EVENT_NAME, attachDebuggerOptions);
				return;
			} else {
				throw err;
			}
		}

		const deviceOption = {
			deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
			debugOptions: debugOptions,
		};

		return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, { projectDir: projectData.projectDir });
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
		const buildConfig: IBuildConfig = {
			buildForDevice: !settings.isEmulator,
			release: false,
			device: settings.deviceIdentifier,
			provision: null,
			teamId: null,
			projectDir: settings.projectDir
		};
		debugData.pathToAppPackage = this.$platformService.lastOutputPath(settings.platform, buildConfig, projectData, settings.outputPath);

		return this.printDebugInformation(await this.$debugService.debug(debugData, settings.debugOptions));
	}

	public printDebugInformation(debugInformation: IDebugInformation): IDebugInformation {
		if (!!debugInformation.url) {
			this.emit(DEBUGGER_ATTACHED_EVENT_NAME, debugInformation);
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

		if (!liveSyncData.syncToPreviewApp) {
			await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
			// In case liveSync is called for a second time for the same projectDir.
			const isAlreadyLiveSyncing = this.liveSyncProcessesInfo[projectData.projectDir] && !this.liveSyncProcessesInfo[projectData.projectDir].isStopped;

			// Prevent cases where liveSync is called consecutive times with the same device, for example [ A, B, C ] and then [ A, B, D ] - we want to execute initialSync only for D.
			const currentlyRunningDeviceDescriptors = this.getLiveSyncDeviceDescriptors(projectData.projectDir);
			deviceDescriptorsForInitialSync = isAlreadyLiveSyncing ? _.differenceBy(deviceDescriptors, currentlyRunningDeviceDescriptors, deviceDescriptorPrimaryKey) : deviceDescriptors;
		}

		this.setLiveSyncProcessInfo(liveSyncData.projectDir, deviceDescriptors);

		const shouldStartWatcher = !liveSyncData.skipWatcher && (liveSyncData.syncToPreviewApp || this.liveSyncProcessesInfo[projectData.projectDir].deviceDescriptors.length);
		if (shouldStartWatcher) {
			// Should be set after prepare
			this.$usbLiveSyncService.isInitialized = true;
			await this.startWatcher(projectData, liveSyncData, deviceDescriptors);
		}

		await this.initialSync(projectData, liveSyncData, deviceDescriptorsForInitialSync);
	}

	private setLiveSyncProcessInfo(projectDir: string, deviceDescriptors: ILiveSyncDeviceInfo[]): void {
		this.liveSyncProcessesInfo[projectDir] = this.liveSyncProcessesInfo[projectDir] || Object.create(null);
		this.liveSyncProcessesInfo[projectDir].actionsChain = this.liveSyncProcessesInfo[projectDir].actionsChain || Promise.resolve();
		this.liveSyncProcessesInfo[projectDir].currentSyncAction = this.liveSyncProcessesInfo[projectDir].actionsChain;
		this.liveSyncProcessesInfo[projectDir].isStopped = false;

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

			const platformSpecificOptions = options.deviceBuildInfoDescriptor.platformSpecificOptions || <IPlatformOptions>{};
			const prepareInfo: IPreparePlatformInfo = {
				platform,
				appFilesUpdaterOptions: {
					bundle: options.bundle,
					release: options.release,
					watchAllFiles: options.liveSyncData.watchAllFiles
				},
				projectData: options.projectData,
				env: options.env,
				nativePrepare: nativePrepare,
				filesToSync: options.filesToSync,
				filesToRemove: options.filesToRemove,
				platformTemplate: null,
				skipModulesNativeCheck: options.skipModulesNativeCheck,
				config: platformSpecificOptions
			};

			await this.$platformService.preparePlatform(prepareInfo);
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
		let action = LiveSyncTrackActionNames.LIVESYNC_OPERATION;
		if (shouldBuild) {
			pathToBuildItem = await options.deviceBuildInfoDescriptor.buildAction();
			options.rebuiltInformation.push({ isEmulator: options.device.isEmulator, platform, pathToBuildItem });
			action = LiveSyncTrackActionNames.LIVESYNC_OPERATION_BUILD;
		} else {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.LiveSync,
				device: options.device,
				projectDir: options.projectData.projectDir
			});
		}

		await this.trackAction(action, platform, options);

		const shouldInstall = await this.$platformService.shouldInstall(options.device, options.projectData, options, options.deviceBuildInfoDescriptor.outputPath);
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
		const rebuildInfo = _.find(options.rebuiltInformation, info => info.platform === platform && (this.$mobileHelper.isAndroidPlatform(platform) || info.isEmulator === options.device.isEmulator));

		if (rebuildInfo) {
			// Case where we have three devices attached, a change that requires build is found,
			// we'll rebuild the app only for the first device, but we should install new package on all three devices.
			await this.$platformService.installApplication(options.device, { release: false }, options.projectData, rebuildInfo.pathToBuildItem, options.deviceBuildInfoDescriptor.outputPath);
			return rebuildInfo.pathToBuildItem;
		}

		return null;
	}

	private async initialSync(projectData: IProjectData, liveSyncData: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		if (liveSyncData.syncToPreviewApp) {
			await this.initialSyncToPreviewApp(projectData, liveSyncData);
		} else {
			await this.initialCableSync(projectData, liveSyncData, deviceDescriptors);
		}
	}

	private async initialSyncToPreviewApp(projectData: IProjectData, liveSyncData: ILiveSyncInfo) {
		this.addActionToChain(projectData.projectDir, async () => {
			await this.$previewAppLiveSyncService.initialSync({
				appFilesUpdaterOptions: {
					bundle: liveSyncData.bundle,
					release: liveSyncData.release
				},
				env: liveSyncData.env,
				projectDir: projectData.projectDir
			});
		});
	}

	private async initialCableSync(projectData: IProjectData, liveSyncData: ILiveSyncInfo, deviceDescriptors: ILiveSyncDeviceInfo[]): Promise<void> {
		const preparedPlatforms: string[] = [];
		const rebuiltInformation: ILiveSyncBuildInfo[] = [];

		const settings = this.getDefaultLatestAppPackageInstalledSettings();
		// Now fullSync
		const deviceAction = async (device: Mobile.IDevice): Promise<void> => {
			try {
				const platform = device.deviceInfo.platform;
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

				await platformLiveSyncService.prepareForLiveSync(device, projectData, liveSyncData, deviceBuildInfoDescriptor.debugOptions);

				const liveSyncResultInfo = await platformLiveSyncService.fullSync({
					projectData, device,
					syncAllFiles: liveSyncData.watchAllFiles,
					useHotModuleReload: liveSyncData.useHotModuleReload,
					watch: !liveSyncData.skipWatcher
				});

				await this.$platformService.trackActionForPlatform({ action: "LiveSync", platform: device.deviceInfo.platform, isForDevice: !device.isEmulator, deviceOsVersion: device.deviceInfo.version });
				await this.refreshApplication(projectData, liveSyncResultInfo, deviceBuildInfoDescriptor.debugOptions, deviceBuildInfoDescriptor.outputPath);

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

			const filesToSync: string[] = [];
			let filesToRemove: string[] = [];
			let timeoutTimer: NodeJS.Timer;

			const startSyncFilesTimeout = () => {
				timeoutTimer = setTimeout(async () => {
					if (liveSyncData.syncToPreviewApp) {
						await this.addActionToChain(projectData.projectDir, async () => {
							await this.$previewAppLiveSyncService.syncFiles({
								appFilesUpdaterOptions: {
									bundle: liveSyncData.bundle,
									release: liveSyncData.release
								},
								env: liveSyncData.env,
								projectDir: projectData.projectDir
							}, filesToSync);
						});
					} else {
						// Push actions to the queue, do not start them simultaneously
						await this.addActionToChain(projectData.projectDir, async () => {
							if (filesToSync.length || filesToRemove.length) {
								try {
									const currentFilesToSync = _.cloneDeep(filesToSync);
									filesToSync.splice(0, filesToSync.length);

									const currentFilesToRemove = _.cloneDeep(filesToRemove);
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
											liveSyncData,
											settings: latestAppPackageInstalledSettings,
											modifiedFiles: allModifiedFiles,
											filesToRemove: currentFilesToRemove,
											filesToSync: currentFilesToSync,
											bundle: liveSyncData.bundle,
											release: liveSyncData.release,
											env: liveSyncData.env,
											skipModulesNativeCheck: !liveSyncData.watchAllFiles
										}, { skipNativePrepare: deviceBuildInfoDescriptor.skipNativePrepare });

										const service = this.getLiveSyncService(device.deviceInfo.platform);
										const settings: ILiveSyncWatchInfo = {
											projectData,
											filesToRemove: currentFilesToRemove,
											filesToSync: currentFilesToSync,
											isReinstalled: appInstalledOnDeviceResult.appInstalled,
											syncAllFiles: liveSyncData.watchAllFiles,
											useHotModuleReload: liveSyncData.useHotModuleReload
										};

										const liveSyncResultInfo = await service.liveSyncWatchAction(device, settings);
										await this.refreshApplication(projectData, liveSyncResultInfo, deviceBuildInfoDescriptor.debugOptions, deviceBuildInfoDescriptor.outputPath);
									},
										(device: Mobile.IDevice) => {
											const liveSyncProcessInfo = this.liveSyncProcessesInfo[projectData.projectDir];
											return liveSyncProcessInfo && _.some(liveSyncProcessInfo.deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier);
										}
									);
								} catch (err) {
									const allErrors = (<Mobile.IDevicesOperationError>err).allErrors;

									if (allErrors && _.isArray(allErrors)) {
										for (const deviceError of allErrors) {
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
					}
				}, 250);

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
							watchAllFiles: liveSyncData.watchAllFiles
						},
						platforms
					},
					filesToSync,
					filesToRemove,
					startSyncFilesTimeout: startSyncFilesTimeout.bind(this)
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

			const watcher = choki.watch(patterns, watcherOptions)
				.on("all", async (event: string, filePath: string) => {

					clearTimeout(timeoutTimer);

					filePath = path.join(liveSyncData.projectDir, filePath);

					this.$logger.trace(`Chokidar raised event ${event} for ${filePath}.`);

					if (event === "add" || event === "addDir" || event === "change" /* <--- what to do when change event is raised ? */) {
						filesToSync.push(filePath);
					} else if (event === "unlink" || event === "unlinkDir") {
						filesToRemove.push(filePath);
					}

					startSyncFilesTimeout();
				});

			this.liveSyncProcessesInfo[liveSyncData.projectDir].watcherInfo = { watcher, patterns };
			this.liveSyncProcessesInfo[liveSyncData.projectDir].timer = timeoutTimer;

			this.$processService.attachToProcessExitSignals(this, () => {
				if (liveSyncData.syncToPreviewApp) {
					// Do not await here, we are in process exit's handler.
					this.$previewAppLiveSyncService.stopLiveSync();
				}

				_.keys(this.liveSyncProcessesInfo).forEach(projectDir => {
					// Do not await here, we are in process exit's handler.
					/* tslint:disable:no-floating-promises */
					this.stopLiveSync(projectDir);
					/* tslint:enable:no-floating-promises */
				});
			});
		}
	}

	@cache()
	private attachDeviceLostHandler(): void {
		this.$devicesService.on(DeviceDiscoveryEventNames.DEVICE_LOST, async (device: Mobile.IDevice) => {
			this.$logger.trace(`Received ${DeviceDiscoveryEventNames.DEVICE_LOST} event in LiveSync service for ${device.deviceInfo.identifier}. Will stop LiveSync operation for this device.`);

			for (const projectDir in this.liveSyncProcessesInfo) {
				try {
					await this.stopLiveSync(projectDir, [device.deviceInfo.identifier]);
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
