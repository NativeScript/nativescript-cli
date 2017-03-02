interface IDebugService {
	debug(projectData: IProjectData): Promise<void>;
	debugStart(projectData: IProjectData): Promise<void>;
	debugStop(): Promise<void>
	platform: string;
}