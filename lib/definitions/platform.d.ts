interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<void>;
	getInstalledPlatforms(): IFuture<string[]>;
	getAvailablePlatforms(): IFuture<string[]>;
	runPlatform(platform: string): IFuture<void>;
	preparePlatform(platform: string): IFuture<void>;
	buildPlatform(platform: string): IFuture<void>;
}

interface IPlatformCapabilities {
	targetedOS?: string[];
	frameworkUrl: string;
}