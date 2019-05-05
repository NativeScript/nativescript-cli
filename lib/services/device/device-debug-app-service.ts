import { performanceLog } from "../../common/decorators";
import { RunOnDevicesEmitter } from "../../run-on-devices-emitter";
import { EOL } from "os";

export class DeviceDebugAppService {
	constructor(
		private $debugDataService: IDebugDataService,
		private $debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $runOnDevicesEmitter: RunOnDevicesEmitter
	) { }

	@performanceLog()
	public async enableDebugging(projectData: IProjectData, deviceDescriptor: ILiveSyncDeviceInfo, refreshInfo: IRestartApplicationInfo): Promise<IDebugInformation> {
		const { debugOptions } = deviceDescriptor;
		// we do not stop the application when debugBrk is false, so we need to attach, instead of launch
		// if we try to send the launch request, the debugger port will not be printed and the command will timeout
		debugOptions.start = !debugOptions.debugBrk;

		debugOptions.forceDebuggerAttachedEvent = refreshInfo.didRestart;
		const deviceOption = {
			deviceIdentifier: deviceDescriptor.identifier,
			debugOptions: debugOptions,
		};

		return this.enableDebuggingCoreWithoutWaitingCurrentAction(deviceOption, deviceDescriptor, { projectDir: projectData.projectDir });
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
		// const platformData = this.$platformsData.getPlatformData(settings.platform, projectData);

		// Of the properties below only `buildForDevice` and `release` are currently used.
		// Leaving the others with placeholder values so that they may not be forgotten in future implementations.
		// debugData.pathToAppPackage = this.$buildArtefactsService.getLastBuiltPackagePath(platformData, buildConfig, settings.outputPath);
		const debugInfo = await this.$debugService.debug(debugData, settings.debugOptions);
		const result = this.printDebugInformation(debugInfo, settings.debugOptions.forceDebuggerAttachedEvent);
		return result;
	}

	public printDebugInformation(debugInformation: IDebugInformation, fireDebuggerAttachedEvent: boolean = true): IDebugInformation {
		if (!!debugInformation.url) {
			if (fireDebuggerAttachedEvent) {
				this.$runOnDevicesEmitter.emitDebuggerAttachedEvent(debugInformation);
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

		deviceDescriptor.debuggingEnabled = true;
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
}
$injector.register("deviceDebugAppService", DeviceDebugAppService);
