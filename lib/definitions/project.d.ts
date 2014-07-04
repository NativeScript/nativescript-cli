interface IProjectService {
	createProject(projectId: string, projectName: string, projectConfig?: IProjectConfig): IFuture<void>;
}

interface IProjectConfig {
	customAppPath: string;
}