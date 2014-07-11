interface IPlatformService {
    addPlatforms(platforms: string[]): Future<any>;
}

interface IPlatformCapabilities {
    targetedOS: string[];
    frameworkUrl: string;
}