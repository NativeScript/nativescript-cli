interface IProjectService {
	createProject(projectName: string, projectId: string): IFuture<void>;
}

interface ICutenessService {
	cutenessPath: IFuture<string>;
}