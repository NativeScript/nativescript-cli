interface INodePackageManager {
	getCache(): string;
	load(config?: any): IFuture<void>;
	install(packageName: string, pathToSave: string, config?: any): IFuture<any>;
	uninstall(packageName: string, config?: any, path?: string): IFuture<any>;
	cache(packageName: string, version: string, cache?: any): IFuture<IDependencyData>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	view(packageName: string, propertyName: string): IFuture<any>;
	executeNpmCommand(npmCommandName: string, currentWorkingDirectory: string): IFuture<any>;
	search(filter: string[], silent: boolean): IFuture<any>;
}

interface INpmInstallationManager {
	getCacheRootPath(): string;
	addToCache(packageName: string, version: string): IFuture<any>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	install(packageName: string, options?: INpmInstallOptions): IFuture<string>;
	getLatestVersion(packageName: string): IFuture<string>;
	getLatestCompatibleVersion(packageName: string): IFuture<string>;
	getCachedPackagePath(packageName: string, version: string): string;
}

interface INpmInstallOptions {
	pathToSave?: string;
	version?: string;
}

interface IDependencyData {
	name: string;
	version: string;
	nativescript: any;
	dependencies?: IStringDictionary;
	devDependencies?: IStringDictionary;
}

interface IStaticConfig extends Config.IStaticConfig { }

interface IConfiguration extends Config.IConfig {
	ANDROID_DEBUG_UI: string;
	USE_POD_SANDBOX: boolean;
}

interface IApplicationPackage {
	packageName: string;
	time: Date;
}

interface ILockFile {
	lock(): IFuture<void>;
	unlock(): IFuture<void>;
	check(): IFuture<boolean>;
}

interface IOpener {
    open(target: string, appname: string): void;
}

interface ILiveSyncService {
	liveSync(platform: string): IFuture<void>;
	forceExecuteFullSync: boolean;
}

interface IOptions extends ICommonOptions {
	all: boolean;
	baseConfig: string;
	client: boolean;
	compileSdk: number;
	copyFrom: string;
	copyTo: string;
	debugTransport: boolean;
	emulator: boolean;
	forDevice: boolean;
	framework: string;
	frameworkName: string;
	frameworkPath: string;
	frameworkVersion: string;
	ignoreScripts: boolean;
	ipa: string;
	keyStoreAlias: string;
	keyStoreAliasPassword: string;
	keyStorePassword: string;
	keyStorePath: string;
	linkTo: string;
	ng: boolean;
	bundle: boolean;
	platformTemplate: string;
	port: Number;
	production: boolean;
	sdk: string;
	symlink: boolean;
	tnsModulesVersion: string;
	teamId: string;
}

interface IInitService {
	initialize(): IFuture<void>;
}

interface IInfoService {
	printComponentsInfo(): IFuture<void>;
}

/**
 * Describes standard username/password type credentials.
 */
interface ICredentials {
	username: string;
	password: string;
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
	 * @return {IFuture<void>}
	 */
	upload(data: IITMSData): IFuture<void>;
	/**
	 * Queries Apple's content delivery API to get the user's registered iOS applications.
	 * @param  {ICredentials}                               credentials Credentials for authentication with iTunes Connect.
	 * @return {IFuture<IItunesConnectApplication[]>}          The user's iOS applications.
	 */
	getiOSApplications(credentials: ICredentials): IFuture<IiTunesConnectApplication[]>;
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
	getToolsInfo(): IFuture<IAndroidToolsInfoData>;

	/**
	 * Validates the information about required Android tools and SDK versions.
	 * @param {any} options Defines if the warning messages should treated as error and if the targetSdk value should be validated as well.
	 * @return {boolean} True if there are detected issues, false otherwise.
	 */
	validateInfo(options?: { showWarningsAsErrors: boolean, validateTargetSdk: boolean }): IFuture<boolean>;

	/**
	 * Validates the information about required JAVA version.
	 * @param {string} installedJavaVersion The JAVA version that will be checked.
	 * @param {any} options Defines if the warning messages should treated as error.
	 * @return {boolean} True if there are detected issues, false otherwise.
	 */
	validateJavacVersion(installedJavaVersion: string, options?: { showWarningsAsErrors: boolean }): IFuture<boolean>;

	/**
	 * Returns the path to `android` executable. It should be `$ANDROID_HOME/tools/android`.
	 * In case ANDROID_HOME is not defined, check if `android` is part of $PATH.
	 * @param {any} options Defines if the warning messages should treated as error.
	 * @return {string} Path to the `android` executable.
	 */
	getPathToAndroidExecutable(options?: { showWarningsAsErrors: boolean }): IFuture<string>;

	/**
	 * Gets the path to `adb` executable from ANDROID_HOME. It should be `$ANDROID_HOME/platform-tools/adb` in case it exists.
	 * @return {string} Path to the `adb` executable. In case it does not exists, null is returned.
	 */
	getPathToAdbFromAndroidHome(): IFuture<string>;
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
}

interface ISocketProxyFactory {
	createSocketProxy(factory: () => any): IFuture<any>;
}

interface IiOSNotification {
	waitForDebug: string;
	attachRequest: string;
	appLaunching: string;
	readyForAttach: string;
	attachAvailabilityQuery: string;
	alreadyConnected: string;
	attachAvailable: string;
}

interface IiOSNotificationService {
	awaitNotification(npc: Mobile.INotificationProxyClient, notification: string, timeout: number): IFuture<string>;
}

interface IiOSSocketRequestExecutor {
	executeLaunchRequest(device: Mobile.IiOSDevice, timeout: number, readyForAttachTimeout: number): IFuture<void>;
	executeAttachRequest(device: Mobile.IiOSDevice, timeout: number): IFuture<void>;
}

/**
 * Describes validation methods for XMLs.
 */
interface IXmlValidator {
	/**
	 * Checks the passed xml files for errors and if such exists, print them on the stdout.
	 * @param {string[]} sourceFiles Files to be checked. Only the ones that ends with .xml are filtered.
	 * @return {IFuture<boolean>} true in case there are no errors in specified files and false in case there's at least one error.
	 */
	validateXmlFiles(sourceFiles: string[]): IFuture<boolean>;

	/**
	 * Checks the passed xml file for errors and returns them as a result.
	 * @param {string} sourceFile File to be checked.
	 * @return {IFuture<string>} The errors detected (as a single string) or null in case there are no errors.
	 */
	getXmlFileErrors(sourceFile: string): IFuture<string>;
}

/**
 * Describes methods for working with versions.
 */
interface IVersionsService {
	/**
	 * Gets version information about nativescript-cli.
	 * @return {IFuture<IVersionInformation>} The version information.
	 */
	getNativescriptCliVersion(): IFuture<IVersionInformation>;

	/**
	 * Gets version information about tns-core-modules.
	 * @return {IFuture<IVersionInformation>} The version information.
	 */
	getTnsCoreModulesVersion(): IFuture<IVersionInformation>;

	/**
	 * Gets versions information about nativescript runtimes.
	 * @return {IFuture<IVersionInformation[]>} The version information.
	 */
	getRuntimesVersions(): IFuture<IVersionInformation[]>;

	/**
	 * Gets versions information about the nativescript components with new.
	 * @return {IFuture<IVersionInformation[]>} The version information.
	 */
	getComponentsForUpdate(): IFuture<IVersionInformation[]>;

	/**
	 * Gets versions information about all nativescript components.
	 * @return {IFuture<IVersionInformation[]>} The version information.
	 */
	getAllComponentsVersions(): IFuture<IVersionInformation[]>;

	/**
	 * Creates table with versions information.
	 * @param {IVersionInformation[]} The versions information to push in the table.
	 * @return {any} The created table.
	 */
	createTableWithVersionsInformation(versionsInformation: IVersionInformation[]): any;
}

/**
 * Describes methods for project name.
 */
interface IProjectNameService {
	/**
	 * Ensures the passed project name is valid. If the project name is not valid prompts for actions.
	 * @param {string} project name to be checked.
	 * @param {IOptions} current command options.
	 * @return {IFuture<strng>} returns the selected name of the project.
	 */
	ensureValidName(projectName: string, validateOptions?: { force: boolean }): IFuture<string>;
}

/**
 * Designed for getting information about xcproj.
 */
interface IXcprojService {
	/**
	 * Checks whether the system needs xcproj to execute ios builds successfully.
	 * In case the system does need xcproj but does not have it, prints an error message.
	 * @param {boolean} whether to fail with error message or not
	 * @return {IFuture<boolean>} whether an error occurred or not.
	 */
	verifyXcproj(shouldFail: boolean): IFuture<boolean>;
	/**
	 * Collects information about xcproj.
	 * @return {IFuture<XcprojInfo>} collected info about xcproj.
	 */
	getXcprojInfo(): IFuture<IXcprojInfo>;
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

