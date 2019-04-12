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
interface IProjectCreationSettings extends IProjectSettingsBase, IProjectDir {

}

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


interface ICreateProjectData extends IProjectDir, IProjectName {

}

interface IProjectService {
	validateProjectName(opts: { projectName: string, force: boolean, pathToProject: string }): Promise<string>
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
}

interface INsConfig {
	appPath?: string;
	appResourcesPath?: string;
	shared?: boolean;
	useLegacyWorkflow?: boolean;
	previewAppSchema?: string;
}

interface IProjectData extends ICreateProjectData {
	platformsDir: string;
	projectFilePath: string;
	projectId: string;
	projectIdentifiers?: Mobile.IProjectIdentifier;
	dependencies: any;
	devDependencies: IStringDictionary;
	appDirectoryPath: string;
	appResourcesDirectoryPath: string;
	projectType: string;
	nsConfig: INsConfig;
	androidManifestPath: string;
	appGradlePath: string;
	gradleFilesDirectoryPath: string;
	infoPlistPath: string;
	buildXcconfigPath: string;
	podfilePath: string;
	/**
	 * Defines if the project is a code sharing one.
	 * Value is true when project has nsconfig.json and it has `shared: true` in it.
	 */
	isShared: boolean;

	/**
	 * Defines if the project has hmr enabled by default
	 */
	useLegacyWorkflow: boolean;

	/**
	 * Defines the schema for the preview app
	 */
	previewAppSchema: string;

	/**
	 * Initializes project data with the given project directory. If none supplied defaults to --path option or cwd.
	 * @param {string} projectDir Project root directory.
	 * @returns {void}
	 */
	initializeProjectData(projectDir?: string): void;
	initializeProjectDataFromContent(packageJsonContent: string, nsconfigContent: string, projectDir?: string): void;
	getAppDirectoryPath(projectDir?: string): string;
	getAppDirectoryRelativePath(): string;
	getAppResourcesDirectoryPath(projectDir?: string): string;
	getAppResourcesRelativeDirectoryPath(): string;
}

interface IProjectDataService {
	/**
	 * Returns a value from `nativescript` key in project's package.json.
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} propertyName The name of the property to be checked in `nativescript` key.
	 * @returns {any} The value of the property.
	 */
	getNSValue(projectDir: string, propertyName: string): any;

	/**
	 * Sets a value in the `nativescript` key in a project's package.json.
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} key Key to be added to `nativescript` key in project's package.json.
	 * @param {any} value Value of the key to be added to `nativescript` key in project's package.json.
	 * @returns {void}
	 */
	setNSValue(projectDir: string, key: string, value: any): void;

	/**
	 * Removes a property from `nativescript` key in project's package.json.
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} propertyName The name of the property to be removed from `nativescript` key.
	 * @returns {void}
	 */
	removeNSProperty(projectDir: string, propertyName: string): void;

	/**
	 * Removes dependency from package.json
	 * @param {string} projectDir The project directory - the place where the root package.json is located.
	 * @param {string} dependencyName Name of the dependency that has to be removed.
	 * @returns {void}
	 */
	removeDependency(projectDir: string, dependencyName: string): void;

	getProjectData(projectDir?: string): IProjectData;

	/**
	 * Gives information about the whole assets structure for both iOS and Android.
	 * For each of the platforms, the returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages (only for iOS).
	 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 * @returns {Promise<IAssetsStructure>} An object describing the current asset structure.
	 */
	getAssetsStructure(opts: IProjectDir): Promise<IAssetsStructure>;


	/**
	 * Gives information about the whole assets structure for iOS.
	 * The returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages.
	 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 * @returns {Promise<IAssetGroup>} An object describing the current asset structure for iOS.
	 */
	getIOSAssetsStructure(opts: IProjectDir): Promise<IAssetGroup>;

	/**
	 * Gives information about the whole assets structure for Android.
	 * The returned object will contain icons, splashBackgrounds and splashCenterImages.
	 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 * @returns {Promise<IAssetGroup>} An object describing the current asset structure for Android.
	 */
	getAndroidAssetsStructure(opts: IProjectDir): Promise<IAssetGroup>;

	/**
	 * Returns array with paths to all `.js` or `.ts` files in application's app directory.
	 * @param {string} projectDir Path to application.
	 * @returns {string[]} Array of paths to `.js` or `.ts` files.
	 */
	getAppExecutableFiles(projectDir: string): string[];
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
}

interface IAssetSubGroup {
	images: IAssetItem[];
	info?: { version: string, author: string };
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
	templatePath: string;
	/**
	 * The templateVersion property from nativescript section inside package.json file
	 * "nativescript": {
			"id": "org.nativescript.app6",
			"templateVersion": "v2"
		}
	 */
	templateVersion: string;
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
	}
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
	prepareTemplate(templateName: string, projectDir: string): Promise<ITemplateData>;
}

interface IPlatformProjectServiceBase {
	getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string): string;
	getFrameworkVersion(projectData: IProjectData): string;
}

interface IBuildForDevice {
	buildForDevice: boolean;
}

interface INativePrepare {
	skipNativePrepare: boolean;
}

interface IBuildConfig extends IAndroidBuildOptionsSettings, IiOSBuildConfig, IProjectDir {
	clean?: boolean;
	architectures?: string[];
	buildOutputStdio?: string;
}

/**
 * Describes iOS-specific build configuration properties
 */
interface IiOSBuildConfig extends IBuildForDevice, IDeviceIdentifier, IProvision, ITeamIdentifier, IRelease {
	/**
	 * Identifier of the mobile provision which will be used for the build. If not set a provision will be selected automatically if possible.
	 */
	mobileProvisionIdentifier?: string;
	/**
	 * Code sign identity used for build. If not set iPhone Developer is used as a default when building for device.
	 */
	codeSignIdentity?: string;
}

/**
 * Describes service used for building a project locally.
 */
interface ILocalBuildService {
	/**
	 * Builds a project locally.
	 * @param {string} platform Platform for which to build.
	 * @param {IPlatformBuildData} platformBuildOptions Additional options for controlling the build.
	 * @return {Promise<string>} Path to the build output.
	 */
	build(platform: string, platformBuildOptions: IPlatformBuildData): Promise<string>;
	/**
	 * Removes build artifacts specific to the platform
	 * @param {ICleanNativeAppData} data Data describing the clean app process
	 * @returns {void}
	 */
	cleanNativeApp(data: ICleanNativeAppData): Promise<void>;
}

interface ICleanNativeAppData extends IProjectDir, IPlatform { }

interface IPlatformProjectService extends NodeJS.EventEmitter, IPlatformProjectServiceBase {
	getPlatformData(projectData: IProjectData): IPlatformData;
	validate(projectData: IProjectData, options: IOptions, notConfiguredEnvOptions?: INotConfiguredEnvOptions): Promise<IValidatePlatformOutput>;
	createProject(frameworkDir: string, frameworkVersion: string, projectData: IProjectData, config: ICreateProjectOptions): Promise<void>;
	interpolateData(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void>;
	interpolateConfigurationFile(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): void;

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

	buildProject(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): Promise<void>;

	/**
	 * Prepares images in Native project (for iOS).
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @param {any} platformSpecificData Platform specific data required for project preparation.
	 * @returns {void}
	 */
	prepareProject(projectData: IProjectData, platformSpecificData: IPlatformSpecificData): Promise<void>;

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
	 * @param {string} projectRoot The root directory of the native project.
	 * @returns {void}
	 */
	stopServices(projectRoot: string): Promise<ISpawnResult>;

	/**
	 * Removes build artifacts specific to the platform
	 * @param {string} projectRoot The root directory of the native project.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {void}
	 */
	cleanProject(projectRoot: string, projectData: IProjectData): Promise<void>

	/**
	 * Check the current state of the project, and validate against the options.
	 * If there are parts in the project that are inconsistent with the desired options, marks them in the changeset flags.
	 */
	checkForChanges(changeset: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): Promise<void>;

	/**
	 * Get the deployment target's version
	 * Currently implemented only for iOS -> returns the value of IPHONEOS_DEPLOYMENT_TARGET property from xcconfig file
	 */
	getDeploymentTarget(projectData: IProjectData): any;
}

interface IValidatePlatformOutput {
	checkEnvironmentRequirementsOutput: ICheckEnvironmentRequirementsOutput;
}

interface ITestExecutionService {
	startKarmaServer(platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void>;
	canStartKarmaServer(projectData: IProjectData): Promise<boolean>;
}

interface ITestInitializationService {
	getDependencies(framework: string): IDependencyInformation[];
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
	applyPodfileFromAppResources(projectData: IProjectData, platformData: IPlatformData): Promise<void>;

	/**
	 * Prepares the Podfile content of a plugin and merges it in the project's Podfile.
	 * @param {string} moduleName The module which the Podfile is from.
	 * @param {string} podfilePath The path to the podfile.
	 * @param {IProjectData} projectData Information about the project.
	 * @param {string} nativeProjectPath Path to the native Xcode project.
	 * @returns {Promise<void>}
	 */
	applyPodfileToProject(moduleName: string, podfilePath: string, projectData: IProjectData, nativeProjectPath: string): Promise<void>;

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
	removePodfileFromProject(moduleName: string, podfilePath: string, projectData: IProjectData, nativeProjectPath: string): void;

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
	executePodInstall(projectRoot: string, xcodeProjPath: string): Promise<ISpawnResult>;

	/**
	 * Merges pod's xcconfig file into project's xcconfig file
	 * @param projectData
	 * @param platformData
	 * @param opts
	 */
	mergePodXcconfigFile(projectData: IProjectData, platformData: IPlatformData, opts: IRelease): Promise<void>;
}

interface ICocoaPodsPlatformManager {
	addPlatformSection(projectData: IProjectData, podfilePlatformData: IPodfilePlatformData, projectPodfileContent: string): string;
	removePlatformSection(moduleName: string, projectPodFileContent: string, podfilePath: string): string;
	replacePlatformRow(podfileContent: string, podfilePath: string): { replacedContent: string, podfilePlatformData: IPodfilePlatformData };
}

/**
 * Describes a service used to add and remove iOS extension
 */
interface IIOSExtensionsService {
	addExtensionsFromPath(options: IAddExtensionsFromPathOptions): Promise<boolean>;
	removeExtensions(options: IRemoveExtensionsOptions): void;
}

interface IAddExtensionsFromPathOptions{
	extensionsFolderPath: string;
	projectData: IProjectData;
	platformData: IPlatformData;
	pbxProjPath: string;
}

interface IRemoveExtensionsOptions {
	pbxProjPath: string
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
