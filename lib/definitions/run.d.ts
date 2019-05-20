interface IRunData {
	projectDir: string;
	liveSyncInfo: ILiveSyncInfo;
	deviceDescriptors: ILiveSyncDeviceInfo[];
}

interface IRunController {
	run(runData: IRunData): Promise<void>;
	stop(projectDir: string, deviceIdentifiers?: string[], stopOptions?: { shouldAwaitAllActions: boolean }): Promise<void>;
	getDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[];
}

interface IRunEmitter {
	emitRunStartedEvent(projectData: IProjectData, device: Mobile.IDevice): void;
	emitRunNotificationEvent(projectData: IProjectData, device: Mobile.IDevice, notification: string): void;
	emitRunErrorEvent(projectData: IProjectData, device: Mobile.IDevice, error: Error): void;
	emitRunExecutedEvent(projectData: IProjectData, device: Mobile.IDevice, options: { syncedFiles: string[], isFullSync: boolean }): void;
	emitRunStoppedEvent(projectDir: string, deviceIdentifier: string): void;
	emitDebuggerAttachedEvent(debugInformation: IDebugInformation): void;
	emitDebuggerDetachedEvent(device: Mobile.IDevice): void;
	emitUserInteractionNeededEvent(projectData: IProjectData, device: Mobile.IDevice, deviceDescriptor: ILiveSyncDeviceInfo): void;
}

interface IDeviceInstallAppService {
	installOnDevice(device: Mobile.IDevice, buildData: IBuildData, packageFile?: string): Promise<void>;
	installOnDeviceIfNeeded(device: Mobile.IDevice, buildData: IBuildData, packageFile?: string): Promise<void>;
	shouldInstall(device: Mobile.IDevice, buildData: IBuildData): Promise<boolean>;
}
