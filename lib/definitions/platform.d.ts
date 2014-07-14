interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<any>;
	getInstalledPlatforms(): IFuture<string[]>;
	getAvailablePlatforms(): IFuture<string[]>;
}

interface IPlatformCapabilities {
	targetedOS?: string[];
	frameworkUrl: string;
}