import { performanceLog } from "../common/decorators";
import { EOL } from "os";
import { parse } from "url";
import { CONNECTED_STATUS } from "../common/constants";
import { TrackActionNames, DebugCommandErrors, CONNECTION_ERROR_EVENT_NAME, DebugTools, DEBUGGER_DETACHED_EVENT_NAME, DEBUGGER_ATTACHED_EVENT_NAME } from "../constants";
import { EventEmitter } from "events";

export class DebugController extends EventEmitter implements IDebugController {
	private _platformDebugServices: IDictionary<IDeviceDebugService> = {};

	constructor(
		private $analyticsService: IAnalyticsService,
		private $debugDataService: IDebugDataService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $injector: IInjector,
		private $liveSyncProcessDataService: ILiveSyncProcessDataService,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectDataService: IProjectDataService
	) {
		super();
	}

	@performanceLog()
	public async startDebug(debugData: IDebugData): Promise<IDebugInformation> {
		const { debugOptions: options } = debugData;
		const device = this.$devicesService.getDeviceByIdentifier(debugData.deviceIdentifier);

		if (!device) {
			this.$errors.fail(`Cannot find device with identifier ${debugData.deviceIdentifier}.`);
		}

		if (device.deviceInfo.status !== CONNECTED_STATUS) {
			this.$errors.fail(`The device with identifier ${debugData.deviceIdentifier} is unreachable. Make sure it is Trusted and try again.`);
		}

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.Debug,
			device,
			additionalData: this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) && options && options.inspector ? DebugTools.Inspector : DebugTools.Chrome,
			projectDir: debugData.projectDir
		});

		if (!(await device.applicationManager.isApplicationInstalled(debugData.applicationIdentifier))) {
			this.$errors.fail(`The application ${debugData.applicationIdentifier} is not installed on device with identifier ${debugData.deviceIdentifier}.`);
		}

		const debugService = this.getDeviceDebugService(device);
		if (!debugService) {
			this.$errors.fail(`Unsupported device OS: ${device.deviceInfo.platform}. You can debug your applications only on iOS or Android.`);
		}

		const debugOptions: IDebugOptions = _.cloneDeep(options);
		const debugResultInfo = await debugService.debug(debugData, debugOptions);

		return this.getDebugInformation(debugResultInfo, device.deviceInfo.identifier);
	}

	public enableDebugging(enableDebuggingData: IEnableDebuggingData): Promise<IDebugInformation>[] {
		const { deviceIdentifiers } = enableDebuggingData;

		return _.map(deviceIdentifiers, deviceIdentifier => this.enableDebuggingCore(enableDebuggingData.projectDir, deviceIdentifier, enableDebuggingData.debugOptions));
	}

	public async disableDebugging(disableDebuggingData: IDisableDebuggingData): Promise<void> {
		const { deviceIdentifiers, projectDir } = disableDebuggingData;

		for (const deviceIdentifier of deviceIdentifiers) {
			const liveSyncProcessInfo = this.$liveSyncProcessDataService.getPersistedData(projectDir);
			if (liveSyncProcessInfo.currentSyncAction) {
				await liveSyncProcessInfo.currentSyncAction;
			}

			const currentDeviceDescriptor = this.getDeviceDescriptor(projectDir, deviceIdentifier);

			if (currentDeviceDescriptor) {
				currentDeviceDescriptor.debuggingEnabled = false;
			} else {
				this.$errors.fail(`Couldn't disable debugging for ${deviceIdentifier}`);
			}

			const currentDevice = this.$devicesService.getDeviceByIdentifier(currentDeviceDescriptor.identifier);
			if (!currentDevice) {
				this.$errors.fail(`Couldn't disable debugging for ${deviceIdentifier}. Could not find device.`);
			}

			await this.stopDebug(currentDevice.deviceInfo.identifier);

			this.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });
		}
	}

	public async attachDebugger(attachDebuggerData: IAttachDebuggerData): Promise<IDebugInformation> {
		// Default values
		if (attachDebuggerData.debugOptions) {
			attachDebuggerData.debugOptions.chrome = attachDebuggerData.debugOptions.chrome === undefined ? true : attachDebuggerData.debugOptions.chrome;
			attachDebuggerData.debugOptions.start = attachDebuggerData.debugOptions.start === undefined ? true : attachDebuggerData.debugOptions.start;
		} else {
			attachDebuggerData.debugOptions = {
				chrome: true,
				start: true
			};
		}

		const projectData = this.$projectDataService.getProjectData(attachDebuggerData.projectDir);
		const debugData = this.$debugDataService.getDebugData(attachDebuggerData.deviceIdentifier, projectData, attachDebuggerData.debugOptions);
		// const platformData = this.$platformsDataService.getPlatformData(settings.platform, projectData);

		// Of the properties below only `buildForDevice` and `release` are currently used.
		// Leaving the others with placeholder values so that they may not be forgotten in future implementations.
		const debugInfo = await this.startDebug(debugData);
		const result = this.printDebugInformation(debugInfo, attachDebuggerData.debugOptions.forceDebuggerAttachedEvent);
		return result;
	}

	@performanceLog()
	public async enableDebuggingCoreWithoutWaitingCurrentAction(projectDir: string, deviceIdentifier: string, debugOptions: IDebugOptions): Promise<IDebugInformation> {
		const deviceDescriptor = this.getDeviceDescriptor(projectDir, deviceIdentifier);
		if (!deviceDescriptor) {
			this.$errors.fail(`Couldn't enable debugging for ${deviceIdentifier}`);
		}

		deviceDescriptor.debuggingEnabled = true;
		deviceDescriptor.debugOptions = debugOptions;

		const currentDeviceInstance = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);
		const attachDebuggerData: IAttachDebuggerData = {
			deviceIdentifier,
			isEmulator: currentDeviceInstance.isEmulator,
			outputPath: deviceDescriptor.buildData.outputPath,
			platform: currentDeviceInstance.deviceInfo.platform,
			projectDir,
			debugOptions
		};

		let debugInformation: IDebugInformation;
		try {
			debugInformation = await this.attachDebugger(attachDebuggerData);
		} catch (err) {
			this.$logger.trace("Couldn't attach debugger, will modify options and try again.", err);
			attachDebuggerData.debugOptions.start = false;
			try {
				debugInformation = await this.attachDebugger(attachDebuggerData);
			} catch (innerErr) {
				this.$logger.trace("Couldn't attach debugger with modified options.", innerErr);
				throw err;
			}
		}

		return debugInformation;
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

	public async stopDebug(deviceIdentifier: string): Promise<void> {
		const device = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);
		const debugService = this.getDeviceDebugService(device);
		await debugService.debugStop();
	}

	private getDeviceDescriptor(projectDir: string, deviceIdentifier: string): ILiveSyncDeviceDescriptor {
		const deviceDescriptors = this.$liveSyncProcessDataService.getDeviceDescriptors(projectDir);
		const currentDeviceDescriptor = _.find(deviceDescriptors, d => d.identifier === deviceIdentifier);

		return currentDeviceDescriptor;
	}

	private getDeviceDebugService(device: Mobile.IDevice): IDeviceDebugService {
		if (!this._platformDebugServices[device.deviceInfo.identifier]) {
			const devicePlatform = device.deviceInfo.platform;
			if (this.$mobileHelper.isiOSPlatform(devicePlatform)) {
				this._platformDebugServices[device.deviceInfo.identifier] = this.$injector.resolve("iOSDeviceDebugService", { device });
			} else if (this.$mobileHelper.isAndroidPlatform(devicePlatform)) {
				this._platformDebugServices[device.deviceInfo.identifier] = this.$injector.resolve("androidDeviceDebugService", { device });
			} else {
				this.$errors.fail(DebugCommandErrors.UNSUPPORTED_DEVICE_OS_FOR_DEBUGGING);
			}

			this.attachConnectionErrorHandlers(this._platformDebugServices[device.deviceInfo.identifier]);
		}

		return this._platformDebugServices[device.deviceInfo.identifier];
	}

	private attachConnectionErrorHandlers(platformDebugService: IDeviceDebugService) {
		let connectionErrorHandler = (e: Error) => this.emit(CONNECTION_ERROR_EVENT_NAME, e);
		connectionErrorHandler = connectionErrorHandler.bind(this);
		platformDebugService.on(CONNECTION_ERROR_EVENT_NAME, connectionErrorHandler);
	}

	private getDebugInformation(debugResultInfo: IDebugResultInfo, deviceIdentifier: string): IDebugInformation {
		const debugInfo: IDebugInformation = {
			url: debugResultInfo.debugUrl,
			port: 0,
			deviceIdentifier
		};

		if (debugResultInfo.debugUrl) {
			const parseQueryString = true;
			const wsQueryParam = <string>parse(debugResultInfo.debugUrl, parseQueryString).query.ws;
			const hostPortSplit = wsQueryParam && wsQueryParam.split(":");
			debugInfo.port = hostPortSplit && +hostPortSplit[1];
		}

		return debugInfo;
	}

	private async enableDebuggingCore(projectDir: string, deviceIdentifier: string, debugOptions: IDebugOptions): Promise<IDebugInformation> {
		const liveSyncProcessInfo = this.$liveSyncProcessDataService.getPersistedData(projectDir);
		if (liveSyncProcessInfo && liveSyncProcessInfo.currentSyncAction) {
			await liveSyncProcessInfo.currentSyncAction;
		}

		return this.enableDebuggingCoreWithoutWaitingCurrentAction(projectDir, deviceIdentifier, debugOptions);
	}
}
$injector.register("debugController", DebugController);
