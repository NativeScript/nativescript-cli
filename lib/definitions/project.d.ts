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
}

interface IProjectDataService {
	initialize(projectDir: string): void;

	/**
	 * Returns a value from `nativescript` key in project's package.json.
	 * @param {string} propertyName The name of the property to be checked in `nativescript` key.
	 * @returns {any} The value of the property.
	 */
	getValue(propertyName: string): any;

	/**
	 * Sets a value in the `nativescript` key in a project's package.json.
	 * @param {string} key Key to be added to `nativescript` key in project's package.json.
	 * @param {any} value Value of the key to be added to `nativescript` key in project's package.json.
	 * @returns {void}
	 */
	setValue(key: string, value: any): void;

	/**
	 * Removes a property from `nativescript` key in project's package.json.
	 * @param {string} propertyName The name of the property to be removed from `nativescript` key.
	 * @returns {void}
	 */
	removeProperty(propertyName: string): void;

	/**
	 * Removes dependency from package.json
	 * @param {string} dependencyName Name of the dependency that has to be removed.
	 * @returns {void}
	 */
	removeDependency(dependencyName: string): void;
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

interface IBuildConfig {
	buildForDevice?: boolean;
	architectures?: string[];
}

/**
 * Describes iOS-specific build configuration properties
 */
interface IiOSBuildConfig extends IBuildConfig {
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

interface IPlatformProjectService {
	platformData: IPlatformData;
	validate(): Promise<void>;
	createProject(frameworkDir: string, frameworkVersion: string, pathToTemplate?: string): Promise<void>;
	interpolateData(): Promise<void>;
	interpolateConfigurationFile(configurationFilePath?: string): Promise<void>;

	/**
	 * Executes additional actions after native project is created.
	 * @param {string} projectRoot Path to the real NativeScript project.
	 * @returns {void}
	 */
	afterCreateProject(projectRoot: string): void;

	/**
	 * Gets first chance to validate the options provided as command line arguments.
	 */
	validateOptions(): Promise<boolean>;

	buildProject(projectRoot: string, buildConfig?: IBuildConfig): Promise<void>;

	/**
	 * Prepares images in Native project (for iOS).
	 * @returns {void}
	 */
	prepareProject(): Promise<void>;

	/**
	 * Prepares App_Resources in the native project by clearing data from other platform and applying platform specific rules.
	 * @param {string} appResourcesDirectoryPath The place in the native project where the App_Resources are copied first.
	 * @returns {void}
	 */
	prepareAppResources(appResourcesDirectoryPath: string): void;

	/**
	 * Defines if current platform is prepared (i.e. if <project dir>/platforms/<platform> dir exists).
	 * @param {string} projectRoot The project directory (path where root's package.json is located).
	 * @returns {boolean} True in case platform is prepare (i.e. if <project dir>/platforms/<platform> dir exists), false otherwise.
	 */
	isPlatformPrepared(projectRoot: string): boolean;

	/**
	 * Checks if current platform can be updated to a newer versions.
	 * @param {string} newInstalledModuleDir Path to the native project.
	 * @return {boolean} True if platform can be updated. false otherwise.
	 */
	canUpdatePlatform(newInstalledModuleDir: string): boolean;

	preparePluginNativeCode(pluginData: IPluginData, options?: any): Promise<void>;

	/**
	 * Removes native code of a plugin (CocoaPods, jars, libs, src).
	 * @param {IPluginData} Plugins data describing the plugin which should be cleaned.
	 * @returns {void}
	 */
	removePluginNativeCode(pluginData: IPluginData): Promise<void>;

	afterPrepareAllPlugins(): Promise<void>;
	beforePrepareAllPlugins(dependencies?: IDictionary<IDependencyData>): Promise<void>;

	/**
	 * Gets the path wheren App_Resources should be copied.
	 * @returns {string} Path to native project, where App_Resources should be copied.
	 */
	getAppResourcesDestinationDirectoryPath(): string;

	deploy(deviceIdentifier: string): Promise<void>;
	processConfigurationFilesFromAppResources(): Promise<void>;

	/**
	 * Ensures there is configuration file (AndroidManifest.xml, Info.plist) in app/App_Resources.
	 * @returns {void}
	 */
	ensureConfigurationFileInAppResources(): void;

	/**
	 * Stops all running processes that might hold a lock on the filesystem.
	 * Android: Gradle daemon processes are terminated.
	 * @returns {void}
	 */
	stopServices(): Promise<ISpawnResult>;

	/**
	 * Removes build artifacts specific to the platform
	 * @returns {void}
	 */
	cleanProject(projectRoot: string, options: string[]): Promise<void>
}

interface IAndroidProjectPropertiesManager {
	getProjectReferences(): Promise<ILibRef[]>;
	addProjectReference(referencePath: string): Promise<void>;
	removeProjectReference(referencePath: string): Promise<void>;
}

interface ITestExecutionService {
	startTestRunner(platform: string): Promise<void>;
	startKarmaServer(platform: string): Promise<void>;
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
