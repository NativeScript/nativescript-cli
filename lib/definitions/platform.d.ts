/**
 * Describes information about how to build the native project.
 */
interface IBuildPlatformAction {
	/**
	 * Builds the native project for the specified platform for device or emulator.
	 * When finishes, build saves the .nsbuildinfo file in platform product folder.
	 * This file points to the prepare that was used to build the project and allows skipping unnecessary builds and deploys.
	 * @param {string} platform The platform to build.
	 * @param {IBuildConfig} buildConfig Indicates whether the build is for device or emulator.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {Promise<string>} The path to the built file.
	 */
	buildPlatform(platform: string, buildConfig: IBuildConfig, projectData: IProjectData): Promise<string>;
}

interface IPlatformService extends IBuildPlatformAction, NodeJS.EventEmitter {
	cleanPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, framework?: string): Promise<void>;

	addPlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions, frameworkPath?: string): Promise<void>;

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

	updatePlatforms(platforms: string[], platformTemplate: string, projectData: IProjectData, config: IPlatformOptions): Promise<void>;

	/**
	 * Ensures that the specified platform and its dependencies are installed.
	 * When there are changes to be prepared, it prepares the native project for the specified platform.
	 * When finishes, prepare saves the .nsprepareinfo file in platform folder.
	 * This file contains information about current project configuration and allows skipping unnecessary build, deploy and livesync steps.
	 * @param {IPreparePlatformInfo} platformInfo Options to control the preparation.
	 * @returns {boolean} true indicates that the platform was prepared.
	 */
	preparePlatform(platformInfo: IPreparePlatformInfo): Promise<boolean>;

	/**
	 * Determines whether a build is necessary. A build is necessary when one of the following is true:
	 * - there is no previous build.
	 * - the .nsbuildinfo file in product folder points to an old prepare.
	 * @param {string} platform The platform to build.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {IBuildConfig} @optional buildConfig Indicates whether the build is for device or emulator.
	 * @param {string} @optional outputPath Directory containing build information and artifacts.
	 * @returns {boolean} true indicates that the platform should be build.
	 */
	shouldBuild(platform: string, projectData: IProjectData, buildConfig?: IBuildConfig, outputPath?: string): Promise<boolean>;

	/**
	 * Determines whether installation is necessary. It is necessary when one of the following is true:
	 * - the application is not installed.
	 * - the .nsbuildinfo file located in application root folder is different than the local .nsbuildinfo file
	 * @param {Mobile.IDevice} device The device where the application should be installed.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {string} @optional outputPath Directory containing build information and artifacts.
	 * @returns {Promise<boolean>} true indicates that the application should be installed.
	 */
	shouldInstall(device: Mobile.IDevice, projectData: IProjectData, release: IRelease, outputPath?: string): Promise<boolean>;

	/**
	 * Determines whether the project should undergo the prepare process.
	 * @param {IShouldPrepareInfo} shouldPrepareInfo Options needed to decide whether to prepare.
	 * @returns {Promise<boolean>} true indicates that the project should be prepared.
	 */
	shouldPrepare(shouldPrepareInfo: IShouldPrepareInfo): Promise<boolean>;

	/**
	 * Installs the application on specified device.
	 * When finishes, saves .nsbuildinfo in application root folder to indicate the prepare that was used to build the app.
	 * * .nsbuildinfo is not persisted when building for release.
	 * @param {Mobile.IDevice} device The device where the application should be installed.
	 * @param {IRelease} options Whether the application was built in release configuration.
	 * @param {string} @optional pathToBuiltApp Path to build artifact.
	 * @param {string} @optional outputPath Directory containing build information and artifacts.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	installApplication(device: Mobile.IDevice, options: IRelease, projectData: IProjectData, pathToBuiltApp?: string, outputPath?: string): Promise<void>;

	/**
	 * Gets first chance to validate the options provided as command line arguments.
	 * If no platform is provided or a falsy (null, undefined, "", false...) platform is provided,
	 * the options will be validated for all available platforms.
	 */
	validateOptions(provision: true | string, teamId: true | string, projectData: IProjectData, platform?: string): Promise<boolean>;

	/**
	 * Executes prepare, build and installOnPlatform when necessary to ensure that the latest version of the app is installed on specified platform.
	 * - When --clean option is specified it builds the app on every change. If not, build is executed only when there are native changes.
	 * @param {IDeployPlatformInfo} deployInfo Options required for project preparation and deployment.
	 * @returns {void}
	 */
	deployPlatform(deployInfo: IDeployPlatformInfo): Promise<void>;

	/**
	 * Runs the application on specified platform. Assumes that the application is already build and installed. Fails if this is not true.
	 * @param {string} platform The platform where to start the application.
	 * @param {IRunPlatformOptions} runOptions Various options that help manage the run operation.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	startApplication(platform: string, runOptions: IRunPlatformOptions, appData: Mobile.IApplicationData): Promise<void>;

	cleanDestinationApp(platformInfo: IPreparePlatformInfo): Promise<void>;
	validatePlatformInstalled(platform: string, projectData: IProjectData): void;

	/**
	 * Ensures the passed platform is a valid one (from the supported ones)
	 */
	validatePlatform(platform: string, projectData: IProjectData): void;

	/**
	 * Checks whether passed platform can be built on the current OS
	 * @param {string} platform The mobile platform.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {boolean} Whether the platform is supported for current OS or not.
	 */
	isPlatformSupportedForOS(platform: string, projectData: IProjectData): boolean;

	/**
	 * Returns information about the latest built application for device in the current project.
	 * @param {IPlatformData} platformData Data describing the current platform.
	 * @param {IBuildConfig} buildConfig Defines if the build is for release configuration.
	 * @param {string} @optional outputPath Directory that should contain the build artifact.
	 * @returns {IApplicationPackage} Information about latest built application.
	 */
	getLatestApplicationPackageForDevice(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage;

	/**
	 * Returns information about the latest built application for simulator in the current project.
	 * @param {IPlatformData} platformData Data describing the current platform.
	 * @param {IBuildConfig} buildConfig Defines if the build is for release configuration.
	 * @param {string} @optional outputPath Directory that should contain the build artifact.
	 * @returns {IApplicationPackage} Information about latest built application.
	 */
	getLatestApplicationPackageForEmulator(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage;

	/**
	 * Copies latest build output to a specified location.
	 * @param {string} platform Mobile platform - Android, iOS.
	 * @param {string} targetPath Destination where the build artifact should be copied.
	 * @param {IBuildConfig} buildConfig Defines if the searched artifact should be for simulator and is it built for release.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	copyLastOutput(platform: string, targetPath: string, buildConfig: IBuildConfig, projectData: IProjectData): void;

	/**
	 * Gets the latest build output.
	 * @param {string} platform Mobile platform - Android, iOS.
	 * @param {IBuildConfig} buildConfig Defines if the searched artifact should be for simulator and is it built for release.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {string} @optional outputPath Directory that should contain the build artifact.
	 * @returns {string} The path to latest built artifact.
	 */
	lastOutputPath(platform: string, buildConfig: IBuildConfig, projectData: IProjectData, outputPath?: string): string;

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

	/**
	 * Sends information to analytics for specific platform related action, for example Build, LiveSync, etc.
	 * @param {ITrackPlatformAction} actionData The data describing current action.
	 * @returns {Promise<void>}
	 */
	trackActionForPlatform(actionData: ITrackPlatformAction): Promise<void>;

	/**
	 * Saves build information in a proprietary file.
	 * @param {string} platform The build platform.
	 * @param {string} projectDir The project's directory.
	 * @param {string} buildInfoFileDirname The directory where the build file should be written to.
	 * @returns {void}
	 */
	saveBuildInfoFile(platform: string, projectDir: string, buildInfoFileDirname: string): void;

	/**
	 * Gives information for the current version of the runtime.
	 * @param {string} platform The platform to be checked.
	 * @param {IProjectData} projectData The data describing the project
	 * @returns {string} Runtime version
	 */
	getCurrentPlatformVersion(platform: string, projectData: IProjectData): string;
}

interface IPlatformOptions extends IPlatformSpecificData, ICreateProjectOptions { }

/**
 * Platform specific data required for project preparation.
 */
interface IPlatformSpecificData extends IProvision, ITeamIdentifier {
	/**
	 * Target SDK for Android.
	 */
	sdk: string;

	/**
	 * Data from mobileProvision.
	 */
	mobileProvisionData?: any;
}

/**
 * Describes information that will be tracked for specific action related for platforms - build, livesync, etc.
 */
interface ITrackPlatformAction extends IPlatform {
	/**
	 * Name of the action.
	 */
	action: string;

	/**
	 * Defines if the action is for device or emulator.
	 */
	isForDevice: boolean;

	/**
	 * Defines the OS version of the device for which the action will be executed.
	 */
	deviceOsVersion?: string;
}

interface IPlatformData {
	frameworkPackageName: string;
	platformProjectService: IPlatformProjectService;
	projectRoot: string;
	normalizedPlatformName: string;
	appDestinationDirectoryPath: string;
	deviceBuildOutputPath: string;
	emulatorBuildOutputPath?: string;
	getValidBuildOutputData(buildOptions: IBuildOutputOptions): IValidBuildOutputData;
	frameworkFilesExtensions: string[];
	frameworkDirectoriesExtensions?: string[];
	frameworkDirectoriesNames?: string[];
	targetedOS?: string[];
	configurationFileName?: string;
	configurationFilePath?: string;
	relativeToFrameworkConfigurationFilePath: string;
	fastLivesyncFileExtensions: string[];
}

interface IValidBuildOutputData {
	packageNames: string[];
	regexes?: RegExp[];
}

interface IBuildOutputOptions {
	isReleaseBuild?: boolean;
	isForDevice?: boolean;
}

interface IPlatformsData {
	availablePlatforms: any;
	platformsNames: string[];
	getPlatformData(platform: string, projectData: IProjectData): IPlatformData;
}

interface IAppFilesUpdaterOptionsComposition {
	appFilesUpdaterOptions: IAppFilesUpdaterOptions;
}

interface INodeModulesData extends IPlatform, IProjectDataComposition, IAppFilesUpdaterOptionsComposition {
	absoluteOutputPath: string;
	lastModifiedTime: Date;
	projectFilesConfig: IProjectFilesConfig;
}

interface INodeModulesBuilder {
	prepareNodeModules(nodeModulesData: INodeModulesData): Promise<void>;
	prepareJSNodeModules(jsNodeModulesData: INodeModulesData): Promise<void>;
	cleanNodeModules(absoluteOutputPath: string, platform: string): void;
}

interface INodeModulesDependenciesBuilder {
	getProductionDependencies(projectPath: string): IDependencyData[];
}

interface IBuildInfo {
	prepareTime: string;
	buildTime: string;
}

interface IPlatformDataComposition {
	platformData: IPlatformData;
}

interface ICopyAppFilesData extends IProjectDataComposition, IAppFilesUpdaterOptionsComposition, IPlatformDataComposition, IOptionalFilesToSync, IOptionalFilesToRemove { }

interface IPreparePlatformService {
	addPlatform(info: IAddPlatformInfo): Promise<void>;
	preparePlatform(config: IPreparePlatformJSInfo): Promise<void>;
}

interface IAddPlatformInfo extends IProjectDataComposition, IPlatformDataComposition {
	frameworkDir: string;
	installedVersion: string;
	config: IPlatformOptions;
	platformTemplate?: string;
}

interface IPreparePlatformJSInfo extends IPreparePlatformCoreInfo, ICopyAppFilesData {
	projectFilesConfig?: IProjectFilesConfig;
}

interface IShouldPrepareInfo extends IOptionalProjectChangesInfoComposition {
	platformInfo: IPreparePlatformInfo;
}

interface IOptionalProjectChangesInfoComposition {
	changesInfo?: IProjectChangesInfo;
}

interface IPreparePlatformCoreInfo extends IPreparePlatformInfoBase, IOptionalProjectChangesInfoComposition {
	platformSpecificData: IPlatformSpecificData;
}

interface IPreparePlatformInfo extends IPreparePlatformInfoBase, IPlatformConfig, IPlatformTemplate, ISkipNativeCheckOptional { }

interface IPlatformConfig {
	config: IPlatformOptions;
}

interface IOptionalFilesToSync {
	filesToSync?: string[];
}

interface IOptionalFilesToRemove {
	filesToRemove?: string[];
}

interface IPreparePlatformInfoBase extends IPlatform, IAppFilesUpdaterOptionsComposition, IProjectDataComposition, IEnvOptions, IOptionalFilesToSync, IOptionalFilesToRemove, IOptionalNativePrepareComposition { 
	skipCopyTnsModules?: boolean;
	skipCopyAppResourcesFiles?: boolean;
}

interface IOptionalNativePrepareComposition {
	nativePrepare?: INativePrepare;
}

interface IOptionalWatchAllFiles {
	watchAllFiles?: boolean;
}

interface IDeployPlatformInfo extends IPlatform, IAppFilesUpdaterOptionsComposition, IProjectDataComposition, IPlatformConfig, IEnvOptions, IOptionalNativePrepareComposition, IOptionalOutputPath, IBuildPlatformAction {
	deployOptions: IDeployPlatformOptions
}

interface IUpdateAppOptions extends IOptionalFilesToSync, IOptionalFilesToRemove {
	beforeCopyAction: (sourceFiles: string[]) => void;
}

interface IPlatformEnvironmentRequirements {
	checkEnvironmentRequirements(platform?: string, projectDir?: string, runtimeVersion?: string): Promise<ICheckEnvironmentRequirementsOutput>;
}

interface ICheckEnvironmentRequirementsOutput {
	canExecute: boolean;
	selectedOption: string;
}
