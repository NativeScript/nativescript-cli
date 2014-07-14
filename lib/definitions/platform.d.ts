interface IPlatformService {
    addPlatforms(platforms: string[]): IFuture<any>;
}

interface IPlatformCapabilities {
    targetedOS?: string[];
    frameworkUrl: string;
}