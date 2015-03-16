interface IProjectService {
	createProject(projectName: string): IFuture<void>;
}

interface IProjectData {
	projectDir: string;
	projectName: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
}

interface IProjectDataService {
	initialize(projectDir: string): void;
	getValue(propertyName: string): IFuture<any>;
	setValue(key: string, value: any): IFuture<void>;
}

interface IProjectTemplatesService {
	defaultTemplatePath: IFuture<string>;
}

interface IPlatformProjectService {
	platformData: IPlatformData;
	validate(): IFuture<void>;
	createProject(projectRoot: string, frameworkDir: string): IFuture<void>;
	interpolateData(projectRoot: string): IFuture<void>;
	afterCreateProject(projectRoot: string): IFuture<void>;
	prepareProject(platformData: IPlatformData): IFuture<string>;
	buildProject(projectRoot: string): IFuture<void>;
	isPlatformPrepared(projectRoot: string): IFuture<boolean>;
	addLibrary(platformData: IPlatformData, libraryPath: string): IFuture<void>;
	canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean>;
	updatePlatform(currentVersion: string, newVersion: string): IFuture<void>;
}
