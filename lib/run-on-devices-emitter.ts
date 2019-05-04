import { EventEmitter } from "events";
import { RunOnDeviceEvents, DEBUGGER_DETACHED_EVENT_NAME, USER_INTERACTION_NEEDED_EVENT_NAME, DEBUGGER_ATTACHED_EVENT_NAME } from "./constants";

export class RunOnDevicesEmitter extends EventEmitter {
	constructor(
		private $logger: ILogger
	) { super(); }

	public emitRunOnDeviceStartedEvent(projectData: IProjectData, device: Mobile.IDevice) {
		this.emitCore(RunOnDeviceEvents.runOnDeviceStarted, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()]
		});
	}

	public emitRunOnDeviceNotificationEvent(projectData: IProjectData, device: Mobile.IDevice, notification: string) {
		this.emitCore(RunOnDeviceEvents.runOnDeviceNotification, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			notification
		});
	}

	public emitRunOnDeviceErrorEvent(projectData: IProjectData, device: Mobile.IDevice, error: Error) {
		this.emitCore(RunOnDeviceEvents.runOnDeviceError, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			error,
		});
	}

	public emitRunOnDeviceExecutedEvent(projectData: IProjectData, device: Mobile.IDevice, options: { syncedFiles: string[], isFullSync: boolean }) {
		this.emitCore(RunOnDeviceEvents.runOnDeviceExecuted, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			syncedFiles: options.syncedFiles,
			isFullSync: options.isFullSync
		});
	}

	public emitRunOnDeviceStoppedEvent(projectDir: string, deviceIdentifier: string) {
		this.emitCore(RunOnDeviceEvents.runOnDeviceStopped, {
			projectDir,
			deviceIdentifier
		});
	}

	public emitDebuggerAttachedEvent(debugInformation: IDebugInformation) {
		this.emit(DEBUGGER_ATTACHED_EVENT_NAME, debugInformation);
	}

	public emitDebuggerDetachedEvent(device: Mobile.IDevice) {
		const deviceIdentifier = device.deviceInfo.identifier;
		this.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });
	}

	public emitUserInteractionNeededEvent(projectData: IProjectData, device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo) {
		const deviceIdentifier = device.deviceInfo.identifier;
		const attachDebuggerOptions: IAttachDebuggerOptions = {
			platform: device.deviceInfo.platform,
			isEmulator: device.isEmulator,
			projectDir: projectData.projectDir,
			deviceIdentifier,
			debugOptions: deviceDescriptor.debugOptions,
			outputPath: deviceDescriptor.outputPath
		};
		this.emit(USER_INTERACTION_NEEDED_EVENT_NAME, attachDebuggerOptions);
	}

	private emitCore(event: string, data: ILiveSyncEventData): void {
		this.$logger.trace(`Will emit event ${event} with data`, data);
		this.emit(event, data);
	}
}
$injector.register("runOnDevicesEmitter", RunOnDevicesEmitter);
