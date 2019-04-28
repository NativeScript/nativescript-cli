interface IPlatformWorkflowData extends IRelease, IHasUseHotModuleReloadOption {
	platformParam: string;
	frameworkPath?: string;
	nativePrepare?: INativePrepare;
	env?: any;
	signingOptions: IiOSSigningOptions | IAndroidSigningOptions;
}

interface IPlatformWorkflowService {
	addPlatformIfNeeded(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData): Promise<void>;
	preparePlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData): Promise<void>;
	buildPlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData, buildConfig: IBuildConfig): Promise<string>;
	buildPlatformIfNeeded(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData, buildConfig: IBuildConfig, outputPath?: string): Promise<string>;
}

interface IPlatformWorkflowDataFactory {
	createPlatformWorkflowData(platformParam: string, options: IOptions, nativePrepare?: INativePrepare): IPlatformWorkflowData;
}

interface IDeviceWorkflowService {
	installOnDevice(device: Mobile.IDevice, platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig, packageFile?: string, outputFilePath?: string): Promise<void>;
	installOnDeviceIfNeeded(device: Mobile.IDevice, platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig, packageFile?: string, outputFilePath?: string): Promise<void>;
}