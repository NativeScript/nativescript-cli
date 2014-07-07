interface IProjectService {
	createProject(projectDir: string, projectId: string, projectName: string, projectConfig?: IProjectConfig): IFuture<void>;
}

interface IProjectConfig {
	customAppPath: string;
}

interface ICutenessService {
	cutenessAppPath: IFuture<string>;
}