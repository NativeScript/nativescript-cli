interface IPlatformWorkflowService {
	preparePlatform(platform: string, projectDir: string, options: IOptions): Promise<void>;
	buildPlatform(platform: string, projectDir: string, options: IOptions): Promise<string>;
}

interface IDeviceWorkflowService {
}

interface IAdditionalWorkflowOptions {
	platformParam?: string;
	nativePrepare?: INativePrepare;
}