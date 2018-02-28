
interface IBuildOptions {
    platformsAndroidDirPath: string,
    pluginName: string,
    aarOutputDir: string,
    tempPluginDirPath: string
}

interface IAndroidPluginBuildService {
	buildAar(options: IBuildOptions): Promise<boolean>;
	migrateIncludeGradle(options: IBuildOptions): void;
}
