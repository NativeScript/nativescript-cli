interface IProjectIntegrationTest {
	createProject(projectName: string): IFuture<void>;
	assertProject(tempFolder: string, projectName: string, appId: string): IFuture<void>;
	getDefaultTemplatePath(): IFuture<string>;
	dispose(): void;
}

interface IPlatformIntegrationTest {
	platformService: IPlatformService;
}

interface IPlatformUnitTest {
	platformService: IPlatformService;
}