interface IDebugService {
	debug(projectData: IProjectData, buildConfig: IBuildConfig): Promise<void>;
	debugStart(projectData: IProjectData, buildConfig: IBuildConfig): Promise<void>;
	debugStop(): Promise<void>
	platform: string;
}