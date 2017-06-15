/**
 * Describes available settings when creating new NativeScript application.
 */
interface IProjectSettings {
	/**
	 * Name of the newly created application.
	 */
	projectName: string;

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

	/**
	 * Path where the project will be created. If not specified, defaults to current working dir.
	 */
	pathToProject?: string;

	/**
	 * Defines if invalid application name can be used for project creation.
	 */
	force?: boolean;

	/**
	 * Defines whether the `npm install` command should be executed with `--ignore-scripts` option.
	 * When it is passed, all scripts (postinstall for example) will not be executed.
	 */
	ignoreScripts?: boolean;
}

interface IProjectService {
	/**
	 * Creates new NativeScript application.
	 * @param {any} projectSettings Options describing new project - its name, appId, path and template from which to be created.
	 * @returns {Promise<void>}
	 */
	createProject(projectSettings: IProjectSettings): Promise<void>;

	/**
	 * Checks if the specified project is valid NativeScript project.
	 * @param {string} pathToProject Directory to check.
	 * @returns {boolean} returns true if the project is valid NativeScript project.
	 */
	isValidNativeScriptProject(pathToProject?: string): boolean;
}

interface IProjectData {
	projectDir: string;
	projectName: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
	dependencies: any;
	devDependencies: IStringDictionary;
	appDirectoryPath: string;
	appResourcesDirectoryPath: string;
	projectType: string;
	/**
	 * Initializes project data with the given project directory. If none supplied defaults to --path option or cwd.
	 * @param {string} projectDir Project root directory.
	 * @returns {void}
	 */
	initializeProjectData(projectDir?: string): void;
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

	getProjectData(projectDir: string): IProjectData;
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
	 * @return {string} Path to the directory where extracted template can be found.
	 */
	prepareTemplate(templateName: string, projectDir: string): Promise<string>;
}

interface IPlatformProjectServiceBase {
	getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string): string;
}

interface IBuildForDevice {
	buildForDevice: boolean;
}

interface IBuildConfig extends IAndroidBuildOptionsSettings, IiOSBuildConfig {
	projectDir: string;
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
	/**
	 * Team identifier.
	 */
	teamIdentifier?: string;
}

interface IPlatformProjectService extends NodeJS.EventEmitter {
	getPlatformData(projectData: IProjectData): IPlatformData;
	validate(projectData: IProjectData): Promise<void>;
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
	validateOptions(projectId?: string, provision?: true | string): Promise<boolean>;

	validatePlugins(projectData: IProjectData): Promise<void>;

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

	afterPrepareAllPlugins(projectData: IProjectData): Promise<void>;
	beforePrepareAllPlugins(projectData: IProjectData, dependencies?: IDependencyData[]): Promise<void>;

	/**
	 * Gets the path wheren App_Resources should be copied.
	 * @returns {string} Path to native project, where App_Resources should be copied.
	 */
	getAppResourcesDestinationDirectoryPath(projectData: IProjectData): string;

	cleanDeviceTempFolder(deviceIdentifier: string, projectData: IProjectData): Promise<void>;
	processConfigurationFilesFromAppResources(release: boolean, projectData: IProjectData): Promise<void>;

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
	checkForChanges(changeset: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): void;
}

interface IAndroidProjectPropertiesManager {
	getProjectReferences(): Promise<ILibRef[]>;
	addProjectReference(referencePath: string): Promise<void>;
	removeProjectReference(referencePath: string): Promise<void>;
}

interface ITestExecutionService {
	startTestRunner(platform: string, projectData: IProjectData): Promise<void>;
	startKarmaServer(platform: string, projectData: IProjectData): Promise<void>;
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
	 * Merges the content of hooks with the provided name if there are more than one hooks with this name in the Podfile.
	 * @param {string} hookName The name of the hook.
	 * @param {string} pathToPodfile The path to the Podfile.
	 * @return {void}
	 */
	mergePodfileHookContent(sectionName: string, pathToPodfile: string): void
}
