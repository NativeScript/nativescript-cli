interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<void>;
	getInstalledPlatforms(): IFuture<string[]>;
	getAvailablePlatforms(): IFuture<string[]>;

	/**
	 * Returns a list of all currently prepared platforms.
	 * @returns {string[]} List of all prepared platforms.
	 */
	getPreparedPlatforms(): string[];

	removePlatforms(platforms: string[]): IFuture<void>;
	updatePlatforms(platforms: string[]): IFuture<void>;
	preparePlatform(platform: string, force?: boolean, skipModulesAndResources?: boolean): IFuture<boolean>;
	buildPlatform(platform: string, buildConfig?: IBuildConfig, forceBuild?: boolean): IFuture<void>;
	deployPlatform(platform: string): IFuture<void>;
	runPlatform(platform: string): IFuture<void>;
	emulatePlatform(platform: string): IFuture<void>;
	cleanDestinationApp(platform: string): IFuture<void>;
	validatePlatformInstalled(platform: string): void;
	validatePlatform(platform: string): void;

	getLatestApplicationPackageForDevice(platformData: IPlatformData): IFuture<IApplicationPackage>;
	getLatestApplicationPackageForEmulator(platformData: IPlatformData): IFuture<IApplicationPackage>;
	copyLastOutput(platform: string, targetPath: string, settings: {isForDevice: boolean}): IFuture<void>;
	lastOutputPath(platform: string, settings: { isForDevice: boolean }): string;
	ensurePlatformInstalled(platform: string): IFuture<void>;
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

interface INodeModulesDependenciesBuilder {
	getProductionDependencies(projectPath: string): void;
}