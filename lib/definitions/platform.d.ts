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

	/**
	 * Ensures that the specified platform and its dependencies are installed.
	 * When there are changes to be prepared, it prepares the native project for the specified platform.
	 * When finishes, prepare saves the .nsprepareinfo file in platform folder.
	 * This file contains information about current project configuration and allows skipping unnecessary build, deploy and livesync steps.
	 * @param {string} platform The platform to be prepared.
	 * @returns {boolean} true indicates that the platform was prepared.
	 */
	preparePlatform(platform: string, changesInfo?: IProjectChangesInfo): IFuture<boolean>;

	/**
	 * Determines whether a build is necessary. A build is necessary when one of the following is true:
	 * - there is no previous build.
	 * - the .nsbuildinfo file in product folder points to an old prepare.
	 * @param {string} platform The platform to build.
	 * @param {IBuildConfig} buildConfig Indicates whether the build is for device or emulator.
	 * @returns {boolean} true indicates that the platform should be build.
	 */
	shouldBuild(platform: string, buildConfig?: IBuildConfig): IFuture<boolean>;

	/**
	 * Builds the native project for the specified platform for device or emulator.
	 * When finishes, build saves the .nsbuildinfo file in platform product folder.
	 * This file points to the prepare that was used to build the project and allows skipping unnecessary builds and deploys.
	 * @param {string} platform The platform to build.
	 * @param {IBuildConfig} buildConfig Indicates whether the build is for device or emulator.
	 * @returns {void}
	 */
	buildPlatform(platform: string, buildConfig?: IBuildConfig): IFuture<void>;

	/**
	 * Determines whether installation is necessary. It is necessary when one of the following is true:
	 * - the application is not installed.
	 * - the .nsbuildinfo file located in application root folder is different than the local .nsbuildinfo file
	 * @param {Mobile.IDevice} device The device where the application should be installed.
	 * @returns {boolean} true indicates that the application should be installed.
	 */
	shouldInstall(device: Mobile.IDevice): boolean;

	/**
	 * Installs the application on specified device.
	 * When finishes, saves .nsbuildinfo in application root folder to indicate the prepare that was used to build the app.
	 * * .nsbuildinfo is not persisted when building for release.
	 * @param {Mobile.IDevice} device The device where the application should be installed.
	 * @returns {void}
	 */
	installApplication(device: Mobile.IDevice): IFuture<void>;

	/**
	 * Gets first chance to validate the options provided as command line arguments.
	 * If no platform is provided or a falsy (null, undefined, "", false...) platform is provided,
	 * the options will be validated for all available platforms.
	 */
	validateOptions(platform?: string): IFuture<boolean>;

	/**
	 * Executes prepare, build and installOnPlatform when necessary to ensure that the latest version of the app is installed on specified platform.
	 * - When --clean option is specified it builds the app on every change. If not, build is executed only when there are native changes.
	 * @param {string} platform The platform to deploy.
	 * @param {boolean} forceInstall When true, installs the application unconditionally.
	 * @returns {void}
	 */
	deployPlatform(platform: string, forceInstall?: boolean): IFuture<void>;

	/**
	 * Runs the application on specified platform. Assumes that the application is already build and installed. Fails if this is not true.
	 * @param {string} platform The platform where to start the application.
	 * @returns {void}
	 */
	runPlatform(platform: string): IFuture<void>;

	/**
	 * The emulate command. In addition to `run --emulator` command, it handles the `--available-devices` option to show the available devices.
	 * @param {string} platform The platform to emulate.
	 * @returns {void}
	 */
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

	/**
	 * Reads contents of a file on device.
	 * @param {Mobile.IDevice} device The device to read from.
	 * @param {string} deviceFilePath The file path.
	 * @returns {string} The contents of the file or null when there is no such file.
	 */
	readFile(device: Mobile.IDevice, deviceFilePath: string): IFuture<string>;

	/**
	 * Sends information to analytics for current project type.
	 * The information is sent once per process for each project.
	 * In long living process, where the project may change, each of the projects will be tracked after it's being opened.
	 * @returns {IFuture<void>}
	 */
	trackProjectType(): IFuture<void>;
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

interface IBuildInfo {
	prepareTime: string;
	buildTime: string;
}
