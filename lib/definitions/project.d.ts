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
	createProject(platform: string): IFuture<void>;
	buildProject(platform: string): IFuture<void>;
	prepareProject(normalizedPlatformName: string, platforms: string[]): IFuture<void>;
}

interface IPlatformSpecificProjectService {
	validate(): IFuture<void>;
	createProject(projectRoot: string, frameworkDir: string): IFuture<void>;
	interpolateData(projectRoot: string): void;
	executePlatformSpecificAction(projectRoot: string): void;
	buildProject(projectRoot: string): IFuture<void>;
}