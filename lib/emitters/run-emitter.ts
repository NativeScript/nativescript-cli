import { EventEmitter } from "events";
import { RunOnDeviceEvents, DEBUGGER_DETACHED_EVENT_NAME, USER_INTERACTION_NEEDED_EVENT_NAME, DEBUGGER_ATTACHED_EVENT_NAME } from "../constants";

export class RunEmitter extends EventEmitter implements IRunEmitter {
	constructor(
		private $logger: ILogger
	) { super(); }

	public emitRunStartedEvent(projectData: IProjectData, device: Mobile.IDevice): void {
		this.emitCore(RunOnDeviceEvents.runOnDeviceStarted, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()]
		});
	}

	public emitRunNotificationEvent(projectData: IProjectData, device: Mobile.IDevice, notification: string): void {
		this.emitCore(RunOnDeviceEvents.runOnDeviceNotification, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			notification
		});
	}

	public emitRunErrorEvent(projectData: IProjectData, device: Mobile.IDevice, error: Error): void {
		this.emitCore(RunOnDeviceEvents.runOnDeviceError, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			error,
		});
	}

	public emitRunExecutedEvent(projectData: IProjectData, device: Mobile.IDevice, options: { syncedFiles: string[], isFullSync: boolean }): void {
		this.emitCore(RunOnDeviceEvents.runOnDeviceExecuted, {
			projectDir: projectData.projectDir,
			deviceIdentifier: device.deviceInfo.identifier,
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			syncedFiles: options.syncedFiles,
			isFullSync: options.isFullSync
		});
	}

	public emitRunStoppedEvent(projectDir: string, deviceIdentifier: string): void {
		this.emitCore(RunOnDeviceEvents.runOnDeviceStopped, {
			projectDir,
			deviceIdentifier
		});
	}

	public emitDebuggerAttachedEvent(debugInformation: IDebugInformation): void {
		this.emit(DEBUGGER_ATTACHED_EVENT_NAME, debugInformation);
	}

	public emitDebuggerDetachedEvent(device: Mobile.IDevice): void {
		const deviceIdentifier = device.deviceInfo.identifier;
		this.emit(DEBUGGER_DETACHED_EVENT_NAME, { deviceIdentifier });
	}

	public emitUserInteractionNeededEvent(projectData: IProjectData, device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo): void {
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
$injector.register("runEmitter", RunEmitter);
