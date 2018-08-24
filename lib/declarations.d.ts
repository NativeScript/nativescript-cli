interface INodePackageManager {
	/**
	 * Installs dependency
	 * @param  {string}                            packageName The name of the dependency - can be a path, a url or a string.
	 * @param  {string}                            pathToSave  The destination of the installation.
	 * @param  {INodePackageManagerInstallOptions} config      Additional options that can be passed to manipulate installation.
	 * @return {Promise<INpmInstallResultInfo>}                Information about installed package.
	 */
	install(packageName: string, pathToSave: string, config: INodePackageManagerInstallOptions): Promise<INpmInstallResultInfo>;

	/**
	 * Uninstalls a dependency
	 * @param  {string}                            packageName The name of the dependency.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate uninstallation.
	 * @param  {string}                            path  The destination of the uninstallation.
	 * @return {Promise<string>}                The output of the uninstallation.
	 */
	uninstall(packageName: string, config?: IDictionary<string | boolean>, path?: string): Promise<string>;

	/**
	 * Provides information about a given package.
	 * @param  {string}                            packageName The name of the package.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate view.
	 * @return {Promise<any>}                Object, containing information about the package.
	 */
	view(packageName: string, config: Object): Promise<any>;

	/**
	 * Searches for a package.
	 * @param  {string[]}                            filter Keywords with which to perform the search.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate search.
	 * @return {Promise<string>}                The output of the uninstallation.
	 */
	search(filter: string[], config: IDictionary<string | boolean>): Promise<string>;

	/**
	 * Searches for npm packages in npms by keyword.
	 * @param {string} keyword The keyword based on which the search action will be executed.
	 * @returns {INpmsResult} The information about found npm packages.
	 */
	searchNpms(keyword: string): Promise<INpmsResult>;

	/**
	 * Gets information for a specified package from registry.npmjs.org.
	 * @param {string} packageName The name of the package.
	 * @returns {any} The full data from registry.npmjs.org for this package.
	 */
	getRegistryPackageData(packageName: string): Promise<any>;

	/**
	 * Gets the path to npm cache directory.
	 * @returns {string} The full path to npm cache directory
	 */
	getCachePath(): Promise<string>;
}

interface INpmInstallationManager {
	install(packageName: string, packageDir: string, options?: INpmInstallOptions): Promise<any>;
	getLatestVersion(packageName: string): Promise<string>;
	getNextVersion(packageName: string): Promise<string>;
	getLatestCompatibleVersion(packageName: string, referenceVersion?: string): Promise<string>;
	getInspectorFromCache(inspectorNpmPackageName: string, projectDir: string): Promise<string>;
}

/**
 * Describes options that can be passed to manipulate package installation.
 */
interface INodePackageManagerInstallOptions extends INpmInstallConfigurationOptions, IDictionary<string | boolean> {
	/**
	 * Destination of the installation.
	 * @type {string}
	 * @optional
	 */
	path?: string;
}

/**
 * Describes information about dependency packages.
 */
interface INpmDependencyInfo {
	/**
	 * Dependency name.
	 */
	[key: string]: {
		/**
		 * Dependency version.
		 * @type {string}
		 */
		version: string;
		/**
		 * How was the dependency resolved. For example: lodash@latest or underscore@>=1.8.3 <2.0.0
		 * @type {string}
		 */
		from: string;
		/**
		 * Where was the dependency resolved from. For example: https://registry.npmjs.org/lodash/-/lodash-4.17.4.tgz
		 * @type {string}
		 */
		resolved: string;
		/**
		 * Dependencies of the dependency.
		 * @type {INpmDependencyInfo}
		 */
		dependencies?: INpmDependencyInfo;
		/**
		 * Set to true when the dependency is invalid.
		 * @type {boolean}
		 */
		invalid?: boolean;
		/**
		 * If invalid is set to true this will contain errors which make the dependency invalid.
		 */
		problems?: string[];
	}
}

/**
 * Describes information about peer dependency packages.
 */
interface INpmPeerDependencyInfo {
	required: {
		/**
		 * Id used in package.json - for example: zone.js@^0.8.4
		 * @type {string}
		 */
		_id: string;
		/**
		 * Dependency name.
		 * @type {string}
		 */
		name: string;
		/**
		 * Dependency version.
		 * @type {string}
		 */
		version: string;
		/**
		 * If peerMissing below is set to true this will contain information about missing peers.
		 */
		peerMissing?: [
			{
				/**
				 * The id of the package which requires the unmet peer dependency.
				 * @type {string}
				 */
				requiredBy: string;
				/**
				 * The id of the unmet peer dependency.
				 * @type {string}
				 */
				requires: string;
			}
		];
		/**
		 * Dependencies of the dependency.
		 * @type {INpmDependencyInfo}
		 */
		dependencies: INpmDependencyInfo;
		/**
		 * Whether the dependency was found or not.
		 * @type {boolean}
		 */
		_found: boolean;
	};
	/**
	 * Set to true if peer dependency unmet.
	 * @type {boolean}
	 */
	peerMissing: boolean;
}

/**
 * Describes information about dependency update packages.
 */
interface INpm5DependencyInfo {
	/**
	 * Npm action type.
	 * @type {string}
	 */
	action: string;
	/**
	 * Dependency name.
	 * @type {string}
	 */
	name: string;
	/**
	 * Dependency version.
	 * @type {string}
	 */
	version: string;
	/**
	 * Destination of the installation.
	 * @type {string}
	 */
	path: string;
	/**
	 * Dependency previous version.
	 * @type {string}
	 */
	previousVersion: string;
}

/**
 * Describes information returned by the npm CLI upon calling install with --json flag.
 */
interface INpmInstallCLIResult {
	/**
	 * The name of the destination package. Note that this is not the installed package.
	 * @type {string}
	 */
	name: string;
	/**
	 * The version of the destination package. Note that this is not the installed package.
	 * @type {string}
	 */
	version: string;
	/**
	 * Installed dependencies. Note that whenever installing a particular dependency it is listed as the first key and after it any number of peer dependencies may follow.
	 * Whenever installing npm prints the information by reversing the tree of operations and because the initial dependency was installed last it is listed first.
	 * @type {INpmDependencyInfo | INpmPeerDependencyInfo}
	 */
	dependencies: INpmDependencyInfo | INpmPeerDependencyInfo;
	/**
	 * Describes problems that might have occurred during installation. For example missing peer dependencies.
	 */
	problems?: string[];
}

/**
 * Describes information returned by the npm 5 CLI upon calling install with --json flag.
 */
interface INpm5InstallCliResult {
	/**
	 * Added dependencies. Note that whenever add a particular dependency with npm 5 it is listed inside of array with key "Added".
	 * @type {INpmDependencyUpdateInfo[]}
	 */
	added: INpm5DependencyInfo[];
	/**
	 * Removed dependencies. Note that whenever remove a particular dependency with npm 5 it is listed inside of array with key "removed".
	 * @type {INpmDependencyUpdateInfo[]}
	 */
	removed: INpm5DependencyInfo[];
	/**
	 * Updated dependencies. Note that whenever update a particular dependency with npm 5 it is listed inside of array with key "updated".
	 * @type {INpmDependencyUpdateInfo[]}
	 */
	updated: INpm5DependencyInfo[];
	/**
	 * Moved dependencies. Note that whenever move a particular dependency with npm 5 it is listed inside of array with key "moved".
	 * @type {INpmDependencyUpdateInfo[]}
	 */
	moved: INpm5DependencyInfo[];
	/**
	 * Failed dependencies. Note that whenever use npm 5 and the operation over particular dependency fail it is listed inside of array with key "failed".
	 * @type {INpmDependencyUpdateInfo[]}
	 */
	failed: INpm5DependencyInfo[];
	/**
	 * Warnings. Note that whenever use npm 5 and the operation over particular dependency have warnings they are listed inside of array with key "warnings".
	 * @type {INpmDependencyUpdateInfo[]}
	 */
	warnings: INpm5DependencyInfo[];
	/**
	 *Time elapsed.
	 * @type {Number}
	 */
	elapsed: Number
}

/**
 * Describes information about installed package.
 */
interface INpmInstallResultInfo {
	/**
	 * Installed package's name.
	 * @type {string}
	 */
	name: string;
	/**
	 * Installed package's version.
	 * @type {string}
	 */
	version: string;
	/**
	 * The original output that npm CLI produced upon installation.
	 * @type {INpmInstallCLIResult}
	 */
	originalOutput?: INpmInstallCLIResult | INpm5InstallCliResult;
}

interface INpmInstallOptions {
	pathToSave?: string;
	version?: string;
	dependencyType?: string;
}

/**
 * Describes npm package installed in node_modules.
 */
interface IDependencyData {
	/**
	 * The name of the package.
	 */
	name: string;

	/**
	 * The full path where the package is installed.
	 */
	directory: string;

	/**
	 * The depth inside node_modules dir, where the package is located.
	 * The <project_dir>/node_modules/ is level 0.
	 * Level 1 is <project dir>/node_modules/<package name>/node_modules, etc.
	 */
	depth: number;

	/**
	 * Describes the `nativescript` key in package.json of a dependency.
	 */
	nativescript?: any;

	/**
	 * Dependencies of the current module.
	 */
	dependencies?: string[];
}

interface INpmsResult {
	total: number;
	results: INpmsSingleResultData[];
}

interface INpmsSingleResultData {
	package: INpmsPackageData;
	flags: INpmsFlags;
	score: INpmsScore;
	searchScore: number;
}

interface INpmsPackageData {
	name: string;
	// unscoped in case package is not in a scope
	// scope name in case part of a scope "angular" for example for @angular/core
	scope: string;
	version: string;
	description: string;
	keywords: string[];
	date: string;
	links: { npm: string };
	author: { name: string };
	publisher: INpmsUser;
	maintainers: INpmsUser[];
}

interface IUsername {
	username: string;
}

interface INpmsUser extends IUsername {
	email: string;
}

interface INpmsFlags {
	unstable: boolean;
	insecure: number;
	// Describes the reason for deprecation.
	deprecated: string;
}

interface INpmsScore {
	final: number;
	detail: {
		quality: number;
		popularity: number;
		maintenance: number;
	}
}

interface IStaticConfig extends Config.IStaticConfig { }

interface IConfiguration extends Config.IConfig {
	ANDROID_DEBUG_UI: string;
	USE_POD_SANDBOX: boolean;
	UPLOAD_PLAYGROUND_FILES_ENDPOINT: string;
}

interface IApplicationPackage {
	packageName: string;
	time: Date;
}

interface IOpener {
	open(target: string, appname: string): void;
}

interface IBundle {
	bundle: boolean;
}

interface IBundleString {
	bundle: string;
}

interface IPlatformTemplate {
	platformTemplate: string;
}


interface IClean {
	clean: boolean;
}

interface IProvision {
	provision: string;
}

interface ITeamIdentifier {
	teamId: string;
}

interface IAndroidReleaseOptions {
	keyStoreAlias?: string;
	keyStoreAliasPassword?: string;
	keyStorePassword?: string;
	keyStorePath?: string;
}

interface INpmInstallConfigurationOptionsBase {
	frameworkPath: string;
	ignoreScripts: boolean; //npm flag
}

interface INpmInstallConfigurationOptions extends INpmInstallConfigurationOptionsBase {
	disableNpmInstall: boolean;
}

interface ICreateProjectOptions extends INpmInstallConfigurationOptionsBase {
	pathToTemplate?: string;
}

interface IDebugInformation extends IPort, Mobile.IDeviceIdentifier {
	url: string;
}

interface IPort {
	port: Number;
}

interface IPluginSeedOptions {
	username: string;
	pluginName: string;
}

interface IOptions extends ICommonOptions, IBundleString, IPlatformTemplate, IHasEmulatorOption, IClean, IProvision, ITeamIdentifier, IAndroidReleaseOptions, INpmInstallConfigurationOptions, IPort, IEnvOptions, IPluginSeedOptions {
	all: boolean;
	client: boolean;
	compileSdk: number;
	copyTo: string;
	debugTransport: boolean;
	forDevice: boolean;
	framework: string;
	frameworkName: string;
	frameworkVersion: string;
	ipa: string;
	tsc: boolean;
	ng: boolean;
	androidTypings: boolean;
	production: boolean; //npm flag
	sdk: string;
	syncAllFiles: boolean;
	chrome: boolean;
	inspector: boolean; // the counterpart to --chrome
	background: string;
	hmr: boolean;
}

interface IEnvOptions {
	env: Object;
}

interface IAndroidBuildOptionsSettings extends IAndroidReleaseOptions, IRelease { }

interface IAppFilesUpdaterOptions extends IBundle, IRelease, IOptionalWatchAllFiles { }

interface IPlatformBuildData extends IAppFilesUpdaterOptions, IBuildConfig, IEnvOptions { }

interface IDeviceEmulator extends IHasEmulatorOption, IDeviceIdentifier { }

interface IRunPlatformOptions extends IJustLaunch, IDeviceEmulator { }

interface IDeployPlatformOptions extends IAndroidReleaseOptions, IPlatformTemplate, IRelease, IClean, IDeviceEmulator, IProvision, ITeamIdentifier, IProjectDir {
	forceInstall?: boolean;
}

interface IUpdatePlatformOptions extends IPlatformTemplate {
	currentVersion: string;
	newVersion: string;
	canUpdate: boolean;
}

interface IInitService {
	initialize(): Promise<void>;
}

interface IInfoService {
	printComponentsInfo(): Promise<void>;
}

interface IAndroidResourcesMigrationService {
	canMigrate(platformString: string): boolean;
	hasMigrated(appResourcesDir: string): boolean;
	migrate(appResourcesDir: string): Promise<void>;
}

/**
 * Describes properties needed for uploading a package to iTunes Connect
 */
interface IITMSData extends ICredentials {
	/**
	 * Path to a .ipa file which will be uploaded.
	 * @type {string}
	 */
	ipaFilePath: string;
	/**
	 * Specifies whether the logging level of the itmstransporter command-line tool should be set to verbose.
	 * @type {string}
	 */
	verboseLogging?: boolean;
}

/**
 * Used for communicating with Xcode's iTMS Transporter tool.
 */
interface IITMSTransporterService {
	/**
	 * Uploads an .ipa package to iTunes Connect.
	 * @param  {IITMSData}     data Data needed to upload the package
	 * @return {Promise<void>}
	 */
	upload(data: IITMSData): Promise<void>;
	/**
	 * Queries Apple's content delivery API to get the user's registered iOS applications.
	 * @param  {ICredentials}                               credentials Credentials for authentication with iTunes Connect.
	 * @return {Promise<IItunesConnectApplication[]>}          The user's iOS applications.
	 */
	getiOSApplications(credentials: ICredentials): Promise<IiTunesConnectApplication[]>;
}

/**
 * Provides access to information about installed Android tools and SDKs versions.
 */
interface IAndroidToolsInfo {
	/**
	 * Provides information about installed Android SDKs, Build Tools, Support Library
	 * and ANDROID_HOME environement variable.
	 * @return {IAndroidToolsInfoData} Information about installed Android Tools and SDKs.
	 */
	getToolsInfo(): IAndroidToolsInfoData;

	/**
	 * Validates the information about required Android tools and SDK versions.
	 * @param {any} options Defines if the warning messages should treated as error and if the targetSdk value should be validated as well.
	 * @return {boolean} True if there are detected issues, false otherwise.
	 */
	validateInfo(options?: IAndroidToolsInfoValidateInput): boolean;

	/**
	 * Validates the information about required JAVA version.
	 * @param {string} installedJavaVersion The JAVA version that will be checked.
	 * @param {any} options Defines if the warning messages should treated as error.
	 * @return {boolean} True if there are detected issues, false otherwise.
	 */
	validateJavacVersion(installedJavaVersion: string, options?: IAndroidToolsInfoOptions): boolean;

	/**
	 * Validates if ANDROID_HOME environment variable is set correctly.
	 * @param {any} options Defines if the warning messages should treated as error.
	 * @returns {boolean} true in case ANDROID_HOME is correctly set, false otherwise.
	 */
	validateAndroidHomeEnvVariable(options?: IAndroidToolsInfoOptions): boolean;

	/**
	 * Validates target sdk
	 * @param {IAndroidToolsInfoOptions} options @optional Defines if the warning messages should treated as error.
	 * @returns {boolean} True if there are detected issues, false otherwise
	*/
	validateTargetSdk(options?: IAndroidToolsInfoOptions): boolean;

	/**
	 * Gets the path to `adb` executable from ANDROID_HOME. It should be `$ANDROID_HOME/platform-tools/adb` in case it exists.
	 * @return {string} Path to the `adb` executable. In case it does not exists, null is returned.
	 */
	getPathToAdbFromAndroidHome(): Promise<string>;
}

/**
 * Describes information about installed Android tools and SDKs.
 */
interface IAndroidToolsInfoData {
	/**
	 * The value of ANDROID_HOME environment variable.
	 */
	androidHomeEnvVar: string;

	/**
	 * The latest installed version of Android Build Tools that satisfies CLI's requirements.
	 */
	buildToolsVersion: string;

	/**
	 * The latest installed version of Android SDK that satisfies CLI's requirements.
	 */
	compileSdkVersion: number;

	/**
	 * The latest installed version of Android Support Repository that satisfies CLI's requirements.
	 */
	supportRepositoryVersion: string;

	/**
	 * The Android targetSdkVersion specified by the user.
	 * In case it is not specified, compileSdkVersion will be used for targetSdkVersion.
	 */
	targetSdkVersion: number;

	/**
	 * Whether or not `.d.ts` typings should be generated for compileSdk. Experimental feature
	 */
	generateTypings: boolean;
}

/**
 * Describes options that can be passed to methods from IAndroidToolsInfo interface
 */
interface IAndroidToolsInfoOptions {
	/**
	 * Defines if the warning messages should treated as error.
	 */
	showWarningsAsErrors: boolean;
}

interface IAndroidToolsInfoValidateInput extends IAndroidToolsInfoOptions {
	/**
	 * Defines if the targetSdk value should be validated.
	 */
	validateTargetSdk: boolean;
}

interface ISocketProxyFactory extends NodeJS.EventEmitter {
	createTCPSocketProxy(factory: () => Promise<any>): Promise<any>;
	createWebSocketProxy(factory: () => Promise<any>, deviceIdentifier: string): Promise<any>;
}

interface IiOSNotification extends NodeJS.EventEmitter {
	getWaitForDebug(projectId: string): string;
	getAttachRequest(projectId: string, deviceId: string): string;
	getAppLaunching(projectId: string): string;
	getReadyForAttach(projectId: string): string;
	getAttachAvailabilityQuery(projectId: string): string;
	getAlreadyConnected(projectId: string): string;
	getAttachAvailable(projectId: string): string;
}

interface IiOSSocketRequestExecutor {
	executeLaunchRequest(deviceIdentifier: string, timeout: number, readyForAttachTimeout: number, projectId: string, shouldBreak?: boolean): Promise<void>;
	executeAttachRequest(device: Mobile.IiOSDevice, timeout: number, projectId: string): Promise<void>;
}

/**
 * Describes validation methods for XMLs.
 */
interface IXmlValidator {
	/**
	 * Checks the passed xml files for errors and if such exists, print them on the stdout.
	 * @param {string[]} sourceFiles Files to be checked. Only the ones that ends with .xml are filtered.
	 * @return {boolean} true in case there are no errors in specified files and false in case there's at least one error.
	 */
	validateXmlFiles(sourceFiles: string[]): boolean;

	/**
	 * Checks the passed xml file for errors and returns them as a result.
	 * @param {string} sourceFile File to be checked.
	 * @return {string} The errors detected (as a single string) or null in case there are no errors.
	 */
	getXmlFileErrors(sourceFile: string): string;
}

/**
 * Describes methods for working with versions.
 */
interface IVersionsService {
	/**
	 * Gets version information about nativescript-cli.
	 * @return {Promise<IVersionInformation>} The version information.
	 */
	getNativescriptCliVersion(): Promise<IVersionInformation>;

	/**
	 * Gets version information about tns-core-modules.
	 * @return {Promise<IVersionInformation>} The version information.
	 */
	getTnsCoreModulesVersion(): Promise<IVersionInformation>;

	/**
	 * Gets versions information about nativescript runtimes.
	 * @return {Promise<IVersionInformation[]>} The version information.
	 */
	getRuntimesVersions(): Promise<IVersionInformation[]>;

	/**
	 * Gets versions information about all nativescript components.
	 * @return {Promise<IVersionInformation[]>} The version information.
	 */
	getAllComponentsVersions(): Promise<IVersionInformation[]>;

	/**
	 * Checks version information about the nativescript components and prints versions information.
	 * @return {Promise<void>}
	 */
	printVersionsInformation(): Promise<void>;
}

/**
 * Describes methods for project name.
 */
interface IProjectNameService {
	/**
	 * Ensures the passed project name is valid. If the project name is not valid prompts for actions.
	 * @param {string} project name to be checked.
	 * @param {IOptions} current command options.
	 * @return {Promise<strng>} returns the selected name of the project.
	 */
	ensureValidName(projectName: string, validateOptions?: { force: boolean }): Promise<string>;
}

/**
 * Designed for getting information about xcproj.
 */
interface IXcprojService {
	/**
	 * Checks whether the system needs xcproj to execute ios builds successfully.
	 * In case the system does need xcproj but does not have it, prints an error message.
	 * @param {boolean} whether to fail with error message or not
	 * @return {Promise<boolean>} whether an error occurred or not.
	 */
	verifyXcproj(shouldFail: boolean): Promise<boolean>;
	/**
	 * Collects information about xcproj.
	 * @return {Promise<XcprojInfo>} collected info about xcproj.
	 */
	getXcprojInfo(): Promise<IXcprojInfo>;
}

/**
 * Describes information about xcproj brew formula.
 */
interface IXcprojInfo {
	/**
	 * determines whether the system needs xcproj to execute ios builds sucessfully
	 */
	shouldUseXcproj: boolean;
	/**
	 * pod version string, as returned by `pod --version`
	 */
	cocoapodVer: string;
	/**
	 * Xcode's version
	 */
	xcodeVersion: IVersionData;
	/**
	 * determines whether xcproj can be called from the command line
	 */
	xcprojAvailable: boolean;
}

/**
 * Describes helper used during execution of deploy commands.
 */
interface IDeployCommandHelper {
	/**
	 * Retrieves data needed to execute deploy command.
	 * @param {string} platform platform to which to deploy - could be android or ios.
	 * @return {IDeployPlatformInfo} data needed to execute deploy command.
	 */
	getDeployPlatformInfo(platform: string): IDeployPlatformInfo;
}

/**
 * Describes helper for validating bundling.
 */
interface IBundleValidatorHelper {
	/**
	 * Validates bundling options.
	 * @return {void}
	 */
	validate(): void;
}

interface INativeScriptCloudExtensionService {
	/**
	 * Installs nativescript-cloud extension
	 * @return {Promise<IExtensionData>} returns the extension data
	 */
	install(): Promise<IExtensionData>;
	/**
	 * Checks if nativescript-cloud extension is installed
	 * @return {boolean} returns true in case when nativescript-cloud extension is installed, false otherwise
	 */
	isInstalled(): boolean
}

/**
 * Describes the basic data needed for resource generation
 */
interface IResourceGenerationData extends IProjectDir {
	/**
	 * @param {string} imagePath Path to the image that will be used for generation
	 */
	imagePath: string,

	/**
	 * @param {string} platform Specify for which platform to generate assets. If not defined will generate for all platforms
	 */
	platform?: string
}

/**
 * Describes the data needed for splash screens generation
 */
interface ISplashesGenerationData extends IResourceGenerationData {
	/**
	 * @param {string} background Background color that will be used for background. Defaults to #FFFFFF
	 */
	background?: string
}

/**
 * Describes service used for assets generation
 */
interface IAssetsGenerationService {
	/**
	 * Generate icons for iOS and Android
	 * @param {IResourceGenerationData} iconsGenerationData Provides the data needed for icons generation
	 * @returns {Promise<void>}
	 */
	generateIcons(iconsGenerationData: IResourceGenerationData): Promise<void>;

	/**
	 * Generate splash screens for iOS and Android
	 * @param {ISplashesGenerationData} splashesGenerationData Provides the data needed for splash screens generation
	 * @returns {Promise<void>}
	 */
	generateSplashScreens(splashesGenerationData: ISplashesGenerationData): Promise<void>;
}

/**
 * Describes the Gradle versions specified in the package.json of the Android runtime
 */
interface IRuntimeGradleVersions {
	gradleVersion?: string;
	gradleAndroidPluginVersion?: string;
}