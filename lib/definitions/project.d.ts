interface IProjectService {
	createProject(projectName: string, projectId: string): IFuture<void>;
	ensureProject(): void;
}

interface IProjectData {
	projectDir: string;
	projectName: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
}

interface IProjectTemplatesService {
	defaultTemplatePath: IFuture<string>;
}

interface IPlatformProjectService {
	validate(): IFuture<void>;
	createProject(projectRoot: string, frameworkDir: string): IFuture<void>;
	interpolateData(projectRoot: string): void;
	afterCreateProject(projectRoot: string): void;
	prepareProject(normalizedPlatformName: string, platforms: string[]): IFuture<void>;
	buildProject(projectRoot: string): IFuture<void>;
}