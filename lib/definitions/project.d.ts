interface IProjectService {
	createProject(projectName: string, projectId: string): IFuture<void>;
}

interface IProjectTemplatesService {
	defaultTemplatePath: IFuture<string>;
}