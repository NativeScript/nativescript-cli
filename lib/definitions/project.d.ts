import type { BuildNames, SupportedPlatform } from "../constants";
import {
	IAndroidBuildOptionsSettings,
	IProvision,
	ITeamIdentifier,
	IPlatformBuildData,
} from "../declarations";
import { ICheckEnvironmentRequirementsOutput, IPlatformData } from "./platform";
import { IPluginData, IBasePluginData } from "./plugins";
import {
	IStringDictionary,
	IProjectDir,
	IDeviceIdentifier,
	IRelease,
	IPlatform,
	IDependencyInformation,
	ISpawnResult,
} from "../common/declarations";
import { SupportedConfigValues } from "../tools/config-manipulation/config-transformer";
import * as constants from "../constants";
import type { ProjectData } from "../contracts/project-data";
import type { ProjectDataService } from "../contracts/project-data-service";

interface IProjectName {
	/**
	 * Name of the newly created application.
	 */
	projectName: string;
}

interface IProjectSettingsBase extends IProjectName {
	/**
	 * Defines whether the `npm install` command should be executed with `--ignore-scripts` option.
	 * When it is passed, all scripts (postinstall for example) will not be executed.
	 */
	ignoreScripts?: boolean;

	/**
	 * Selected template from which to create the project. If not specified, defaults to hello-world template.
	 * Template can be any npm package, local dir, github url, .tgz file.
	 * If it is set to `angular` or `ng`, default NativeScript Angular Hello World template will be used.
	 * If it is set to `typescript` or `tsc`, default NativeScript TypeScript Hello World template will be used.
	 */
	template?: string;

	/**
	 * Application identifier for the newly created application. If not specified, defaults to org.nativescript.<projectName>.
	 */
	appId?: string;
}

/**
 * Describes information passed to project creation hook (createProject).
 */
interface IProjectCreationSettings extends IProjectSettingsBase, IProjectDir {}

/**
 * Describes available settings when creating new NativeScript application.
 */
interface IProjectSettings extends IProjectSettingsBase {
	/**
	 * Path where the project will be created. If not specified, defaults to current working dir.
	 */
	pathToProject?: string;

	/**
	 * Defines if invalid application name can be used for project creation.
	 */
	force?: boolean;
}

interface ICreateProjectData extends IProjectDir, IProjectName {}

interface IProjectService {
	validateProjectName(opts: {
		projectName: string;
		force: boolean;
		pathToProject: string;
	}): Promise<string>;
	/**
	 * Creates new NativeScript application.
	 * @param {any} projectSettings Options describing new project - its name, appId, path and template from which to be created.
	 * @returns {Promise<void>}
	 */
	createProject(projectSettings: IProjectSettings): Promise<ICreateProjectData>;

	/**
	 * Checks if the specified project is valid NativeScript project.
	 * @param {string} pathToProject Directory to check.
	 * @returns {boolean} returns true if the project is valid NativeScript project.
	 */
	isValidNativeScriptProject(pathToProject?: string): boolean;

	/**
	 * Checks if App_Resources exists, or pulls down a fresh set
	 * from the default template otherwise.
	 * @param {string} projectDir
	 */
	ensureAppResourcesExist(projectDir: string): Promise<void>;
}

interface INsConfigPlaform {
	id?: string;
}

interface IOSSPMPackageBase {
	name: string;
	libs: string[];
	/**
	 * Optional: If you have more targets (like widgets for example)
	 * you can list their names here to include the Swift Package with them
	 */
	targets?: string[];
}

export interface IOSRemoteSPMPackage extends IOSSPMPackageBase {
	repositoryURL: string;
	version: string;
}

export interface IOSLocalSPMPackage extends IOSSPMPackageBase {
	path: string;
}

export type IOSSPMPackage = IOSRemoteSPMPackage | IOSLocalSPMPackage;
export type BundlerType = "webpack" | "rspack" | "vite";

interface INsConfigIOS extends INsConfigPlaform {
	discardUncaughtJsExceptions?: boolean;
	/**
	 * Swift Package Manager
	 * List packages to be included in the iOS build.
	 */
	SPMPackages?: Array<IOSSPMPackage>;
	/**
	 * Custom runtime package name
	 */
	runtimePackageName?: string;
}

interface INSConfigVisionOS extends INsConfigIOS {}

interface INSConfigCatalyst extends INsConfigIOS {}

interface INsConfigAndroid extends INsConfigPlaform {
	v8Flags?: string;

	codeCache?: boolean;

	heapSnapshotScript?: string;

	"snapshot.blob"?: string;

	profilerOutputDir?: string;

	gcThrottleTime?: number;

	profiling?: string;

	markingMode?: string;

	handleTimeZoneChanges?: boolean;

	maxLogcatObjectSize?: number;

	forceLog?: boolean;

	memoryCheckInterval?: number;

	freeMemoryRatio?: number;

	suppressCallJSMethodExceptions?: boolean;

	discardUncaughtJsExceptions?: boolean;

	enableLineBreakpoints?: boolean;

	enableMultithreadedJavascript?: boolean;

	/**
	 * Custom runtime package name
	 */
	runtimePackageName?: string;
}

interface INsConfigHooks {
	type?: string;
	script: string;
}

interface INsConfig {
	id?: string;
	main?: string;
	appPath?: string;
	appResourcesPath?: string;
	/**
	 * Where the native projects are generated, relative to the project root.
	 * Defaults to `platforms`.
	 */
	buildPath?: string;
	shared?: boolean;
	overridePods?: string;
	webpackConfigPath?: string;
	bundlerConfigPath?: string;
	bundler?: BundlerType;
	ios?: INsConfigIOS;
	android?: INsConfigAndroid;
	visionos?: INSConfigVisionOS;
	catalyst?: INSConfigCatalyst;
	ignoredNativeDependencies?: string[];
	hooks?: INsConfigHooks[];
	projectName?: string;
	/**
	 * Legacy keys still found in user configs. Declared so the
	 * runtime-package.json generation (PrepareController) can strip them
	 * via destructuring without losing type safety.
	 */
	webpackPackageName?: string;
}

/** @deprecated Kept so existing annotations compile; use the {@link ProjectData} contract. */
interface IProjectData extends ProjectData {}

/** @deprecated Kept so existing annotations compile; use the {@link ProjectDataService} contract. */
interface IProjectDataService extends ProjectDataService {}

interface IProjectCleanupService {
	/**
	 * Clean multiple paths
	 * @param {string[]} pathsToClean
	 */
	clean(
		pathsToClean: string[],
		options?: IProjectCleanupOptions,
	): Promise<IProjectCleanupResult>;

	/**
	 * Clean a single path
	 * @param {string} pathToClean
	 */
	cleanPath(
		pathToClean: string,
		options?: IProjectCleanupOptions,
	): Promise<IProjectCleanupResult>;
}

interface IProjectCleanupOptions {
	/**
	 * When set, the cleanup service will calculate the size of the cleaned up files.
	 */
	stats?: boolean;
	/**
	 * When set, the cleanup service will not delete any files.
	 */
	dryRun?: boolean;
	/**
	 * When set, the cleanup service will not print any messages to the console.
	 */
	silent?: boolean;
}

interface IProjectCleanupResult {
	ok: boolean;
	/**
	 * When stats is set to true, this will contain a map of the cleaned up paths and their size.
	 */
	stats?: Map<string, number>;
}

interface IProjectPathCleanupResult {
	ok: boolean;
	/**
	 * When stats is set to true, this will contain the size of the cleaned path in bytes.
	 */
	size?: number;
}

interface IBackup {
	create(): IBackup;
	restore(): IBackup;
	remove(): IBackup;
	isUpToDate(): boolean;
	addPath(path: string): IBackup;
	addPaths(paths: string[]): IBackup;
}

interface IProjectBackupService {
	getBackup(name: string): IBackup;
	backup(name: string, pathsToBackup: string[]): IBackup;
	restore(name: string, pathsToRestore: string[]): IBackup;
}

interface IProjectConfigInformation {
	hasTSConfig: boolean;
	hasJSConfig: boolean;
	hasNSConfig: boolean;
	usingNSConfig: boolean;
	TSConfigPath: string;
	JSConfigPath: string;
	NSConfigPath: string;
}

interface IProjectConfigService {
	/**
	 * read the nativescript.config.(js|ts) file
	 * @param options.suppressWarnings pass when reading a config that is not
	 * the user's project (e.g. a plugin package, which may legitimately ship
	 * compiled .js artifacts next to its .ts config)
	 * @returns {INsConfig} the parsed config data
	 */
	readConfig(
		projectDir?: string,
		options?: { suppressWarnings?: boolean },
	): INsConfig;
	/**
	 * Get value for a given config key path
	 * @param key the property key path
	 */
	getValue(key: string, defaultValue?: any): any;
	/**
	 * Set value for a given config key path
	 * @param key the property key path
	 * @param value
	 */
	setValue(key: string, value: SupportedConfigValues): Promise<boolean>;

	/**
	 * Override legacy fallback - and force using the new configs
	 * Used by the migrate service to force the config service to
	 * write new values into the new configs.
	 * @param force
	 */
	setForceUsingNewConfig(force: boolean): boolean;

	/**
	 * Override legacy fallback - and force using the legacy configs
	 * Used by the migrate service to force the config service to
	 * read values from the old configs
	 * @param force
	 */
	setForceUsingLegacyConfig(force: boolean): boolean;

	detectProjectConfigs(
		projectDir?: string,
		options?: { suppressWarnings?: boolean },
	): IProjectConfigInformation;

	getDefaultTSConfig(appId: string, appPath: string): string;

	writeDefaultConfig(projectDir?: string, appId?: string): boolean | string;

	writeLegacyNSConfigIfNeeded(
		projectDir: string,
		runtimePackage: IBasePluginData,
	): Promise<void>;
}

interface IAssetItem {
	path: string;
	size: string;
	width: number;
	height: number;
	filename: string;
	directory: string;
	scale: string;
	idiom: string;
	resizeOperation?: string;
	overlayImageScale?: number;
	rgba?: boolean;

	// additional operations for special cases
	operation?: "delete" | "writeXMLColor";
	data?: any;
}

interface IAssetSubGroup {
	images: IAssetItem[];
	info?: { version: string; author: string };
	[imageType: string]: any;
}

interface IAssetGroup {
	icons: IAssetSubGroup;
	splashBackgrounds: IAssetSubGroup;
	splashCenterImages: IAssetSubGroup;
	splashImages?: IAssetSubGroup;
	[imageType: string]: IAssetSubGroup;
}

interface IAssetsStructure {
	ios: IAssetGroup;
	android: IAssetGroup;
}

interface IImageDefinitionGroup {
	icons: IAssetItem[];
	splashBackgrounds: IAssetItem[];
	splashCenterImages: IAssetItem[];
	splashImages?: IAssetItem[];
}

interface IImageDefinitionsStructure {
	ios: IImageDefinitionGroup;
	android: IImageDefinitionGroup;
	android_legacy: IImageDefinitionGroup;
}

interface ITemplateData {
	/**
	 * The normalized template name
	 * In case no --template option is provided, use default template name
	 * In case --template <templateName> option is provided, use <templateName>
	 * In case --template <templateName>@<version> is provided, use <templateName>
	 * In case --ng option is provided, use default angular template name
	 * In case --ts option is provided, use default typescript template name
	 */
	templateName: string;
	/**
	 * The path to the template.
	 * In case template is v1, will be {pathToProjectDir}/node_modules/{templateName}.
	 * In case template is v2, will be null.
	 */
	// templatePath: string;
	/**
	 * The whole content of package.json file
	 */
	templatePackageJsonContent: ITemplatePackageJsonContent;

	/**
	 * The version of the package used for creating the application.
	 */
	version: string;
}

interface ITemplatePackageJsonContent extends IBasePluginData {
	dependencies: IStringDictionary;
	devDependencies: IStringDictionary;
	nativescript?: {
		templateVersion?: string;
	};
}

/**
 * Describes working with templates.
 */
interface IProjectTemplatesService {
	/**
	 * Prepares template for project creation.
	 * In case templateName is not provided, use defaultTemplatePath.
	 * In case templateName is a special word, validated from us (for ex. typescript), resolve the real template name and add it to npm cache.
	 * In any other cases try to `npm install` the specified templateName to temp directory.
	 * @param {string} templateName The name of the template.
	 * @return {ITemplateData} Data describing the template - location where it is installed and its NativeScript version.
	 */
	prepareTemplate(
		templateName: string,
		projectDir: string,
	): Promise<ITemplateData>;
}

interface IPlatformProjectServiceBase {
	getPluginPlatformsFolderPath(
		pluginData: IPluginData,
		platform: string,
	): string;
	getFrameworkVersion(projectData: IProjectData): string;
}

interface IBuildForDevice {
	buildForDevice: boolean;
}

interface IiCloudContainerEnvironment {
	iCloudContainerEnvironment: string;
}

interface INativePrepare {
	skipNativePrepare: boolean;
	forceRebuildNativeApp?: boolean;
	restartLiveSync?: boolean;
}

interface IBuildConfig
	extends IAndroidBuildOptionsSettings, IiOSBuildConfig, IProjectDir {
	clean?: boolean;
	architectures?: string[];
	buildOutputStdio?: string;
	platform?: string;
	_device?: Mobile.IDevice;
}

/**
 * Describes iOS-specific build configuration properties
 */
interface IiOSBuildConfig
	extends
		IBuildForDevice,
		IiCloudContainerEnvironment,
		IDeviceIdentifier,
		IProvision,
		ITeamIdentifier,
		IRelease {
	/**
	 * Identifier of the mobile provision which will be used for the build. If not set a provision will be selected automatically if possible.
	 */
	mobileProvisionIdentifier?: string;
	/**
	 * Code sign identity used for build. If not set iPhone Developer is used as a default when building for device.
	 */
	codeSignIdentity?: string;
}

interface IValidatePlatformOutput {
	checkEnvironmentRequirementsOutput: ICheckEnvironmentRequirementsOutput;
}

interface ITestExecutionService {
	startKarmaServer(
		platform: string,
		liveSyncInfo: ILiveSyncInfo,
		deviceDescriptors: ILiveSyncDeviceDescriptor[],
	): Promise<void>;
	canStartKarmaServer(projectData: IProjectData): Promise<boolean>;
}

interface IVitestExecutionService {
	isVitestProject(projectData: IProjectData): boolean;
	canStartTestRun(projectData: IProjectData): boolean;
	startTestRun(platform: string, projectData: IProjectData): Promise<void>;
}

interface ITestInitializationService {
	getDependencies(framework: string): IDependencyInformation[];
	getFrameworkNames(): string[];
}

/**
 * Describes a service used to facilitate communication with CocoaPods
 */
interface ICocoaPodsService {
	/**
	 * Get the header needed for the beginning of every Podfile
	 * @param {string} targetName The name of the target (usually the same as the project's name).
	 * @return {string} The header which needs to be placed at the beginning of a Podfile.
	 */
	getPodfileHeader(targetName: string): string;
	/**
	 * Get the footer needed for the end of every Podfile
	 * @return {string} The footer which needs to be placed at the end of a Podfile.
	 */
	getPodfileFooter(): string;

	/**
	 * Merges the Podfile's content from App_Resources in the project's Podfile.
	 * @param projectData Information about the project.
	 * @param platformData Information about the platform.
	 * @returns {Promise<void>}
	 */
	applyPodfileFromAppResources(
		projectData: IProjectData,
		platformData: IPlatformData,
	): Promise<void>;

	applyPodfileArchExclusions(
		projectData: IProjectData,
		platformData: IPlatformData,
	): Promise<void>;

	applyPodfileFromExtensions(
		projectData: IProjectData,
		platformData: IPlatformData,
	): Promise<void>;

	/**
	 * Prepares the Podfile content of a plugin and merges it in the project's Podfile.
	 * @param {string} moduleName The module which the Podfile is from.
	 * @param {string} podfilePath The path to the podfile.
	 * @param {IProjectData} projectData Information about the project.
	 * @param {IPlatformData} platformData Information about the platform.
	 * @returns {Promise<void>}
	 */
	applyPodfileToProject(
		moduleName: string,
		podfilePath: string,
		projectData: IProjectData,
		platformData: IPlatformData,
	): Promise<void>;

	/**
	 * Gives the path to the plugin's Podfile.
	 * @param {IPluginData} pluginData Information about the plugin.
	 * @returns {string} Path to plugin's Podfile
	 */
	getPluginPodfilePath(pluginData: IPluginData): string;

	/**
	 * Removes plugins Podfile content from the project.
	 * @param {string} moduleName The name of the module.
	 * @param {string} podfilePath The path to the module's Podfile.
	 * @param {string} projectData Information about the project.
	 * @param {string} nativeProjectPath Path to the native Xcode project.
	 * @returns {void}
	 */
	removePodfileFromProject(
		moduleName: string,
		podfilePath: string,
		projectData: IProjectData,
		nativeProjectPath: string,
	): void;

	/**
	 * Gives the path to project's Podfile.
	 * @param {string} nativeProjectPath Path to the native Xcode project.
	 * @returns {string} Path to project's Podfile.
	 */
	getProjectPodfilePath(nativeProjectPath: string): string;

	/**
	 * Executes `pod install` or `sanboxpod install` in the passed project.
	 * @param {string} projectRoot The root directory of the native iOS project.
	 * @param {string} xcodeProjPath The full path to the .xcodeproj file.
	 * @returns {Promise<ISpawnResult>} Information about the spawned process.
	 */
	executePodInstall(
		projectRoot: string,
		xcodeProjPath: string,
	): Promise<ISpawnResult>;

	/**
	 * Merges pod's xcconfig file into project's xcconfig file
	 * @param projectData
	 * @param platformData
	 * @param opts
	 */
	mergePodXcconfigFile(
		projectData: IProjectData,
		platformData: IPlatformData,
		opts: IRelease,
	): Promise<void>;
}

interface ICocoaPodsPlatformManager {
	addPlatformSection(
		projectData: IProjectData,
		podfilePlatformData: IPodfilePlatformData,
		projectPodfileContent: string,
	): string;
	removePlatformSection(
		moduleName: string,
		projectPodFileContent: string,
		podfilePath: string,
	): string;
	replacePlatformRow(
		podfileContent: string,
		podfilePath: string,
	): { replacedContent: string; podfilePlatformData: IPodfilePlatformData };
}

interface IXcodeTargetBuildConfigurationProperty {
	name: string;
	value: any;
	buildNames?: BuildNames[];
}

/**
 * Describes a service used to add and remove iOS extension
 */
interface IIOSNativeTargetService {
	addTargetToProject(
		targetRootPath: string,
		targetFolder: string,
		targetType: string,
		project: IXcode.project,
		platformData: IPlatformData,
		parentTarget?: string,
	): IXcode.target;
	prepareSigning(
		targetUuids: string[],
		projectData: IProjectData,
		projectPath: string,
	): void;
	getTargetDirectories(folderPath: string): string[];
	setXcodeTargetBuildConfigurationProperties(
		properties: IXcodeTargetBuildConfigurationProperty[],
		targetName: string,
		project: IXcode.project,
	): void;
	setConfigurationsFromJsonFile(
		jsonPath: string,
		targetUuid: string,
		targetName: string,
		project: IXcode.project,
	): void;
}

/**
 * Describes a service used to add and remove iOS extension
 */
interface IIOSExtensionsService {
	addExtensionsFromPath(
		options: IAddExtensionsFromPathOptions,
	): Promise<boolean>;
	removeExtensions(options: IRemoveExtensionsOptions): void;
}

interface IIOSWatchAppService {
	addWatchAppFromPath(options: IAddWatchAppFromPathOptions): Promise<boolean>;
	removeWatchApp(options: IRemoveWatchAppOptions): void;
	hasWatchApp(platformData: IPlatformData, projectData: IProjectData): boolean;
}

interface IAddTargetFromPathOptions {
	projectData: IProjectData;
	platformData: IPlatformData;
	pbxProjPath: string;
}

interface IAddExtensionsFromPathOptions extends IAddTargetFromPathOptions {
	extensionsFolderPath: string;
}

interface IAddWatchAppFromPathOptions extends IAddTargetFromPathOptions {
	watchAppFolderPath: string;
	disableStubBinary?: boolean;
}

interface IRemoveExtensionsOptions {
	pbxProjPath: string;
}

interface IRemoveWatchAppOptions extends IRemoveExtensionsOptions {}

interface IWatchAppJSONConfigModule {
	name?: string;
	path: string;
	targetType?: string;
	embed?: boolean;
	frameworks?: Array<string | Record<string, string>>;
	dependencies?: string[];
	headerSearchPaths?: string[];
	resources?: string[];
	src?: string[];
	linkerFlags?: string[];
	buildConfigurationProperties?: Record<string, string>;
	SPMPackages?: Array<IOSSPMPackage | string>;
}
interface IWatchAppJSONConfig {
	targetType?: string;
	forceAddEmbedWatchContent?: boolean;
	sharedModulesBuildConfigurationProperties?: Record<string, string>;
	basedir?: string;
	infoPlistPath?: string;
	xcprivacyPath?: string;
	importSourcesFromMainFolder?: boolean;
	importResourcesFromMainFolder?: boolean;
	resources?: string[];
	src?: string[];
	resourcesExclude?: string[];
	srcExclude?: string[];
	modules: IWatchAppConfigModule[];
	SPMPackages?: Array<IOSSPMPackage>;
}

interface IRubyFunction {
	functionName: string;
	functionParameters?: string;
}

interface IPodfilePlatformData {
	/**
	 * The content of the whole pod's platform row
	 */
	content: string;
	/**
	 * The version of the pod's platform
	 */
	version: string;
	/**
	 * The path to the pod's file
	 */
	path: string;
}
