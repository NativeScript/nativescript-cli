interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<void>;
	getInstalledPlatforms(): IFuture<string[]>;
	getAvailablePlatforms(): IFuture<string[]>;
	removePlatforms(platforms: string[]): IFuture<void>;
	runPlatform(platform: string): IFuture<void>;
	preparePlatform(platform: string): IFuture<void>;
	buildPlatform(platform: string): IFuture<void>;
	deploy(platform: string): IFuture<void>;
	removePlatforms(platforms: string[]): IFuture<void>;
	updatePlatforms(platforms: string[]): IFuture<void>;
}

interface IPlatformData {
	frameworkPackageName: string;
	platformProjectService: IPlatformProjectService;
	projectRoot: string;
	normalizedPlatformName: string;
	buildOutputPath: string;
	validPackageNames: string[];
	targetedOS?: string[];
}

interface IPlatformsData {
	platformsNames: string[];
	getPlatformData(platform: string): IPlatformData;
}

