interface IProjectService {
	createProject(projectName: string, projectId: string): IFuture<void>;
    projectData: IProjectData;
}

interface IProjectData {
    projectDir: string;
    platformsDir: string;
}

interface IProjectTemplatesService {
	defaultTemplatePath: IFuture<string>;
}