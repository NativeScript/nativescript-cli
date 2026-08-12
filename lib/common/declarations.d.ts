import { IOptions } from "../declarations";
import { IJsonFileSettingsService } from "./definitions/json-file-settings-service";
import {
	IEventActionData,
	IGoogleAnalyticsData,
} from "./definitions/google-analytics";
import type { ChildProcess } from "../contracts/child-process";
import type { Errors } from "../contracts/errors";
import type { FileSystem } from "../contracts/file-system";
import type { HostInfo } from "../contracts/host-info";
import type { HttpClient } from "../contracts/http-client";

// tslint:disable-next-line:interface-name
interface Object {
	[key: string]: any;
}

interface IStringDictionary extends IDictionary<string> {}

/**
 * Describes iTunes Connect application types
 */
// tslint:disable-next-line:interface-name
interface IiTunesConnectApplicationType {
	/**
	 * Applications developed for iOS
	 * @type {string}
	 */
	iOS: string;
	/**
	 * Applications developed for Mac OS
	 * @type {string}
	 */
	Mac: string;
}

/**
 * Describes the types of data that can be send to Google Analytics.
 * Their values are the names of the methods in universnal-analytics that have to be called to track this type of data.
 * Also known as Hit Type: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#t
 */

/**
 * Descibes iTunes Connect applications
 */
// tslint:disable-next-line:interface-name
interface IiTunesConnectApplication {
	/**
	 * Unique Apple ID for each application. Automatically generated and assigned by Apple.
	 * @type {string}
	 */
	adamId: string;
	/**
	 * No information available.
	 * @type {number}
	 */
	addOnCount: number;
	/**
	 * The application's bundle identifier.
	 * @type {string}
	 */
	bundleId: string;
	/**
	 * Application's name
	 * @type {string}
	 */
	name: string;
	/**
	 * Application's stock keeping unit. User-defined unique string to keep track of the applications
	 * @type {string}
	 */
	sku: string;
	/**
	 * Application's type
	 * @type {string}
	 */
	type: string;
	/**
	 * Application's current version
	 * @type {string}
	 */
	version: string;
}

/**
 * Describes configuration settings that modify the behavior of some methods.
 */
interface IConfigurationSettings {
	/**
	 * This string will be used when constructing the UserAgent http header.
	 * @type {string}
	 */
	userAgentName?: string;

	/**
	 * Describes the profile directory that will be used for various CLI settings, like user-settings.json file location, extensions, etc.
	 * @type {string}
	 */
	profileDir?: string;
}

/**
 * Describes service used to confugure various settings.
 */
interface ISettingsService {
	/**
	 * Used to set various settings in order to modify the behavior of some methods.
	 * @param {IConfigurationSettings} settings Settings which will modify the behaviour of some methods.
	 * @returns {void}
	 */
	setSettings(settings: IConfigurationSettings): void;

	/**
	 * Returns currently used profile directory.
	 * @returns {string}
	 */
	getProfileDir(): string;
}

/**
 * Describes data returned from querying itunes' Content Delivery api
 */
interface IContentDeliveryBody {
	/**
	 * Error object - likely present if result's Success is false.
	 */
	error?: Error;

	/**
	 * Query results.
	 */
	result: {
		/**
		 * A list of the user's applications.
		 * @type {IiTunesConnectApplication[]}
		 */
		Applications: IiTunesConnectApplication[];
		/**
		 * Error code - likely present if Success is false.
		 * @type {number}
		 */
		ErrorCode?: number;
		/**
		 * Error message - likely present if Success is false.
		 * @type {string}
		 */
		ErrorMessage?: string;
		/**
		 * Error message - likely present if Success is false.
		 * @type {string[]}
		 */
		Errors?: string[];
		/**
		 * Indication whether the query was a success or not.
		 * @type {boolean}
		 */
		Success: boolean;
	};
}

declare module Server {
	interface IResponse {
		response: any;
		body?: any;
		headers: any;
		error?: Error;
	}

	interface IHttpClient extends HttpClient {}

	interface IRequestResponseData {
		statusCode: number;
		headers: { [index: string]: any };
		complete: boolean;
		pipe(destination: any, options?: { end?: boolean }): IRequestResponseData;
		on(event: string, listener: Function): void;
		destroy(error?: Error): void;
	}
}

interface IDisposable {
	dispose(): void;
}

interface IShouldDispose {
	shouldDispose: boolean;
	setShouldDispose(shouldDispose: boolean): void;
}

/**
 * Describes the type of data sent to analytics service.
 */

/**
 * Describes the status of the current Analytics status, i.e. has the user allowed to be tracked.
 */

/**
 * Describes types of options that manage -- flags.
 */

/**
 * Describes options that can be passed to fs.readFile method.
 */
interface IReadFileOptions {
	/**
	 * Defines the encoding. Defaults to null.
	 */
	encoding?: BufferEncoding | null;

	/**
	 * Defines file flags. Defaults to "r".
	 */
	flag?: string;
}

interface IFileSystem extends FileSystem {}

// duplicated from fs.Stats, because I cannot import it here
interface IFsStats {
	isFile(): boolean;
	isDirectory(): boolean;
	isBlockDevice(): boolean;
	isCharacterDevice(): boolean;
	isSymbolicLink(): boolean;
	isFIFO(): boolean;
	isSocket(): boolean;
	dev: number;
	ino: number;
	mode: number;
	nlink: number;
	uid: number;
	gid: number;
	rdev: number;
	size: number;
	blksize: number;
	blocks: number;
	atime: Date;
	mtime: Date;
	ctime: Date;
}

interface IOpener {
	open(filename: string, appname?: string): void;
}

interface IErrors extends Errors {}

interface IFailOptions {
	name?: string;
	formatStr?: string;
	errorCode?: number;
	proxyAuthenticationRequired?: boolean;
	printOnStdout?: boolean;
}

/**
 * Describes error raised when making http requests.
 */
interface IHttpRequestError extends Error {
	/**
	 * Defines if the error is caused by the proxy requiring authentication.
	 */
	proxyAuthenticationRequired: boolean;
}

interface ICommandOptions {
	disableAnalytics?: boolean;
	enableHooks?: boolean;
	disableCommandHelpSuggestion?: boolean;
}

interface IFutureDispatcher {
	run(): void;
	dispatch(action: () => Promise<void>): void;
}

interface ICommandDispatcher {
	dispatchCommand(): Promise<void>;
}

interface ICancellationService extends IDisposable {
	begin(name: string): Promise<void>;
	end(name: string): void;
}

interface IQueue<T> {
	enqueue(item: T): void;
	dequeue(): Promise<T>;
}

interface IChildProcess extends ChildProcess {}

interface IExecOptions {
	showStderr: boolean;
}

interface ISpawnResult {
	stderr: string;
	stdout: string;
	exitCode: number;
}

interface ISpawnFromEventOptions {
	throwError: boolean;
	emitOptions?: {
		eventName: string;
	};
	timeout?: number;
}

interface IProjectDir {
	projectDir: string;
}

interface IProjectHelper extends IProjectDir {
	generateDefaultAppId(appName: string, baseAppId: string): string;
	sanitizeName(appName: string): string;
}

interface IDictionary<T> {
	[key: string]: T;
}

interface IAnalyticsService {
	checkConsent(): Promise<void>;
	trackException(exception: any, message: string): Promise<void>;
	setStatus(settingName: string, enabled: boolean): Promise<void>;
	getStatusMessage(
		settingName: string,
		jsonFormat: boolean,
		readableSettingName: string,
	): Promise<string>;
	isEnabled(settingName: string): Promise<boolean>;
	finishTracking(): Promise<void>;

	/**
	 * Tracks the answer of question if user allows to be tracked.
	 * @param {{ acceptTrackFeatureUsage: boolean }} settings Object containing information about user's answer.
	 * @return {Promise<void>}
	 */
	trackAcceptFeatureUsage(settings: {
		acceptTrackFeatureUsage: boolean;
	}): Promise<void>;

	/**
	 * Tracks data to Google Analytics project.
	 * @param {IGoogleAnalyticsData} data DTO describing the data that should be tracked.
	 * @return {Promise<void>}
	 */
	trackInGoogleAnalytics(data: IGoogleAnalyticsData): Promise<void>;

	/**
	 * Tracks event action in Google Analytics project.
	 * @param {IEventActionData} data DTO describing information for the event.
	 * @return {Promise<void>}
	 */
	trackEventActionInGoogleAnalytics(data: IEventActionData): Promise<void>;

	/**
	 * Defines if the instance should be disposed.
	 * @param {boolean} shouldDispose Defines if the instance should be disposed and the child processes should be disconnected.
	 * @returns {void}
	 */
	setShouldDispose(shouldDispose: boolean): void;
}

interface IAllowEmpty {
	allowEmpty?: boolean;
}

interface IPrompterOptions extends IAllowEmpty {
	defaultAction?: () => string;
}

type IPrompterAnswers<T extends string = string> = { [id in T]: any };

interface IPrompterQuestion<
	T extends IPrompterAnswers<any> = IPrompterAnswers<any>,
> {
	type?: string;
	name?: string;
	message?: string;
	default?: any;
	prefix?: string;
	suffix?: string;
	filter?(input: any, answers: T): any;
	validate?(
		input: any,
		answers?: T,
	): boolean | string | Promise<boolean | string>;
}

interface IAnalyticsSettingsService {
	canDoRequest(): Promise<boolean>;
	getUserId(): Promise<string>;
	getClientName(): string;
	/**
	 * Gets current user sessions count.
	 * @param {string} projectName The analytics project id for which the counter should be taken.
	 * @return {number} Number of user sessions.
	 */
	getUserSessionsCount(projectName: string): Promise<number>;

	/**
	 * Set the number of user sessions.
	 * @param {number} count The number that will be set for user sessions.
	 * @param {string} projectName The analytics project id for which the counter should be set.
	 * @return {Promise<void>}
	 */
	setUserSessionsCount(count: number, projectName: string): Promise<void>;

	/**
	 * Gets the unique client identifier (AnalyticsInstallationId). In case it does not exist - set it to new value and return it.
	 * @returns {Promise<string>}
	 */
	getClientId(): Promise<string>;

	/**
	 * Gets user agent string identifing the current system in the following format: `${identifier} (${systemInfo}) ${osArch}`
	 * @param {string} identifier The product identifier.
	 * @returns {string} The user agent string.
	 */
	getUserAgentString(identifier: string): string;
}

interface IAutoCompletionService {
	/**
	 * Enables command line autocompletion by creating a `.<cliname>rc` file and sourcing it in all profiles (.bash_profile, .bashrc, etc.).
	 * @returns {Promise<void>}
	 */
	enableAutoCompletion(): Promise<void>;

	/**
	 * Disables auto completion by removing the entries from all profiles.
	 * @returns {void}
	 */
	disableAutoCompletion(): void;

	/**
	 * Checks if autocompletion is enabled.
	 * @returns {boolean} true in case autocompletion is enabled in any file. false otherwise.
	 */
	isAutoCompletionEnabled(): boolean;

	/**
	 * Checks if obsolete autocompletion code exists in any profile file.
	 * @returns {boolean} true in case there's some old code in any profile file. false otherwise.
	 */
	isObsoleteAutoCompletionEnabled(): boolean;
}

interface IHookExecutionOptions {
	/**
	 * Set by call sites that fold the returned middlewares around a method (the
	 * `@hook` decorator). Where nothing consumes them, `ctx.wrap()` rejects
	 * instead of registering a middleware that would never run.
	 */
	consumesMiddlewares?: boolean;
}

interface IHooksService {
	hookArgsName: string;
	/** Resolves with the middlewares hooks registered through `ctx.wrap()`. */
	executeBeforeHooks(
		commandName: string,
		hookArguments?: IDictionary<any>,
		options?: IHookExecutionOptions,
	): Promise<import("./define-hook").HookMiddleware[]>;
	executeAfterHooks(
		commandName: string,
		hookArguments?: IDictionary<any>,
	): Promise<void>;
}

interface IHook {
	name: string;
	fullPath: string;
}

/**
 * Describes standard username/password type credentials.
 */
interface ICredentials {
	username: string;
	password: string;
}

interface IRejectUnauthorized {
	/**
	 * Defines if NODE_TLS_REJECT_UNAUTHORIZED should be set to true or false. Default value is true.
	 */
	rejectUnauthorized: boolean;
}

/**
 * Proxy settings required for http request.
 */
interface IProxySettings
	extends IRejectUnauthorized, ICredentials, IProxySettingsBase {
	/**
	 * Hostname of the machine used for proxy.
	 */
	hostname: string;

	/**
	 * Port of the machine used for proxy that allows connections.
	 */
	port: string;

	/**
	 * Protocol of the proxy - http or https
	 */
	protocol?: string;
}

interface IProxySettingsBase {
	/**
	 * The url that should be passed to the request module in order to use the proxy.
	 * As request expects the property to be called `proxy` reuse the same name, so the IProxySettings object can be passed directly to request.
	 */
	proxy?: string;
}

interface IProxyLibSettings extends IRejectUnauthorized, ICredentials {
	proxyUrl: string;
	credentialsKey?: string;
	userSpecifiedSettingsFilePath?: string;
}

/**
 * Describes Service used for interaction with the proxy cache.
 */
interface IProxyService {
	/**
	 * Caches proxy data.
	 * @param {IProxyLibSettings} settings Data to be cached.
	 * @returns {Promise<void>} The cache.
	 */
	setCache(settings: IProxyLibSettings): Promise<void>;

	/**
	 * Retrieves proxy cache data.
	 * @returns {Promise<IProxySettings>} Proxy data.
	 */
	getCache(): Promise<IProxySettings>;

	/**
	 * Clears proxy cache data.
	 * @returns {Promise<void>}
	 */
	clearCache(): Promise<void>;

	/**
	 * Gets info about the proxy that can be printed and shown to the user.
	 * @returns {Promise<string>} Info about the proxy.
	 */
	getInfo(): Promise<string>;
}

interface IQrCodeGenerator {
	generateDataUri(data: string): Promise<string>;
}

interface IQrCodeImageData {
	/**
	 * The original URL used for generating QR code image.
	 */
	originalUrl: string;
	/**
	 * The shorten URL used for generating QR code image.
	 */
	shortenUrl: string;
	/**
	 * Base64 encoded data used for generating QR code image.
	 */
	imageData: string;
}

interface IMicroTemplateService {
	parseContent(data: string, options: { isHtml: boolean }): Promise<string>;
}

interface IHelpService {
	generateHtmlPages(): Promise<void>;

	/**
	 * Finds the html help for specified command and opens it in the browser.
	 * @param {ICommandData} commandData Data describing searched command - name and arguments.
	 * @returns {Promise<void>}
	 */
	openHelpForCommandInBrowser(commandData: ICommandData): Promise<void>;

	/**
	 * Shows command line help for specified command.
	 * @param {string} commandData The name of the command for which to show the help.
	 * @returns {Promise<void>}
	 */
	showCommandLineHelp(commandData: ICommandData): Promise<void>;
}

/**
 * Used to talk to xcode-select command-line tool.
 */
interface IXcodeSelectService {
	/**
	 * Get the path to Contents directory inside Xcode.app.
	 * With a default installation this path is /Applications/Xcode.app/Contents
	 * @return {Promise<string>}
	 */
	getContentsDirectoryPath(): Promise<string>;
	/**
	 * Get the path to Developer directory inside Xcode.app.
	 * With a default installation this path is /Applications/Xcode.app/Contents/Developer/
	 * @return {Promise<string>}
	 */
	getDeveloperDirectoryPath(): Promise<string>;
	/**
	 * Get version of the currently used Xcode.
	 * @return {Promise<IVersionData>}
	 */
	getXcodeVersion(): Promise<IVersionData>;
}

interface IPlatform {
	platform: string;
}

interface ISystemWarning {
	message: string;
	severity: SystemWarningsSeverity;
	toString?: () => string;
}

interface ISysInfo {
	getSysInfo(
		config?: NativeScriptDoctor.ISysInfoConfig,
	): Promise<NativeScriptDoctor.ISysInfoData>;
	/**
	 * Returns the currently installed version of Xcode.
	 * @return {Promise<string>} Returns the currently installed version of Xcode or null if Xcode is not installed or executed on Linux or Windows.
	 */
	getXcodeVersion(): Promise<string>;
	/**
	 * Returns the currently installed Java path based on JAVA_HOME and PATH..
	 * @return {Promise<string>} The currently installed Java path.
	 */
	getJavaPath(): Promise<string>;
	/**
	 * Returns the currently installed Cocoapods version.
	 * @return {Promise<string>} Returns the currently installed Cocoapods version. It will return null if Cocoapods is not installed.
	 */
	getCocoaPodsVersion(): Promise<string>;
	/**
	 * Returns the currently installed Java compiler version.
	 * @return {Promise<string>} The currently installed Java compiler version.
	 */
	getJavaCompilerVersion(): Promise<string>;

	/**
	 * Gets JAVA version based on the executable in PATH.
	 * @return {Promise<string>}
	 */
	getJavaVersionFromPath(): Promise<string>;

	/**
	 * Gets JAVA version based on the JAVA from JAVA_HOME.
	 * @return {Promise<string>}
	 */
	getJavaVersionFromJavaHome(): Promise<string>;

	/**
	 * Gets all global warnings for the current environment, for example Node.js version compatibility, OS compatibility, etc.
	 * @return {Promise<ISystemWarning[]>} All warnings. Empty array is returned in case the system is setup correctly.
	 */
	getSystemWarnings(): Promise<ISystemWarning[]>;

	/**
	 * Gets warning message for current macOS version.
	 * @return {Promise<string>} Message in case the current macOS version is deprecated, null otherwise.
	 */
	getMacOSWarningMessage(): Promise<ISystemWarning>;

	/**
	 * Returns the value of engines.node key from CLI's package.json file.
	 * @return {string} The range of supported Node.js versions.
	 */
	getSupportedNodeVersionRange(): string;

	/**
	 * Gets warning message in case the currently installed Xcode will not be supported in next versions
	 * @returns {string}
	 */
	getXcodeWarning(): Promise<string>;
}

interface IHostInfo extends HostInfo {}

// tslint:disable-next-line:interface-name
interface GenericFunction<T> extends Function {
	(...args: any[]): T;
}

declare global {
	// tslint:disable-next-line:interface-name
	interface Function {
		$inject: {
			args: string[];
			name: string;
		};
	}

	/**
	 * Extends Nodejs' Error interface.
	 * The native interface already has name and message properties
	 */
	// tslint:disable-next-line:interface-name
	interface Error {
		/**
		 * Error's stack trace
		 * @type {string}
		 */
		stack?: string;
		/**
		 * Error's code - could be a string ('ENOENT'), as well as a number (127)
		 * @type {string|number}
		 */
		code?: string | number;
	}
}

interface IRelease {
	release: boolean;
}

interface IDeviceIdentifier {
	device: string;
}

interface IJustLaunch {
	justlaunch: boolean;
}

interface IAvd {
	avd: string;
}

interface IAvailableDevices {
	availableDevices: boolean;
}

interface IProfileDir {
	profileDir: string;
}

interface IHasEmulatorOption {
	emulator: boolean;
}

interface IYargArgv extends IDictionary<any> {
	_: string[];
	$0: string;
}

/**
 * Describes dashed option (starting with --) passed on the command line.
 * @interface
 */
interface IDashedOption {
	/**
	 * Type of the option. It can be string, boolean, Array, etc.
	 */
	type: string;
	/**
	 * Option has sensitive value
	 */
	hasSensitiveValue: boolean;
	/**
	 * Shorthand option passed on the command line with `-` sign, for example `-v`
	 */
	alias?: any;
	/**
	 * Defines if the options is mandatory or the number of mandatory arguments.
	 */
	demand?: any;
	/**
	 * @see demand
	 */
	required?: any;
	/**
	 * @see demand
	 */
	require?: any;
	/**
	 * Sets default value of the -- option if it is NOT passed on the command line.
	 */
	default?: any;
	/**
	 * Interpret the value as boolean, even if value is passed for it.
	 */
	boolean?: any;
	/**
	 * Interpret the value as string, especially useful when you have to preserve numbers leading zeroes.
	 */
	string?: any;
	/**
	 * Returns the count of the dashed options passed on the command line.
	 */
	count?: any;
	/**
	 * Describes the usage of option.
	 */
	describe?: any;
	/**
	 * No information about this option. Keep it here for backwards compatibility, but use describe instead.
	 */
	description?: any;
	/**
	 * @see describe
	 */
	desc?: any;
	/**
	 * Specifies either a single option key (string), or an array of options that must be followed by option values.
	 */
	requiresArg?: any;
}

/**
 * Verifies the host OS configuration and prints warnings to the users
 * Code behind of the "doctor" command
 * @interface
 */
interface IDoctorService {
	/**
	 * Verifies the host OS configuration and prints warnings to the users
	 * @param configOptions: defines if the result should be tracked by Analytics
	 * @returns {Promise<void>}
	 */
	printWarnings(configOptions?: {
		trackResult?: boolean;
		projectDir?: string;
		runtimeVersion?: string;
		options?: IOptions;
		forceCheck?: boolean;
		platform?: string;
	}): Promise<void>;
	/**
	 * Runs the setup script on host machine
	 * @returns {Promise<ISpawnResult>}
	 */
	runSetupScript(): Promise<ISpawnResult>;
	/**
	 * Checks if the envrironment is properly configured and it is possible to execute local builds
	 * @returns {Promise<boolean>} true if the environment is properly configured for local builds
	 * @param {object} configuration
	 */
	canExecuteLocalBuild(configuration?: {
		platform?: string;
		projectDir?: string;
		runtimeVersion?: string;
		forceCheck?: boolean;
	}): Promise<boolean>;

	/**
	 * Checks and notifies users for deprecated short imports in their applications.
	 * @param {string} projectDir Path to the application.
	 * @returns {void}
	 */
	checkForDeprecatedShortImportsInAppDir(projectDir: string): void;
}

interface IUtils {
	getParsedTimeout(defaultTimeout: number): number;
	getMilliSecondsTimeout(defaultTimeout: number): number;
}

/**
 * Used for parsing of .plist files
 */
interface IPlistParser {
	/**
	 * Parses the .plist file and returns the result as object
	 * @param {string} plistFilePath Absolute path to .plist file
	 * @return {Promise<any>} The parsed object
	 */
	parseFile(plistFilePath: string): Promise<any>;
	parseFileSync(plistFilePath: string): any;
}

interface IUserSettingsService extends IJsonFileSettingsService {
	// keep for backwards compatibility
}

/**
 * Used for interaction with various resources located in a resources folder.
 * @interface
 */
interface IResourceLoader {
	/**
	 * Get an absolute path to a resource based on a relative one.
	 * @param  {string} path Relative path to resource
	 * @return {string}      Absolute path to resource
	 */
	resolvePath(path: string): string;
	/**
	 * Opens a resource file for reading.
	 * @param  {string} path Relative path to resource
	 * @return {NodeJS.ReadableStream} Read stream to the resource file
	 */
	openFile(path: string): NodeJS.ReadableStream;

	readText(path: string): string;

	/**
	 * Reads the contents of a resource file in JSON format.
	 * @param  {string}       path Relative path to resource
	 * @return {any}      Object based on the JSON contents of the resource file.
	 */
	readJson(path: string): any;
}

/**
 * Used for getting strings for informational/error messages.
 */
interface IMessagesService {
	/**
	 * Array of the paths to the .json files containing all the messages.
	 * @type {string[]}
	 */
	pathsToMessageJsonFiles: string[];

	/**
	 * @param  {string} 	id		Message's key in corresponding messages json file, could be complex (e.g. 'iOS.iTunes.ConnectError').
	 * @param  {string[]} 	args	Additional arguments used when the message's value is a string format.
	 * @return {string}				The value found under the given id. If no value is found returns the id itself.
	 */
	getMessage(id: string, ...args: string[]): string;
}

/**
 * Describes generated code parts.
 */
interface IServiceContractClientCode {
	interfaceFile: string;
	implementationFile: string;
}

/**
 * Used for code generation.
 */
interface IServiceContractGenerator {
	/**
	 * Generate code implementation along with interface
	 * @param  {string}                              definitionsPath The path to the desired parent .d.ts file
	 * @return {Promise<IServiceContractClientCode>}                 The generated code parts
	 */
	generate(definitionsPath?: string): Promise<IServiceContractClientCode>;
}

/**
 * Describes project file that should be livesynced
 */
interface IProjectFileInfo {
	/**
	 * Full path to the file that has to be livesynced.
	 */
	filePath: string;

	/**
	 * Filename that will be transefered on the device. This is the original filename with stripped platform and configuration names.
	 */
	onDeviceFileName: string;

	/**
	 * Defines if the file should be included in the transfer. For example when device is Android, files that contain iOS in the name should not be synced.
	 */
	shouldIncludeFile: boolean;
}

interface IProjectFilesManager {
	/**
	 * Enumerates all files and directories from the specified project files path.
	 */
	getProjectFiles(
		projectFilesPath: string,
		excludedProjectDirsAndFiles?: string[],
		filter?: (filePath: string, stat: IFsStats) => boolean,
		opts?: any,
	): string[];
	/**
	 * Checks if the file is excluded
	 */
	isFileExcluded(
		filePath: string,
		excludedProjectDirsAndFiles?: string[],
	): boolean;
	/**
	 * Returns an object that maps every local file path to device file path
	 * If projectFiles parameter is not specified enumerates the files from the specified projectFilesPath
	 */
	createLocalToDevicePaths(
		deviceAppData: Mobile.IDeviceAppData,
		projectFilesPath: string,
		files: string[],
		excludedProjectDirsAndFiles: string[],
		projectFilesConfig?: IProjectFilesConfig,
	): Promise<Mobile.ILocalToDevicePathData[]>;

	/**
	 * Handle platform specific files.
	 * @param {string} directoryPath Directory from which to start looking for platform specific files. All subdirectories will be included.
	 * @param {string} platform Mobile platform - only platform specific files for this platform will be included.
	 * @param {IProjectFilesConfig} projectFilesConfig
	 * @param {string[]} excludedDirs Directories which should be skipped.
	 * @returns {void}
	 */
	processPlatformSpecificFiles(
		directoryPath: string,
		platform: string,
		projectFilesConfig?: IProjectFilesConfig,
		excludedDirs?: string[],
	): void;
}

interface IProjectFilesProvider {
	/**
	 * Checks if the file is excluded
	 */
	isFileExcluded(filePath: string): boolean;
	/**
	 * Performs local file path mapping
	 */
	mapFilePath(
		filePath: string,
		platform: string,
		projectData: any,
		projectFilesConfig?: IProjectFilesConfig,
	): string;

	/**
	 * Returns information about file in the project, that includes file's name on device after removing platform or configuration from the name.
	 * @param {string} filePath Path to the project file.
	 * @param  {string} platform platform for which to get the information.
	 * @param  {IProjectFilesConfig} projectFilesConfig configuration for additional parsing
	 * @return {IProjectFileInfo}
	 */
	getProjectFileInfo(
		filePath: string,
		platform: string,
		projectFilesConfig: IProjectFilesConfig,
	): IProjectFileInfo;
	/**
	 * Parses file by removing platform or configuration from its name.
	 * @param {string} filePath Path to the project file.
	 * @param {IProjectFilesConfig} projectFilesConfig
	 * @return {string} Parsed file name or original file name in case it does not have platform/configuration in the filename.
	 */
	getPreparedFilePath(
		filePath: string,
		projectFilesConfig: IProjectFilesConfig,
	): string;
}

/**
 * Describes configuration for additional parsing.
 */
interface IProjectFilesConfig {
	/**
	 * additional configurations for which to get the information. The basic configurations are `debug` and `release`.
	 * @type {string[]}
	 */
	additionalConfigurations?: string[];
	/**
	 * configuration for which to get information.
	 * @type {string}
	 */
	configuration?: string;
}

/**
 * Describes imformation about the version of component
 */
interface IVersionInformation {
	/**
	 * Component name.
	 */
	componentName: string;
	/**
	 * The current version of the component if available.
	 */
	currentVersion?: string;
	/**
	 * The latest available version of the component.
	 */
	latestVersion: string;
	/**
	 * The message that will be displayed.
	 */
	message?: string;
	/**
	 * The type of the component. Can be UpToDate, UpdateAvailable, NotInstalled.
	 */
	type?: "UpToDate" | "UpdateAvailable" | "NotInstalled";
}

interface IVersionData {
	major: string;
	minor: string;
	patch: string;
}

interface IWaitForPortListenData {
	/**
	 * Port to be checked.
	 * @type {number}
	 */
	port: number;

	/**
	 * Max amount of time in milliseconds to wait.
	 * @type {number}
	 */
	timeout: number;
	/**
	 * @optional The amount of time between each check.
	 * @type {number}
	 */
	interval?: number;
}

/**
 * Wrapper for net module of Node.js.
 */
interface INet {
	/**
	 * Get free port on your local machine.
	 * @return {Promise<number>} The port.
	 */
	getFreePort(): Promise<number>;

	/**
	 * Returns the first available port in the provided range.
	 * @param {number} startPort the first port to check.
	 * @param {number} endPort the last port to check. The default value is 65534.
	 * @return {Promise<number>} returns the first available prot in the given range.
	 */
	getAvailablePortInRange(startPort: number, endPort?: number): Promise<number>;

	/**
	 * Checks if the candidate port is available.
	 * @param {number} port the candidate port.
	 * @return {Promise<boolean>} true if the port is available.
	 */
	isPortAvailable(port: number): Promise<boolean>;

	/**
	 * Waits for port to be in LISTEN state.
	 * @param {IWaitForPortListenData} waitForPortListenData Data describing port, timeout and interval.
	 * @returns {boolean} true in case port is in LISTEN state, false otherwise.
	 */
	waitForPortToListen(
		waitForPortListenData: IWaitForPortListenData,
	): Promise<boolean>;
}

interface IDependencyInformation {
	name: string;
	version?: string;
	projectType?: string;
	excludedPeerDependencies?: string[];
	/**
	 * Install into "dependencies" instead of "devDependencies". Required for
	 * packages with native code — the CLI integrates plugin platform files
	 * (pods, aars) only for regular dependencies.
	 */
	saveInDependencies?: boolean;
}

/**
 * Describes operating system-related utility methods
 */
interface IOsInfo {
	/**
	 * Returns a string identifying the operating system name.
	 * @return {string} A string identifying the operating system name.
	 */
	type(): string;

	/**
	 * Returns a string identifying the operating system release.
	 * @return {string} A string identifying the operating system release.
	 */
	release(): string;

	/**
	 * Returns a string identifying the operating system bitness.
	 * @return {string} A string identifying the operating system bitness.
	 */
	arch(): string;

	/**
	 * Returns a string identifying the operating system platform.
	 * @return {string} A string identifying the operating system platform.
	 */
	platform(): string;
}

interface IPromiseActions<T> {
	resolve(value?: T | PromiseLike<T>): void;
	reject(reason?: any): void;
	isResolved(): boolean;
}

interface IDeferPromise<T> extends IPromiseActions<T> {
	isRejected(): boolean;
	isPending(): boolean;
	getResult(): any;
	promise: Promise<T>;
}

/**
 * Describes service used for interaction with Notification Center
 */
// tslint:disable-next-line:interface-name
interface IiOSNotificationService {
	/**
	 * Posts a notification and waits for a response.
	 * @param {string} deviceIdentifier Device's identifier.
	 * @param {number} socket Socket where the notification will be post.
	 * @param {number} timeout Timeout in seconds.
	 * @return {Promise<string>} The response.
	 */
	awaitNotification(
		deviceIdentifier: string,
		socket: number,
		timeout: number,
	): Promise<string>;

	/**
	 * Posts a notification.
	 * @param {string} deviceIdentifier Device's identifier.
	 * @param {string} notification The xml value of the Name key of the notification to be post.
	 * @param {string} commandType The xml value of the Command key of the notification to be post.
	 * @return {Promise<number>} A socket which can be queried for a response.
	 */
	postNotification(
		deviceIdentifier: string,
		notification: string,
		commandType?: string,
	): Promise<number>;
}

/**
 * Describes information for application.
 */
interface IAppInstalledInfo extends Mobile.IDeviceApplicationInformationBase {
	/**
	 * Defines if application is installed on device.
	 */
	isInstalled: boolean;
}
