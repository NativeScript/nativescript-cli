interface IPlatformWorkflowData extends IRelease, IHasUseHotModuleReloadOption {
	platformParam: string;
	frameworkPath?: string;
	nativePrepare?: INativePrepare;
	env?: any;
	signingOptions: IiOSSigningOptions | IAndroidSigningOptions;
}

interface IPlatformWorkflowService {
	preparePlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData): Promise<void>;
	buildPlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData, buildConfig: IBuildConfig): Promise<string>;
}

interface IPlatformWorkflowDataFactory {
	createPlatformWorkflowData(platformParam: string, options: IOptions, nativePrepare?: INativePrepare): IPlatformWorkflowData;
}