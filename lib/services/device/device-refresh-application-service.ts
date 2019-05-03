import { performanceLog } from "../../common/decorators";
import { EventEmitter } from "events";
import { DEBUGGER_DETACHED_EVENT_NAME, USER_INTERACTION_NEEDED_EVENT_NAME, LiveSyncEvents, DEBUGGER_ATTACHED_EVENT_NAME } from "../../constants";
import { EOL } from "os";

export class DeviceRefreshApplicationService {

	constructor(
		// private $buildArtefactsService: IBuildArtefactsService,
		private $debugDataService: IDebugDataService,
		private $debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $logger: ILogger,
		// private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService
	) { }

	@performanceLog()
	public async refreshApplication(deviceDescriptor: ILiveSyncDeviceInfo, projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, platformLiveSyncService: IPlatformLiveSyncService, eventEmitter: EventEmitter): Promise<IRestartApplicationInfo | IDebugInformation> {
		return liveSyncResultInfo && deviceDescriptor.debugggingEnabled ?
			this.refreshApplicationWithDebug(projectData, liveSyncResultInfo, deviceDescriptor, platformLiveSyncService, eventEmitter) :
			this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, deviceDescriptor, platformLiveSyncService, eventEmitter);
	}

	@performanceLog()
	public async refreshApplicationWithDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, deviceDescriptor: ILiveSyncDeviceInfo, platformLiveSyncService: IPlatformLiveSyncService, eventEmitter: EventEmitter): Promise<IDebugInformation> {
		const { debugOptions } = deviceDescriptor;
		if (debugOptions.debugBrk) {
			liveSyncResultInfo.waitForDebugger = true;
		}

		const refreshInfo = await this.refreshApplicationWithoutDebug(projectData, liveSyncResultInfo, deviceDescriptor, platformLiveSyncService, eventEmitter, { shouldSkipEmitLiveSyncNotification: true, shouldCheckDeveloperDiscImage: true });

		// we do not stop the application when debugBrk is false, so we need to attach, instead of launch
		// if we try to send the launch request, the debugger port will not be printed and the command will timeout
		debugOptions.start = !debugOptions.debugBrk;

		debugOptions.forceDebuggerAttachedEvent = refreshInfo.didRestart;
		const deviceOption = {
			deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
			debugOptions: debugOptions,
		};

		return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, deviceDescriptor, { projectDir: projectData.projectDir });
	}

	public async refreshApplicationWithoutDebug(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, deviceDescriptor: ILiveSyncDeviceInfo, platformLiveSyncService: IPlatformLiveSyncService, eventEmitter: EventEmitter, settings?: IRefreshApplicationSettings): Promise<IRestartApplicationInfo> {
		const result = { didRestart: false };
		const platform = liveSyncResultInfo.deviceAppData.platform;
		const applicationIdentifier = projectData.projectIdentifiers[platform.toLowerCase()];
		try {
			let shouldRestart = await platformLiveSyncService.shouldRestart(projectData, liveSyncResultInfo);
			if (!shouldRestart) {
				shouldRestart = !await platformLiveSyncService.tryRefreshApplication(projectData, liveSyncResultInfo);
			}

			if (shouldRestart) {
				const deviceIdentifier = liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier;
				eventEmitter.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });
				await platformLiveSyncService.restartApplication(projectData, liveSyncResultInfo);
				result.didRestart = true;
			}
		} catch (err) {
			this.$logger.info(`Error while trying to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Error is: ${err.message || err}`);
			const msg = `Unable to start application ${applicationIdentifier} on device ${liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier}. Try starting it manually.`;
			this.$logger.warn(msg);
			if (!settings || !settings.shouldSkipEmitLiveSyncNotification) {
				eventEmitter.emit(LiveSyncEvents.liveSyncNotification, {
					projectDir: projectData.projectDir,
					applicationIdentifier,
					deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
					notification: msg
				});
			}

			if (settings && settings.shouldCheckDeveloperDiscImage) {
				this.handleDeveloperDiskImageError(err, liveSyncResultInfo, projectData, deviceDescriptor, eventEmitter);
			}
		}

		eventEmitter.emit(LiveSyncEvents.liveSyncExecuted, {
			projectDir: projectData.projectDir,
			applicationIdentifier,
			syncedFiles: liveSyncResultInfo.modifiedFilesData.map(m => m.getLocalPath()),
			deviceIdentifier: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
			isFullSync: liveSyncResultInfo.isFullSync
		});

		return result;
	}

	// TODO: This should be into separate class
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
		// const platformData = this.$platformsData.getPlatformData(settings.platform, projectData);

		// Of the properties below only `buildForDevice` and `release` are currently used.
		// Leaving the others with placeholder values so that they may not be forgotten in future implementations.
		// debugData.pathToAppPackage = this.$buildArtefactsService.getLastBuiltPackagePath(platformData, buildConfig, settings.outputPath);
		const debugInfo = await this.$debugService.debug(debugData, settings.debugOptions);
		const result = this.printDebugInformation(debugInfo, null, settings.debugOptions.forceDebuggerAttachedEvent);
		return result;
	}

	public printDebugInformation(debugInformation: IDebugInformation, eventEmitter: EventEmitter, fireDebuggerAttachedEvent: boolean = true): IDebugInformation {
		if (!!debugInformation.url) {
			if (fireDebuggerAttachedEvent) {
				eventEmitter.emit(DEBUGGER_ATTACHED_EVENT_NAME, debugInformation);
			}

			this.$logger.info(`To start debugging, open the following URL in Chrome:${EOL}${debugInformation.url}${EOL}`.cyan);
		}

		return debugInformation;
	}

	@performanceLog()
	private async enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption: IEnableDebuggingDeviceOptions, deviceDescriptor: ILiveSyncDeviceInfo, debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<IDebugInformation> {
		if (!deviceDescriptor) {
			this.$errors.failWithoutHelp(`Couldn't enable debugging for ${deviceOption.deviceIdentifier}`);
		}

		deviceDescriptor.debugggingEnabled = true;
		deviceDescriptor.debugOptions = deviceOption.debugOptions;
		const currentDeviceInstance = this.$devicesService.getDeviceByIdentifier(deviceOption.deviceIdentifier);
		const attachDebuggerOptions: IAttachDebuggerOptions = {
			deviceIdentifier: deviceOption.deviceIdentifier,
			isEmulator: currentDeviceInstance.isEmulator,
			outputPath: deviceDescriptor.outputPath,
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

	private handleDeveloperDiskImageError(err: any, liveSyncResultInfo: ILiveSyncResultInfo, projectData: IProjectData, deviceDescriptor: ILiveSyncDeviceInfo, eventEmitter: EventEmitter) {
		if ((err.message || err) === "Could not find developer disk image") {
			const deviceIdentifier = liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier;
			const attachDebuggerOptions: IAttachDebuggerOptions = {
				platform: liveSyncResultInfo.deviceAppData.device.deviceInfo.platform,
				isEmulator: liveSyncResultInfo.deviceAppData.device.isEmulator,
				projectDir: projectData.projectDir,
				deviceIdentifier,
				debugOptions: deviceDescriptor.debugOptions,
				outputPath: deviceDescriptor.outputPath
			};
			eventEmitter.emit(USER_INTERACTION_NEEDED_EVENT_NAME, attachDebuggerOptions);
		}
	}
}
$injector.register("deviceRefreshApplicationService", DeviceRefreshApplicationService);
