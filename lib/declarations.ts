interface INodePackageManager {
	install(packageName: string, pathToSave: string, config?: any): Promise<any>;
	uninstall(packageName: string, config?: any, path?: string): Promise<any>;
	view(packageName: string, config: any): Promise<any>;
	search(filter: string[], config: any): Promise<any>;
}

interface INpmInstallationManager {
	install(packageName: string, packageDir: string, options?: INpmInstallOptions): Promise<any>;
	getLatestVersion(packageName: string): Promise<string>;
	getNextVersion(packageName: string): Promise<string>;
	getLatestCompatibleVersion(packageName: string): Promise<string>;
	getInspectorFromCache(inspectorNpmPackageName: string, projectDir: string): Promise<string>;
}

interface INpmInstallOptions {
	pathToSave?: string;
	version?: string;
	dependencyType?: string;
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
	debugLivesync: boolean;
}

interface IApplicationPackage {
	packageName: string;
	time: Date;
}

interface ILockFile {
	lock(): void;
	unlock(): void;
	check(): boolean;
}

interface IOpener {
	open(target: string, appname: string): void;
}

interface ILiveSyncService {
	liveSync(platform: string, projectData: IProjectData, applicationReloadAction?: (deviceAppData: Mobile.IDeviceAppData) => Promise<void>): Promise<void>;
}

interface INativeScriptDeviceLiveSyncService extends IDeviceLiveSyncServiceBase {
	/**
	 * Refreshes the application's content on a device
	 * @param  {Mobile.IDeviceAppData} deviceAppData Information about the application and the device.
	 * @param  {Mobile.ILocalToDevicePathData[]} localToDevicePaths Object containing a mapping of file paths from the system to the device.
	 * @param  {boolean} forceExecuteFullSync If this is passed a full LiveSync is performed instead of an incremental one.
	 * @param  {string} projectId Project identifier - for example org.nativescript.livesync.
	 * @return {Promise<void>}
	 */
	refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], forceExecuteFullSync: boolean, projectId: string): Promise<void>;
	/**
	 * Removes specified files from a connected device
	 * @param  {string} appIdentifier Application identifier.
	 * @param  {Mobile.ILocalToDevicePathData[]} localToDevicePaths Object containing a mapping of file paths from the system to the device.
	 * @param  {string} projectId Project identifier - for example org.nativescript.livesync.
	 * @return {Promise<void>}
	 */
	removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectId: string): Promise<void>;
	afterInstallApplicationAction?(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectId: string): Promise<boolean>;
}

interface IPlatformLiveSyncService {
	fullSync(projectData: IProjectData, postAction?: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>): Promise<void>;
	partialSync(event: string, filePath: string, dispatcher: IFutureDispatcher, afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>, projectData: IProjectData): Promise<void>;
	refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], isFullSync: boolean, projectId: string): Promise<void>;
}

interface IBundle {
	bundle: boolean;
}

interface IPlatformTemplate {
	platformTemplate: string;
}

interface IEmulator {
	emulator: boolean;
}

interface IClean {
	clean: boolean;
}

interface IProvision {
	provision: any;
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

interface IOptions extends ICommonOptions, IBundle, IPlatformTemplate, IEmulator, IClean, IProvision, ITeamIdentifier, IAndroidReleaseOptions {
	all: boolean;
	client: boolean;
	compileSdk: number;
	copyTo: string;
	debugTransport: boolean;
	forDevice: boolean;
	framework: string;
	frameworkName: string;
	frameworkPath: string;
	frameworkVersion: string;
	ignoreScripts: boolean; //npm flag
	disableNpmInstall: boolean;
	ipa: string;
	tsc: boolean;
	ng: boolean;
	androidTypings: boolean;
	port: Number;
	production: boolean; //npm flag
	sdk: string;
	syncAllFiles: boolean;
	liveEdit: boolean;
	chrome: boolean;
}

interface IAndroidBuildOptionsSettings extends IAndroidReleaseOptions, IRelease { }

interface IAppFilesUpdaterOptions extends IBundle, IRelease { }

interface IPlatformBuildData extends IAppFilesUpdaterOptions, IBuildConfig { }

interface IDeviceEmulator extends IEmulator, IDeviceIdentifier { }

interface IRunPlatformOptions extends IJustLaunch, IDeviceEmulator { }

interface IDeployPlatformOptions extends IPlatformTemplate, IRelease, IClean, IDeviceEmulator, IProvision, ITeamIdentifier {
	projectDir: string;
	forceInstall?: boolean;
}

interface IEmulatePlatformOptions extends IJustLaunch, IDeployPlatformOptions, IAvailableDevices, IAvd {
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
	getToolsInfo(): Promise<IAndroidToolsInfoData>;

	/**
	 * Validates the information about required Android tools and SDK versions.
	 * @param {any} options Defines if the warning messages should treated as error and if the targetSdk value should be validated as well.
	 * @return {boolean} True if there are detected issues, false otherwise.
	 */
	validateInfo(options?: { showWarningsAsErrors: boolean, validateTargetSdk: boolean }): Promise<boolean>;

	/**
	 * Validates the information about required JAVA version.
	 * @param {string} installedJavaVersion The JAVA version that will be checked.
	 * @param {any} options Defines if the warning messages should treated as error.
	 * @return {boolean} True if there are detected issues, false otherwise.
	 */
	validateJavacVersion(installedJavaVersion: string, options?: { showWarningsAsErrors: boolean }): Promise<boolean>;

	/**
	 * Returns the path to `android` executable. It should be `$ANDROID_HOME/tools/android`.
	 * In case ANDROID_HOME is not defined, check if `android` is part of $PATH.
	 * @param {any} options Defines if the warning messages should treated as error.
	 * @return {string} Path to the `android` executable.
	 */
	getPathToAndroidExecutable(options?: { showWarningsAsErrors: boolean }): Promise<string>;

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

interface ISocketProxyFactory {
	createTCPSocketProxy(factory: () => any): any;
	createWebSocketProxy(factory: () => any): any;
}

interface IiOSNotification {
	getWaitForDebug(projectId: string): string;
	getAttachRequest(projectId: string): string;
	getAppLaunching(projectId: string): string;
	getReadyForAttach(projectId: string): string;
	getAttachAvailabilityQuery(projectId: string): string;
	getAlreadyConnected(projectId: string): string;
	getAttachAvailable(projectId: string): string;
}

interface IiOSNotificationService {
	awaitNotification(deviceIdentifier: string, socket: number, timeout: number): Promise<string>;
	postNotification(deviceIdentifier: string, notification: string, commandType?: string): Promise<string>;
	subscribeForNotification(deviceIdentifier: string, notification: string, timeout: number): Promise<Promise<string>>;
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
	 * Gets versions information about the nativescript components with new.
	 * @return {Promise<IVersionInformation[]>} The version information.
	 */
	getComponentsForUpdate(): Promise<IVersionInformation[]>;

	/**
	 * Gets versions information about all nativescript components.
	 * @return {Promise<IVersionInformation[]>} The version information.
	 */
	getAllComponentsVersions(): Promise<IVersionInformation[]>;

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
