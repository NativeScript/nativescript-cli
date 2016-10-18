interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<void>;
	getInstalledPlatforms(): IFuture<string[]>;
	getAvailablePlatforms(): IFuture<string[]>;
	getPreparedPlatforms(): IFuture<string[]>;
	removePlatforms(platforms: string[]): IFuture<void>;
	updatePlatforms(platforms: string[]): IFuture<void>;
	runPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	preparePlatform(platform: string, force?: boolean, skipModulesAndResources?: boolean): IFuture<boolean>;
	cleanDestinationApp(platform: string): IFuture<void>;
	buildPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	buildForDeploy(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	installOnDevice(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	deployOnDevice(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	startOnDevice(platform: string): IFuture<void>;
	deployOnEmulator(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	validatePlatformInstalled(platform: string): void;
	validatePlatform(platform: string): void;

	getLatestApplicationPackageForDevice(platformData: IPlatformData): IFuture<IApplicationPackage>;
	getLatestApplicationPackageForEmulator(platformData: IPlatformData): IFuture<IApplicationPackage>;
	copyLastOutput(platform: string, targetPath: string, settings: {isForDevice: boolean}): IFuture<void>;
	lastOutputPath(platform: string, settings: { isForDevice: boolean }): string;
	ensurePlatformInstalled(platform: string): IFuture<void>;

	prepareAndBuild(platform: string, buildConfig?: IBuildConfig, forceBuild?: boolean): IFuture<void>;
}

interface IPlatformData {
	frameworkPackageName: string;
	platformProjectService: IPlatformProjectService;
	emulatorServices: Mobile.IEmulatorPlatformServices;
	projectRoot: string;
	normalizedPlatformName: string;
	appDestinationDirectoryPath: string;
	deviceBuildOutputPath: string;
	emulatorBuildOutputPath?: string;
	validPackageNamesForDevice: string[];
	validPackageNamesForEmulator?: string[];
	frameworkFilesExtensions: string[];
	frameworkDirectoriesExtensions?: string[];
	frameworkDirectoriesNames?: string[];
	targetedOS?: string[];
	configurationFileName?: string;
	configurationFilePath?: string;
	relativeToFrameworkConfigurationFilePath: string;
	fastLivesyncFileExtensions: string[];
}

interface IPlatformsData {
	availablePlatforms: any;
	platformsNames: string[];
	getPlatformData(platform: string): IPlatformData;
}

interface INodeModulesBuilder {
	prepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime: Date): IFuture<void>;
	cleanNodeModules(absoluteOutputPath: string, platform: string): void;
}
