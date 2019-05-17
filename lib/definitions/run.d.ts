interface IRunData {
	projectDir: string;
	liveSyncInfo: ILiveSyncInfo;
	deviceDescriptors: ILiveSyncDeviceInfo[];
}

interface IRunController {

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
	getDeviceBuildInfoFilePath(device: Mobile.IDevice, projectData: IProjectData): Promise<string>;
	shouldInstall(device: Mobile.IDevice, buildData: IBuildData): Promise<boolean>;
}

interface IDeviceRefreshAppService {
	refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, deviceDescriptor: ILiveSyncDeviceInfo, settings?: IRefreshApplicationSettings): Promise<IRestartApplicationInfo>;
}

interface IDeviceDebugAppService {
	enableDebugging(projectData: IProjectData, deviceDescriptor: ILiveSyncDeviceInfo, refreshInfo: IRestartApplicationInfo): Promise<IDebugInformation>;
	attachDebugger(settings: IAttachDebuggerOptions): Promise<IDebugInformation>;
	printDebugInformation(debugInformation: IDebugInformation, fireDebuggerAttachedEvent: boolean): IDebugInformation;
}