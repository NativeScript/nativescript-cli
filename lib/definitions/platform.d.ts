interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<void>;
	getInstalledPlatforms(): IFuture<string[]>;
	getAvailablePlatforms(): IFuture<string[]>;
	runPlatform(platform: string): IFuture<void>;
	preparePlatform(platform: string): IFuture<void>;
	buildPlatform(platform: string): IFuture<void>;
}

interface IPlatformData {
	frameworkPackageName: string;
	platformProjectService: IPlatformSpecificProjectService;
	projectRoot: string;
	normalizedPlatformName: string;
	targetedOS?: string[];
}

interface IPlatformsData {
	platformsNames: string[];
	getPlatformData(platform: string): IPlatformData;
}

