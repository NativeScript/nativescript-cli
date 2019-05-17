interface IBuildData extends IPrepareData {
	device?: string;
	emulator?: boolean;
	clean: boolean;
	buildForDevice?: boolean;
	buildOutputStdio?: string;
	outputPath?: string;
	copyTo?: string;
}

interface IiOSBuildData extends IBuildData {
	teamId: string;
	provision: string;
	mobileProvisionData: any;
	buildForAppStore: boolean;
	iCloudContainerEnvironment: string;
}

interface IAndroidBuildData extends IBuildData {
	keyStoreAlias: string;
	keyStorePath: string;
	keyStoreAliasPassword: string;
	keyStorePassword: string;
	androidBundle: boolean;
}

interface IBuildController {
	prepareAndBuild(buildData: IBuildData): Promise<string>;
	build(buildData: IBuildData): Promise<string>;
	buildIfNeeded(buildData: IBuildData): Promise<string>;
	shouldBuild(buildData: IBuildData): Promise<boolean>;
}

interface IBuildDataService {
	getBuildData(projectDir: string, platform: string, data: any): IBuildData;
}

interface IBuildArtefactsService {
	getLatestApplicationPackagePath(platformData: IPlatformData, buildOutputOptions: IBuildOutputOptions): Promise<string>;
	getAllApplicationPackages(buildOutputPath: string, validBuildOutputData: IValidBuildOutputData): IApplicationPackage[];
	copyLastOutput(targetPath: string, platformData: IPlatformData, buildOutputOptions: IBuildOutputOptions): void;
}

interface IBuildInfoFileService {
	saveBuildInfoFile(platformData: IPlatformData, buildInfoFileDirname: string): void;
	getBuildInfoFromFile(platformData: IPlatformData, buildData: IBuildData): IBuildInfo;
}