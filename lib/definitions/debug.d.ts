interface IDebugData {
	deviceIdentifier: string;
	applicationIdentifier: string;
	pathToAppPackage?: string;
	projectName?: string;
	projectDir?: string;
}

interface IDebugOptions {
	chrome?: boolean;
	start?: boolean;
	stop?: boolean;
	emulator?: boolean;
	debugBrk?: boolean;
	client?: boolean;
	justlaunch?: boolean;
}

interface IDebugDataService {
	createDebugData(projectData: IProjectData, options: IOptions): IDebugData;
}

interface IDebugService extends NodeJS.EventEmitter {
	debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string[]>;
}

interface IPlatformDebugService extends IDebugService {
	debugStart(debugData: IDebugData, debugOptions: IDebugOptions): Promise<void>;
	debugStop(): Promise<void>
	platform: string;
}
