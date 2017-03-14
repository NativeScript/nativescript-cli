interface IPlatformService extends NodeJS.EventEmitter {
	cleanPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, framework?: string): Promise<void>;
	
	addPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, frameworkPath?: string): Promise<void>;

	/**
	 * Gets list of all installed platforms (the ones for which <project dir>/platforms/<platform> exists).
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {string[]} List of currently installed platforms.
	 */
	getInstalledPlatforms(projectData: IProjectData): string[];

	/**
	 * Gets a list of all platforms that can be used on current OS, but are not installed at the moment.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {string[]} List of all available platforms.
	 */
	getAvailablePlatforms(projectData: IProjectData): string[];

	/**
	 * Returns a list of all currently prepared platforms.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {string[]} List of all prepared platforms.
	 */
	getPreparedPlatforms(projectData: IProjectData): string[];

	/**
	 * Remove platforms from specified project (`<project dir>/platforms/<platform>` dir).
	 * @param {string[]} platforms Platforms to be removed.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {Promise<void>}
	 */
	removePlatforms(platforms: string[], projectData: IProjectData): Promise<void>;

	updatePlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void>;

	/**
	 * Ensures that the specified platform and its dependencies are installed.
	 * When there are changes to be prepared, it prepares the native project for the specified platform.
	 * When finishes, prepare saves the .nsprepareinfo file in platform folder.
	 * This file contains information about current project configuration and allows skipping unnecessary build, deploy and livesync steps.
	 * @param {string} platform The platform to be prepared.
	 * @param {IAppFilesUpdaterOptions} appFilesUpdaterOptions Options needed to instantiate AppFilesUpdater class.
	 * @param {string} platformTemplate The name of the platform template.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {IPlatformSpecificData} platformSpecificData Platform specific data required for project preparation.
	 * @param {Array} filesToSync Files about to be synced to device.
	 * @returns {boolean} true indicates that the platform was prepared.
	 */
	preparePlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, filesToSync?: Array<String>): Promise<boolean>;

	/**
	 * Determines whether a build is necessary. A build is necessary when one of the following is true:
	 * - there is no previous build.
	 * - the .nsbuildinfo file in product folder points to an old prepare.
	 * @param {string} platform The platform to build.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {IBuildConfig} buildConfig Indicates whether the build is for device or emulator.
	 * @returns {boolean} true indicates that the platform should be build.
	 */
	shouldBuild(platform: string, projectData: IProjectData, buildConfig?: IBuildConfig): Promise<boolean>;

	/**
	 * Builds the native project for the specified platform for device or emulator.
	 * When finishes, build saves the .nsbuildinfo file in platform product folder.
	 * This file points to the prepare that was used to build the project and allows skipping unnecessary builds and deploys.
	 * @param {string} platform The platform to build.
	 * @param {IBuildConfig} buildConfig Indicates whether the build is for device or emulator.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	buildPlatform(platform: string, buildConfig: IBuildConfig, projectData: IProjectData): Promise<void>;

	/**
	 * Determines whether installation is necessary. It is necessary when one of the following is true:
	 * - the application is not installed.
	 * - the .nsbuildinfo file located in application root folder is different than the local .nsbuildinfo file
	 * @param {Mobile.IDevice} device The device where the application should be installed.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {Promise<boolean>} true indicates that the application should be installed.
	 */
	shouldInstall(device: Mobile.IDevice, projectData: IProjectData): Promise<boolean>;

	/**
	 * Installs the application on specified device.
	 * When finishes, saves .nsbuildinfo in application root folder to indicate the prepare that was used to build the app.
	 * * .nsbuildinfo is not persisted when building for release.
	 * @param {Mobile.IDevice} device The device where the application should be installed.
	 * @param {IRelease} options Whether the application was built in release configuration.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	installApplication(device: Mobile.IDevice, options: IRelease, projectData: IProjectData): Promise<void>;

	/**
	 * Gets first chance to validate the options provided as command line arguments.
	 * If no platform is provided or a falsy (null, undefined, "", false...) platform is provided,
	 * the options will be validated for all available platforms.
	 */
	validateOptions(provision: any, projectData: IProjectData, platform?: string): Promise<boolean>;

	/**
	 * Executes prepare, build and installOnPlatform when necessary to ensure that the latest version of the app is installed on specified platform.
	 * - When --clean option is specified it builds the app on every change. If not, build is executed only when there are native changes.
	 * @param {string} platform The platform to deploy.
	 * @param {IAppFilesUpdaterOptions} appFilesUpdaterOptions Options needed to instantiate AppFilesUpdater class.
	 * @param {IDeployPlatformOptions} deployOptions Various options that can manage the deploy operation.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {any} platformSpecificData Platform specific data required for project preparation.
	 * @returns {void}
	 */
	deployPlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, deployOptions: IDeployPlatformOptions, projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void>;

	/**
	 * Runs the application on specified platform. Assumes that the application is already build and installed. Fails if this is not true.
	 * @param {string} platform The platform where to start the application.
	 * @param {IRunPlatformOptions} runOptions Various options that help manage the run operation.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	startApplication(platform: string, runOptions: IRunPlatformOptions, projectData: IProjectData): Promise<void>;

	/**
	 * The emulate command. In addition to `run --emulator` command, it handles the `--available-devices` option to show the available devices.
	 * @param {string} platform The platform to emulate.
	 * @param {IAppFilesUpdaterOptions} appFilesUpdaterOptions Options needed to instantiate AppFilesUpdater class.
	 * @param {IEmulatePlatformOptions} emulateOptions Various options that can manage the emulate operation.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {any} platformSpecificData Platform specific data required for project preparation.
	 * @returns {void}
	 */
	emulatePlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, emulateOptions: IEmulatePlatformOptions, projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void>;

	cleanDestinationApp(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string, projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void>;
	validatePlatformInstalled(platform: string, projectData: IProjectData): void;

	/**
	 * Ensures the passed platform is a valid one (from the supported ones)
	 * and that it can be built on the current OS
	 */
	validatePlatform(platform: string, projectData: IProjectData): void;

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
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	copyLastOutput(platform: string, targetPath: string, settings: {isForDevice: boolean}, projectData: IProjectData): void;

	lastOutputPath(platform: string, settings: { isForDevice: boolean }, projectData: IProjectData): string;

	/**
	 * Reads contents of a file on device.
	 * @param {Mobile.IDevice} device The device to read from.
	 * @param {string} deviceFilePath The file path.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {string} The contents of the file or null when there is no such file.
	 */
	readFile(device: Mobile.IDevice, deviceFilePath: string, projectData: IProjectData): Promise<string>;

	/**
	 * Sends information to analytics for current project type.
	 * The information is sent once per process for each project.
	 * In long living process, where the project may change, each of the projects will be tracked after it's being opened.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {Promise<void>}
	 */
	trackProjectType(projectData: IProjectData): Promise<void>;
}

/**
 * Platform specific data required for project preparation.
 */
interface IPlatformSpecificData {
	/**
	 * UUID of the provisioning profile used in iOS project preparation.
	 */
	provision: any;

	/**
	 * Target SDK for Android.s
	 */
	sdk: string;
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
	getPlatformData(platform: string, projectData: IProjectData): IPlatformData;
}

interface INodeModulesBuilder {
	prepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime: Date, projectData: IProjectData): Promise<void>;
	cleanNodeModules(absoluteOutputPath: string, platform: string): void;
}

interface INodeModulesDependenciesBuilder {
	getProductionDependencies(projectPath: string): void;
}

interface IBuildInfo {
	prepareTime: string;
	buildTime: string;
}
