interface IEmulatorInfo extends IPlatform {
	name: string;
	version: string;
	id: string;
	type: string;
	isRunning?: boolean;
}

interface IEmulatorPlatformService {
	listAvailableEmulators(platform: string): Promise<void>;
	getEmulatorInfo(platform: string, nameOfId: string): Promise<IEmulatorInfo>;
	getiOSEmulators(): Promise<IEmulatorInfo[]>;
	getAndroidEmulators(): IEmulatorInfo[];
	startEmulator(info: IEmulatorInfo, projectData: IProjectData): Promise<void>;
}