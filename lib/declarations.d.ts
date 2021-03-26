import { IProjectData, IBuildConfig } from "./definitions/project";
import { IBuildData } from "./definitions/build";
import {
	IRelease,
	IDeviceIdentifier,
	IJustLaunch,
	IAvd,
	IAvailableDevices,
	IProfileDir,
	IHasEmulatorOption,
	IYargArgv,
	IDashedOption,
	IDictionary,
	IProjectDir,
	ICredentials,
	IVersionInformation,
	IVersionData,
	IStringDictionary,
} from "./common/declarations";
import { IExtensionData } from "./common/definitions/extensibility";
import { IApplePortalUserDetail } from "./services/apple-portal/definitions";

interface INodePackageManager {
	/**
	 * Installs dependency
	 * @param  {string}                            packageName The name of the dependency - can be a path, a url or a string.
	 * @param  {string}                            pathToSave  The destination of the installation.
	 * @param  {INodePackageManagerInstallOptions} config      Additional options that can be passed to manipulate installation.
	 * @return {Promise<INpmInstallResultInfo>}                Information about installed package.
	 */
	install(
		packageName: string,
		pathToSave: string,
		config: INodePackageManagerInstallOptions
	): Promise<INpmInstallResultInfo>;

	/**
	 * Uninstalls a dependency
	 * @param  {string}                            packageName The name of the dependency.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate uninstallation.
	 * @param  {string}                            path  The destination of the uninstallation.
	 * @return {Promise<string>}                The output of the uninstallation.
	 */
	uninstall(
		packageName: string,
		config?: IDictionary<string | boolean>,
		path?: string
	): Promise<string>;

	/**
	 * Provides information about a given package.
	 * @param  {string}                            packageName The name of the package.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate view.
	 * @return {Promise<any>}                Object, containing information about the package.
	 */
	view(packageName: string, config: Object): Promise<any>;

	/**
	 * Checks if the specified string is name of a packaged published in the NPM registry.
	 * @param  {string} packageName The string to be checked.
	 * @return {Promise<boolean>} True if the specified string is a registered package name, false otherwise.
	 */
	isRegistered(packageName: string): Promise<boolean>;

	/**
	 * Separates the package name and version from a specified fullPackageName.
	 * @param  {string} fullPackageName The full name of the package like nativescript@10.0.0.
	 * @return {INpmPackageNameParts} An object containing the separated package name and version.
	 */
	getPackageNameParts(fullPackageName: string): Promise<INpmPackageNameParts>;

	/**
	 * Returns the full name of an npm package based on the provided name and version.
	 * @param  {INpmPackageNameParts} packageNameParts An object containing the package name and version.
	 * @return {string} The full name of the package like nativescript@10.0.0.
	 */
	getPackageFullName(packageNameParts: INpmPackageNameParts): Promise<string>;

	/**
	 * Searches for a package.
	 * @param  {string[]}                            filter Keywords with which to perform the search.
	 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate search.
	 * @return {Promise<string>}                The output of the uninstallation.
	 */
	search(
		filter: string[],
		config: IDictionary<string | boolean>
	): Promise<string>;

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

interface IPackageManager extends INodePackageManager {
	/**
	 * Gets the name of the package manager used for the current process.
	 * It can be read from the user settings or by passing -- option.
	 */
	getPackageManagerName(): Promise<string>;

	/**
	 * Gets the version corresponding to the tag for the package
	 * @param {string} packageName The name of the package.
	 * @param {string} tag The tag which we need the version of.
	 * @returns {string} The version corresponding to the tag
	 */
	getTagVersion(packageName: string, tag: string): Promise<string>;
}

interface IPerformanceService {
	// Will process the data based on the command options (--performance flag and user-reporting setting)
	processExecutionData(
		methodInfo: string,
		startTime: number,
		endTime: number,
		args: any[]
	): void;

	// Will return a reference time in milliseconds
	now(): number;
}

interface IPackageInstallationManager {
	install(
		packageName: string,
		packageDir: string,
		options?: INpmInstallOptions
	): Promise<any>;
	uninstall(
		packageName: string,
		packageDir: string,
		options?: IDictionary<string | boolean>
	): Promise<any>;
	getLatestVersion(packageName: string): Promise<string>;
	getNextVersion(packageName: string): Promise<string>;
	getLatestCompatibleVersion(
		packageName: string,
		referenceVersion?: string
	): Promise<string>;
	getMaxSatisfyingVersion(
		packageName: string,
		versionRange: string
	): Promise<string>;
	getLatestCompatibleVersionSafe(
		packageName: string,
		referenceVersion?: string
	): Promise<string>;
	getInspectorFromCache(
		inspectorNpmPackageName: string,
		projectDir: string
	): Promise<string>;
	clearInspectorCache(): void;
	getInstalledDependencyVersion(
		packageName: string,
		projectDir?: string
	): Promise<string>;
	getMaxSatisfyingVersionSafe(
		packageName: string,
		versionIdentifier: string
	): Promise<string>;
}

/**
 * Describes options that can be passed to manipulate package installation.
 */
interface INodePackageManagerInstallOptions
	extends INpmInstallConfigurationOptions,
		IDictionary<string | boolean> {
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
	};
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
	 * @type {INpm5DependencyInfo[]}
	 */
	added: INpm5DependencyInfo[];
	/**
	 * Removed dependencies. Note that whenever remove a particular dependency with npm 5 it is listed inside of array with key "removed".
	 * @type {INpm5DependencyInfo[]}
	 */
	removed: INpm5DependencyInfo[];
	/**
	 * Updated dependencies. Note that whenever update a particular dependency with npm 5 it is listed inside of array with key "updated".
	 * @type {INpm5DependencyInfo[]}
	 */
	updated: INpm5DependencyInfo[];
	/**
	 * Moved dependencies. Note that whenever move a particular dependency with npm 5 it is listed inside of array with key "moved".
	 * @type {INpm5DependencyInfo[]}
	 */
	moved: INpm5DependencyInfo[];
	/**
	 * Failed dependencies. Note that whenever use npm 5 and the operation over particular dependency fail it is listed inside of array with key "failed".
	 * @type {INpm5DependencyInfo[]}
	 */
	failed: INpm5DependencyInfo[];
	/**
	 * Warnings. Note that whenever use npm 5 and the operation over particular dependency have warnings they are listed inside of array with key "warnings".
	 * @type {INpm5DependencyInfo[]}
	 */
	warnings: INpm5DependencyInfo[];
	/**
	 * Time elapsed.
	 * @type {Number}
	 */
	elapsed: Number;
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

	version: string;
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

interface INpmPackageNameParts {
	name: string;
	version: string;
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
	};
}

interface IStaticConfig extends Config.IStaticConfig {}

interface IConfiguration extends Config.IConfig {
	ANDROID_DEBUG_UI: string;
	USE_POD_SANDBOX: boolean;
	UPLOAD_PLAYGROUND_FILES_ENDPOINT: string;
	SHORTEN_URL_ENDPOINT: string;
	INSIGHTS_URL_ENDPOINT: string;
	WHOAMI_URL_ENDPOINT: string;
	PREVIEW_APP_ENVIRONMENT: string;
	GA_TRACKING_ID: string;
}

interface IApplicationPackage {
	packageName: string;
	time: Date;
}

interface IOpener {
	open(target: string, appName: string): void;
}

interface IBundleString {
	bundle: string;
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

interface INpmInstallConfigurationOptions
	extends INpmInstallConfigurationOptionsBase {
	disableNpmInstall: boolean;
}

interface IGenerateOptions {
	collection?: string;
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
	includeTypeScriptDemo: string;
	includeAngularDemo: string;
}

interface IAndroidBundleOptions {
	aab: boolean;
}

interface IOptions
	extends IRelease,
		IDeviceIdentifier,
		IJustLaunch,
		IAvd,
		IAvailableDevices,
		IProfileDir,
		IHasEmulatorOption,
		IBundleString,
		IHasEmulatorOption,
		IClean,
		IProvision,
		ITeamIdentifier,
		IAndroidReleaseOptions,
		IAndroidBundleOptions,
		INpmInstallConfigurationOptions,
		IPort,
		IEnvOptions,
		IPluginSeedOptions,
		IGenerateOptions {
	argv: IYargArgv;
	validateOptions(
		commandSpecificDashedOptions?: IDictionary<IDashedOption>,
		projectData?: IProjectData
	): void;
	options: IDictionary<IDashedOption>;
	shorthands: string[];
	/**
	 * Project Configuration
	 */
	config: string[];
	log: string;
	verbose: boolean;
	path: string;
	version: boolean;
	help: boolean;
	json: boolean;
	watch: boolean;
	timeout: string;
	appid: string;
	geny: string;
	debugBrk: boolean;
	debugPort: number;
	start: boolean;
	stop: boolean;
	ddi: string; // the path to developer  disk image
	insecure: boolean;
	skipRefresh: boolean;
	file: string;
	analyticsClient: string;
	force: boolean;
	sdk: string;
	template: string;
	certificate: string;
	certificatePassword: string;
	var: Object;
	default: Boolean;
	count: number;
	hooks: boolean;
	debug: boolean;
	all: boolean;
	client: boolean;
	compileSdk: number;
	copyTo: string;
	debugTransport: boolean;
	forDevice: boolean;
	iCloudContainerEnvironment: string;
	framework: string;
	frameworkName: string;
	frameworkVersion: string;
	yarn: string;
	pnpm: string;
	ipa: string;
	tsc: boolean;
	ts: boolean;
	typescript: boolean;
	ng: boolean;
	angular: boolean;
	react: boolean;
	svelte: boolean;
	vue: boolean;
	vuejs: boolean;
	js: boolean;
	javascript: boolean;
	androidTypings: boolean;
	production: boolean; //npm flag
	chrome: boolean;
	inspector: boolean; // the counterpart to --chrome
	background: string;
	hmr: boolean;
	link: boolean;
	analyticsLogFile: string;
	performance: Object;
	cleanupLogFile: string;
	appleApplicationSpecificPassword: string;
	appleSessionBase64: string;
	markingMode: boolean;
}

interface IEnvOptions {
	env: any;
}

interface IAndroidBuildOptionsSettings
	extends IAndroidReleaseOptions,
		IRelease,
		Partial<IHasAndroidBundle> {}

interface IHasAndroidBundle {
	androidBundle: boolean;
}

interface IPlatformBuildData
	extends IRelease,
		IHasUseHotModuleReloadOption,
		IBuildConfig,
		IEnvOptions {}

interface IDeviceEmulator extends IHasEmulatorOption, IDeviceIdentifier {}

interface IRunPlatformOptions extends IJustLaunch, IDeviceEmulator {}

interface IDeployPlatformOptions
	extends IAndroidReleaseOptions,
		IRelease,
		IClean,
		IDeviceEmulator,
		IProvision,
		ITeamIdentifier,
		IProjectDir {
	forceInstall?: boolean;
}

interface IUpdatePlatformOptions {
	currentVersion: string;
	newVersion: string;
}

interface IInfoService {
	printComponentsInfo(): Promise<void>;
}

interface IAndroidResourcesMigrationService {
	canMigrate(platformString: string): boolean;
	hasMigrated(appResourcesDir: string): boolean;
	migrate(appResourcesDir: string, backupLocation?: string): Promise<void>;
}

/**
 * Describes properties needed for uploading a package to iTunes Connect
 */
interface IITMSData {
	credentials: ICredentials;

	user: IApplePortalUserDetail;

	applicationSpecificPassword: string;
	/**
	 * Path to a .ipa file which will be uploaded.
	 * @type {string}
	 */
	ipaFilePath: string;

	/**
	 * Specify if the service should extract the `.ipa` file into `temp` directory in order to get bundleIdentifier from info.plist
	 */
	shouldExtractIpa: boolean;
	/**
	 * Specifies whether the logging level of the itmstransporter command-line tool should be set to verbose.
	 * @type {string}
	 */
	verboseLogging?: boolean;
}

/**
 * Used for communicating with Xcode iTMS Transporter tool.
 */
interface IITMSTransporterService {
	validate(): Promise<void>;
	/**
	 * Uploads an .ipa package to iTunes Connect.
	 * @param  {IITMSData}     data Data needed to upload the package
	 * @return {Promise<void>}
	 */
	upload(data: IITMSData): Promise<void>;
}

/**
 * Provides access to information about installed Android tools and SDKs versions.
 */
interface IAndroidToolsInfo {
	/**
	 * Provides information about installed Android SDKs, Build Tools, Support Library
	 * and ANDROID_HOME environment variable.
	 * @param {IProjectDir} config Object with a single property - projectDir. This is the root directory where NativeScript project is located.
	 * @return {IAndroidToolsInfoData} Information about installed Android Tools and SDKs.
	 */
	getToolsInfo(config?: IProjectDir): IAndroidToolsInfoData;

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
	validateJavacVersion(
		installedJavaVersion: string,
		options?: IAndroidToolsInfoOptions
	): boolean;

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
interface IAndroidToolsInfoData
	extends NativeScriptDoctor.IAndroidToolsInfoData {
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
interface IAndroidToolsInfoOptions extends Partial<IProjectDir> {
	/**
	 * Defines if the warning messages should treated as error.
	 */
	showWarningsAsErrors?: boolean;
}

interface IAndroidToolsInfoValidateInput extends IAndroidToolsInfoOptions {
	/**
	 * Defines if the targetSdk value should be validated.
	 */
	validateTargetSdk: boolean;
}

interface IAppDebugSocketProxyFactory extends NodeJS.EventEmitter {
	getTCPSocketProxy(deviceIdentifier: string, appId: string): any;
	addTCPSocketProxy(
		device: Mobile.IiOSDevice,
		appId: string,
		projectName: string,
		projectDir: string
	): Promise<any>;

	ensureWebSocketProxy(
		device: Mobile.IiOSDevice,
		appId: string,
		projectName: string,
		projectDir: string
	): Promise<any>;

	removeAllProxies(): void;
}

// tslint:disable-next-line:interface-name
interface IiOSNotification extends NodeJS.EventEmitter {
	getAttachRequest(appId: string, deviceId: string): string;
	getReadyForAttach(appId: string): string;
	getRefreshRequest(appId: string): string;
	getAppRefreshStarted(appId: string): string;
}

// tslint:disable-next-line:interface-name
interface IiOSSocketRequestExecutor {
	executeAttachRequest(
		device: Mobile.IiOSDevice,
		timeout: number,
		projectId: string
	): Promise<void>;
	executeRefreshRequest(
		device: Mobile.IiOSDevice,
		timeout: number,
		appId: string
	): Promise<boolean>;
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
	 * Gets version information about tns-core-modules and @nativescript/core packages.
	 * @return {Promise<IVersionInformation[]>} The version information.
	 */
	getTnsCoreModulesVersion(): Promise<IVersionInformation[]>;

	/**
	 * Gets versions information about nativescript runtimes.
	 * @return {Promise<IVersionInformation[]>} The version information.
	 */
	getRuntimesVersions(platform?: string): Promise<IVersionInformation[]>;

	/**
	 * Gets versions information about all nativescript components.
	 * @return {Promise<IVersionInformation[]>} The version information.
	 */
	getAllComponentsVersions(platform?: string): Promise<IVersionInformation[]>;

	/**
	 * Checks version information about the nativescript components and prints versions information.
	 * @return {Promise<void>}
	 */
	printVersionsInformation(platform?: string): Promise<void>;
}

/**
 * Describes methods for project name.
 */
interface IProjectNameService {
	/**
	 * Ensures the passed project name is valid. If the project name is not valid prompts for actions.
	 * @param {string} projectName project name to be checked.
	 * @param {IOptions} validateOptions current command options.
	 * @return {Promise<string>} returns the selected name of the project.
	 */
	ensureValidName(
		projectName: string,
		validateOptions?: { force: boolean }
	): Promise<string>;
}

/**
 * Describes options that can be passed to xcprojService.verifyXcproj method.
 */
interface IVerifyXcprojOptions {
	/**
	 * Whether to fail with error message or not
	 */
	shouldFail: boolean;
}

/**
 * Designed for getting information about xcproj.
 */
interface IXcprojService {
	/**
	 * Returns the path to the xcodeproj file
	 * @param projectData Information about the project.
	 * @param projectRoot The root folder of native project.
	 * @return {string} The full path to the xcodeproj
	 */
	getXcodeprojPath(projectData: IProjectData, projectRoot: string): string;
}

/**
 * Describes information about xcproj brew formula.
 */
interface IXcprojInfo {
	/**
	 * determines whether the system needs xcproj to execute ios builds successfully
	 */
	shouldUseXcproj: boolean;
	/**
	 * pod version string, as returned by `pod --version`
	 */
	cocoapodVer: string;
	/**
	 * Xcode version
	 */
	xcodeVersion: IVersionData;
	/**
	 * determines whether xcproj can be called from the command line
	 */
	xcprojAvailable: boolean;
}

interface IXcconfigService {
	/**
	 * Returns the paths to the xcconfig files for build configuration (debug/release)
	 * @param projectRoot The path to root folder of native project (platforms/ios)
	 * @returns {IStringDictionary}
	 */
	getPluginsXcconfigFilePaths(projectRoot: string): IStringDictionary;

	/**
	 * Returns the value of a property from a xcconfig file.
	 * @param xcconfigFilePath The path to the xcconfig file
	 * @param propertyName The name of the property which value will be returned
	 * @returns {string}
	 */
	readPropertyValue(xcconfigFilePath: string, propertyName: string): string;

	/**
	 * Merges the content of source file into destination file
	 * @param sourceFile The content of the source file
	 * @param destinationFile The content of the destination file
	 * @returns {Promise<void>}
	 */
	mergeFiles(sourceFile: string, destinationFile: string): Promise<void>;
}

/**
 * Describes helper for validating bundling.
 */
interface IBundleValidatorHelper {
	/**
	 * Validates bundling options.
	 * In case when minSupportedVersion is provided, gets the current version of @nativescript/webpack from package.json and compares with the provided version.
	 * @param {IProjectData} projectData
	 * @param {string} minSupportedVersion the minimum supported version of @nativescript/webpack
	 * @return {void}
	 */
	validate(projectData: IProjectData, minSupportedVersion?: string): void;

	/**
	 * Returns the installed bundler version.
	 * @return {string}
	 */
	getBundlerDependencyVersion(
		projectData: IProjectData,
		bundlerName?: string
	): string;
}

interface IAndroidBundleValidatorHelper {
	/**
	 * Validates android bundling option is not provided.
	 * Commands that require deploy of the application must not be called with --aab option
	 * @return {void}
	 */
	validateNoAab(): void;

	/**
	 * Validates android runtime version is sufficient to support bundling option --aab.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @return {void}
	 */
	validateRuntimeVersion(projectData: IProjectData): void;

	/**
	 * Validates that the specified device supports aab.
	 * @param {Mobile.IDevice} device The device to be validated.
	 * @param {IBuildData} buildData The current build data.
	 * @return {void}
	 */
	validateDeviceApiLevel(device: Mobile.IDevice, buildData: IBuildData): void;
}

interface IOptionsTracker {
	trackOptions(options: IOptions): Promise<void>;
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
	isInstalled(): boolean;
}

/**
 * Describes the basic data needed for resource generation
 */
interface IResourceGenerationData extends IProjectDir {
	/**
	 * @param {string} imagePath Path to the image that will be used for generation
	 */
	imagePath: string;

	/**
	 * @param {string} platform Specify for which platform to generate assets. If not defined will generate for all platforms
	 */
	platform?: string;
}

/**
 * Describes the data needed for splash screens generation
 */
interface ISplashesGenerationData extends IResourceGenerationData {
	/**
	 * @param {string} background Background color that will be used for background. Defaults to #FFFFFF
	 */
	background?: string;
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
	generateSplashScreens(
		splashesGenerationData: ISplashesGenerationData
	): Promise<void>;
}

/**
 * Describes the Gradle versions specified in the package.json of the Android runtime
 */
interface IRuntimeGradleVersions {
	gradleVersion?: string;
	gradleAndroidPluginVersion?: string;
}

interface INetworkConnectivityValidator {
	validate(): Promise<void>;
}

interface IPlatformValidationService {
	/**
	 * Ensures the passed platform is a valid one (from the supported ones)
	 */
	validatePlatform(platform: string, projectData: IProjectData): void;

	/**
	 * Returns whether the passed platform is a valid one (from the supported ones)
	 */
	isValidPlatform(platform: string, projectData: IProjectData): boolean;

	/**
	 * Gets first chance to validate the options provided as command line arguments.
	 * If no platform is provided or a falsy (null, undefined, "", false...) platform is provided,
	 * the options will be validated for all available platforms.
	 */
	validateOptions(
		provision: true | string,
		teamId: true | string,
		projectData: IProjectData,
		platform?: string
	): Promise<boolean>;

	validatePlatformInstalled(platform: string, projectData: IProjectData): void;

	/**
	 * Checks whether passed platform can be built on the current OS
	 * @param {string} platform The mobile platform.
	 * @param {IProjectData} projectData DTO with information about the project.
	 * @returns {boolean} Whether the platform is supported for current OS or not.
	 */
	isPlatformSupportedForOS(
		platform: string,
		projectData: IProjectData
	): boolean;
}

interface IPlatformCommandHelper {
	addPlatforms(
		platforms: string[],
		projectData: IProjectData,
		frameworkPath?: string
	): Promise<void>;
	cleanPlatforms(
		platforms: string[],
		projectData: IProjectData,
		frameworkPath: string
	): Promise<void>;
	removePlatforms(
		platforms: string[],
		projectData: IProjectData
	): Promise<void>;
	updatePlatforms(
		platforms: string[],
		projectData: IProjectData
	): Promise<void>;
	getInstalledPlatforms(projectData: IProjectData): string[];
	getAvailablePlatforms(projectData: IProjectData): string[];
	getPreparedPlatforms(projectData: IProjectData): string[];
	getCurrentPlatformVersion(
		platform: string,
		projectData: IProjectData
	): string;
}

interface IWatchIgnoreListService {
	addFileToIgnoreList(filePath: string): void;
	removeFileFromIgnoreList(filePath: string): void;
	isFileInIgnoreList(filePath: string): boolean;
}

interface INpmConfigService {
	getConfig(): IDictionary<any>;
}

interface ISharedEventBus extends NodeJS.EventEmitter {}
