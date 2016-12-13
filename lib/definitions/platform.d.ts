interface IPlatformService {
	addPlatforms(platforms: string[]): IFuture<void>;

	/**
	 * Gets list of all installed platforms (the ones for which <project dir>/platforms/<platform> exists).
	 * @returns {string[]} List of currently installed platforms.
	 */
	getInstalledPlatforms(): string[];

	/**
	 * Gets a list of all platforms that can be used on current OS, but are not installed at the moment.
	 * @returns {string[]} List of all available platforms.
	 */
	getAvailablePlatforms(): string[];

	/**
	 * Returns a list of all currently prepared platforms.
	 * @returns {string[]} List of all prepared platforms.
	 */
	getPreparedPlatforms(): string[];

	/**
	 * Remove platforms from specified project (`<project dir>/platforms/<platform>` dir).
	 * @param {string[]} platforms Platforms to be removed.
	 * @returns {void}
	 */
	removePlatforms(platforms: string[]): void;

	updatePlatforms(platforms: string[]): IFuture<void>;
	preparePlatform(platform: string, force?: boolean, skipModulesAndResources?: boolean): IFuture<boolean>;
	buildPlatform(platform: string, buildConfig?: IBuildConfig, forceBuild?: boolean): IFuture<void>;
	deployPlatform(platform: string): IFuture<void>;
	runPlatform(platform: string): IFuture<void>;
	emulatePlatform(platform: string): IFuture<void>;
	cleanDestinationApp(platform: string): IFuture<void>;
	validatePlatformInstalled(platform: string): void;
	validatePlatform(platform: string): void;

	/**
	 * Returns information about the latest built application for device in the current project.
	 * @param {IPlatformData} platformData Data describing the current platform.
	 * @returns {IApplicationPackage} Information about latest built application.
	 */
	getLatestApplicationPackageForDevice(platformData: IPlatformData): IApplicationPackage;

	/**
	 * Returns information about the latest built application for simulator in the current project.
	 * @param {IPlatformData} platformData Data describing the current platform.
	 * @returns {IApplicationPackage} Information about latest built application.
	 */
	getLatestApplicationPackageForEmulator(platformData: IPlatformData): IApplicationPackage;

	/**
	 * Copies latest build output to a specified location.
	 * @param {string} platform Mobile platform - Android, iOS.
	 * @param {string} targetPath Destination where the build artifact should be copied.
	 * @param {{isForDevice: boolean}} settings Defines if the searched artifact should be for simulator.
	 * @returns {void}
	 */
	copyLastOutput(platform: string, targetPath: string, settings: {isForDevice: boolean}): void;

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