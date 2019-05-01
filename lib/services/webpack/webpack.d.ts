import { EventEmitter } from "events";
import { PreparePlatformData, BuildPlatformDataBase, WorkflowData } from "../workflow/workflow-data-service";

declare global {
	interface IWebpackCompilerService extends EventEmitter {
		compileWithWatch(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<any>;
		compileWithoutWatch(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void>;
	}

	interface IWebpackCompilerConfig {
		env: IWebpackEnvOptions;
		watch?: boolean;
	}

	interface IWebpackEnvOptions {

	}

	interface IPreparePlatformService {
		addPlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void>;
		preparePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<boolean>;
	}

	interface IPlatformBuildService {
		buildPlatform<T extends BuildPlatformDataBase>(platformData: IPlatformData, projectData: IProjectData, buildPlatformData: T): Promise<string>
		buildPlatformIfNeeded<T extends BuildPlatformDataBase>(platformData: IPlatformData, projectData: IProjectData, buildPlatformData: T, outputPath?: string): Promise<string>;
		saveBuildInfoFile(platformData: IPlatformData, projectData: IProjectData, buildInfoFileDirname: string): void;
		getBuildInfoFromFile(platformData: IPlatformData, buildConfig: BuildPlatformDataBase, buildOutputPath?: string): IBuildInfo;
	}

	interface IProjectChangesService {
		checkForChanges(platform: string, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<IProjectChangesInfo>;
		getPrepareInfoFilePath(platformData: IPlatformData): string;
		getPrepareInfo(platformData: IPlatformData): IPrepareInfo;
		savePrepareInfo(platformData: IPlatformData): void;
		setNativePlatformStatus(platformData: IPlatformData, addedPlatform: IAddedNativePlatform): void;
		currentChanges: IProjectChangesInfo;
	}

	interface IPlatformService extends IBuildPlatformAction, NodeJS.EventEmitter {
		/**
		 * Ensures that the specified platform and its dependencies are installed.
		 * When there are changes to be prepared, it prepares the native project for the specified platform.
		 * When finishes, prepare saves the .nsprepareinfo file in platform folder.
		 * This file contains information about current project configuration and allows skipping unnecessary build, deploy and livesync steps.
		 * @param {IPreparePlatformInfo} platformInfo Options to control the preparation.
		 * @returns {boolean} true indicates that the platform was prepared.
		 */
		preparePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<boolean>;
	
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
		 *
		 * @param {Mobile.IDevice} device The device where the application should be installed.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @param {string} @optional outputPath Directory containing build information and artifacts.
		 */
		validateInstall(device: Mobile.IDevice, projectData: IProjectData, release: IRelease, outputPath?: string): Promise<void>;
	
		/**
		 * Installs the application on specified device.
		 * When finishes, saves .nsbuildinfo in application root folder to indicate the prepare that was used to build the app.
		 * * .nsbuildinfo is not persisted when building for release.
		 * @param {Mobile.IDevice} device The device where the application should be installed.
		 * @param {IBuildConfig} options The build configuration.
		 * @param {string} @optional pathToBuiltApp Path to build artifact.
		 * @param {string} @optional outputPath Directory containing build information and artifacts.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @returns {void}
		 */
		installApplication(device: Mobile.IDevice, options: IBuildConfig, projectData: IProjectData, pathToBuiltApp?: string, outputPath?: string): Promise<void>;
	
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
		startApplication(platform: string, runOptions: IRunPlatformOptions, appData: Mobile.IStartApplicationData): Promise<void>;
	
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

	interface IPlatformWatcherService extends EventEmitter {
		startWatcher(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<void>;
	}

	interface IFilesChangeEventData {
		platform: string;
		files: string[];
		hasNativeChanges: boolean;
	}

	interface IInitialSyncEventData {
		platform: string;
		hasNativeChanges: boolean;
	}

	interface IDeviceInstallationService {
		installOnDevice(device: Mobile.IDevice, platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig, packageFile?: string, outputFilePath?: string): Promise<void>;
		installOnDeviceIfNeeded(device: Mobile.IDevice, platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig, packageFile?: string, outputFilePath?: string): Promise<void>;
		getDeviceBuildInfoFilePath(device: Mobile.IDevice, projectData: IProjectData): Promise<string>;
	}

	interface IDeviceRestartApplicationService {
		restartOnDevice(deviceDescriptor: ILiveSyncDeviceInfo, projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, platformLiveSyncService: IPlatformLiveSyncService): Promise<IRestartApplicationInfo | IDebugInformation>;
	}

	interface IPlatformProjectService extends NodeJS.EventEmitter, IPlatformProjectServiceBase {
		getPlatformData(projectData: IProjectData): IPlatformData;
		validate(projectData: IProjectData, options: IOptions, notConfiguredEnvOptions?: INotConfiguredEnvOptions): Promise<IValidatePlatformOutput>;
		createProject(frameworkDir: string, frameworkVersion: string, projectData: IProjectData, config: ICreateProjectOptions): Promise<void>;
		interpolateData(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void>;
		interpolateConfigurationFile<T extends PreparePlatformData>(projectData: IProjectData, preparePlatformData: PreparePlatformData): void;

		/**
		 * Executes additional actions after native project is created.
		 * @param {string} projectRoot Path to the real NativeScript project.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @returns {void}
		 */
		afterCreateProject(projectRoot: string, projectData: IProjectData): void;

		/**
		 * Gets first chance to validate the options provided as command line arguments.
		 * @param {string} projectId Project identifier - for example org.nativescript.test.
		 * @param {any} provision UUID of the provisioning profile used in iOS option validation.
		 * @returns {void}
		 */
		validateOptions(projectId?: string, provision?: true | string, teamId?: true | string): Promise<boolean>;

		buildProject<T extends BuildPlatformDataBase>(projectRoot: string, projectData: IProjectData, buildConfig: T): Promise<void>;

		/**
		 * Prepares images in Native project (for iOS).
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @param {any} platformSpecificData Platform specific data required for project preparation.
		 * @returns {void}
		 */
		prepareProject<T extends PreparePlatformData>(projectData: IProjectData, preparePlatformData: T): Promise<void>;

		/**
		 * Prepares App_Resources in the native project by clearing data from other platform and applying platform specific rules.
		 * @param {string} appResourcesDirectoryPath The place in the native project where the App_Resources are copied first.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @returns {void}
		 */
		prepareAppResources(appResourcesDirectoryPath: string, projectData: IProjectData): void;

		/**
		 * Defines if current platform is prepared (i.e. if <project dir>/platforms/<platform> dir exists).
		 * @param {string} projectRoot The project directory (path where root's package.json is located).
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @returns {boolean} True in case platform is prepare (i.e. if <project dir>/platforms/<platform> dir exists), false otherwise.
		 */
		isPlatformPrepared(projectRoot: string, projectData: IProjectData): boolean;

		/**
		 * Checks if current platform can be updated to a newer versions.
		 * @param {string} newInstalledModuleDir Path to the native project.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @return {boolean} True if platform can be updated. false otherwise.
		 */
		canUpdatePlatform(newInstalledModuleDir: string, projectData: IProjectData): boolean;

		preparePluginNativeCode(pluginData: IPluginData, options?: any): Promise<void>;

		/**
		 * Removes native code of a plugin (CocoaPods, jars, libs, src).
		 * @param {IPluginData} Plugins data describing the plugin which should be cleaned.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @returns {void}
		 */
		removePluginNativeCode(pluginData: IPluginData, projectData: IProjectData): Promise<void>;

		beforePrepareAllPlugins(projectData: IProjectData, dependencies?: IDependencyData[]): Promise<void>;

		handleNativeDependenciesChange(projectData: IProjectData, opts: IRelease): Promise<void>;

		/**
		 * Gets the path wheren App_Resources should be copied.
		 * @returns {string} Path to native project, where App_Resources should be copied.
		 */
		getAppResourcesDestinationDirectoryPath(projectData: IProjectData): string;

		cleanDeviceTempFolder(deviceIdentifier: string, projectData: IProjectData): Promise<void>;
		processConfigurationFilesFromAppResources(projectData: IProjectData, opts: { release: boolean }): Promise<void>;

		/**
		 * Ensures there is configuration file (AndroidManifest.xml, Info.plist) in app/App_Resources.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @returns {void}
		 */
		ensureConfigurationFileInAppResources(projectData: IProjectData): void;

		/**
		 * Stops all running processes that might hold a lock on the filesystem.
		 * Android: Gradle daemon processes are terminated.
		 * @param {IPlatformData} platformData The data for the specified platform.
		 * @returns {void}
		 */
		stopServices?(projectRoot: string): Promise<ISpawnResult>;

		/**
		 * Removes build artifacts specific to the platform
		 * @param {string} projectRoot The root directory of the native project.
		 * @param {IProjectData} projectData DTO with information about the project.
		 * @returns {void}
		 */
		cleanProject?(projectRoot: string, projectData: IProjectData): Promise<void>

		/**
		 * Check the current state of the project, and validate against the options.
		 * If there are parts in the project that are inconsistent with the desired options, marks them in the changeset flags.
		 */
		checkForChanges<T extends PreparePlatformData>(changeset: IProjectChangesInfo, preparePlatformData: T, projectData: IProjectData): Promise<void>;

		/**
		 * Get the deployment target's version
		 * Currently implemented only for iOS -> returns the value of IPHONEOS_DEPLOYMENT_TARGET property from xcconfig file
		 */
		getDeploymentTarget?(projectData: IProjectData): any;
	}
}