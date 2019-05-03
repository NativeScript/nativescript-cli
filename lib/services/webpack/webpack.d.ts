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

	interface IProjectChangesService {
		checkForChanges(platform: string, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<IProjectChangesInfo>;
		getPrepareInfoFilePath(platformData: IPlatformData): string;
		getPrepareInfo(platformData: IPlatformData): IPrepareInfo;
		savePrepareInfo(platformData: IPlatformData): void;
		setNativePlatformStatus(platformData: IPlatformData, addedPlatform: IAddedNativePlatform): void;
		currentChanges: IProjectChangesInfo;
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