
interface IBuildOptions {
    platformsAndroidDirPath: string,
    pluginName: string,
    aarOutputDir: string,
    tempPluginDirPath: string,
    platformData: IPlatformData //don't make optional! (makes sure the plugins are built with the same parameters as the project),
}

interface IAndroidPluginBuildService {
	buildAar(options: IBuildOptions): Promise<boolean>;
	migrateIncludeGradle(options: IBuildOptions): void;
}
