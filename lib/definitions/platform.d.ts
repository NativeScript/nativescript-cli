interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<void>;
	getInstalledPlatforms(): IFuture<string[]>;
	getAvailablePlatforms(): IFuture<string[]>;
	getPreparedPlatforms(): IFuture<string[]>;
	removePlatforms(platforms: string[]): IFuture<void>;
	updatePlatforms(platforms: string[]): IFuture<void>;
	runPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	preparePlatform(platform: string): IFuture<void>;
	buildPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	deployOnDevice(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	deployOnEmulator(platform: string, buildConfig?: IBuildConfig): IFuture<void>;
	validatePlatformInstalled(platform: string): void;
	validatePlatform(platform: string): void;
	addLibrary(platform: string, libraryPath: string): IFuture<void>;

	getLatestApplicationPackageForDevice(platformData: IPlatformData): IFuture<IApplicationPackage>;
	getLatestApplicationPackageForEmulator(platformData: IPlatformData): IFuture<IApplicationPackage>;
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
	mergeXmlConfig?: any[];
}

interface IPlatformsData {
	availablePlatforms: any;
	platformsNames: string[];
	getPlatformData(platform: string): IPlatformData;
}

