interface IProjectService {
	createProject(projectName: string, projectId: string): IFuture<void>;
	createPlatformSpecificProject(platform: string): IFuture<void>;
	prepareProject(platform: string): IFuture<void>;
	buildProject(platform: string): IFuture<void>;
	ensureProject(): void;
	projectData: IProjectData;
}

interface IAndroidProjectService {
	createProject(projectData: IProjectData): IFuture<void>;
	prepareProject(projectData: IProjectData): IFuture<void>;
	buildProject(projectData: IProjectData): IFuture<void>;
}

interface IiOSProjectService {
	createProject(projectData: IProjectData): IFuture<void>;
}

interface IProjectData {
	projectDir: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
	projectName?: string;
}

interface IProjectTemplatesService {
	defaultTemplatePath: IFuture<string>;
	androidFrameworkPath: IFuture<string>;
}