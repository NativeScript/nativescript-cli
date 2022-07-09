import { IOptions } from "../declarations";
import { IJsonFileSettingsService } from "./definitions/json-file-settings-service";
import {
	IEventActionData,
	IGoogleAnalyticsData,
} from "./definitions/google-analytics";
import * as child_process from "child_process";

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
declare const enum GoogleAnalyticsDataType {
	Page = "pageview",
	Event = "event",
}

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

	interface IHttpClient {
		httpRequest(url: string): Promise<IResponse>;
		httpRequest(
			options: any,
			proxySettings?: IProxySettings
		): Promise<IResponse>;
	}

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
declare const enum TrackingTypes {
	/**
	 * Defines that the data contains information for initialization of a new Analytics monitor.
	 */
	Initialization = "initialization",

	/**
	 * Defines that the data contains exception that should be tracked.
	 */
	Exception = "exception",

	/**
	 * Defines that the data contains the answer of the question if user allows to be tracked.
	 */
	AcceptTrackFeatureUsage = "acceptTrackFeatureUsage",

	/**
	 * Defines data that will be tracked to Google Analytics.
	 */
	GoogleAnalyticsData = "googleAnalyticsData",

	/**
	 * Defines that the broker process should get and track the data from preview app to Google Analytics
	 */
	PreviewAppData = "PreviewAppData",

	/**
	 * Defines that the broker process should send all the pending information to Analytics.
	 * After that the process should send information it has finished tracking and die gracefully.
	 */
	FinishTracking = "FinishTracking",
}

/**
 * Describes the status of the current Analytics status, i.e. has the user allowed to be tracked.
 */
declare const enum AnalyticsStatus {
	/**
	 * User has allowed to be tracked.
	 */
	enabled = "enabled",

	/**
	 * User has declined to be tracked.
	 */
	disabled = "disabled",

	/**
	 * User has not been asked to allow feature and error tracking.
	 */
	notConfirmed = "not confirmed",
}

/**
 * Describes types of options that manage -- flags.
 */
declare const enum OptionType {
	/**
	 * String option
	 */
	String = "string",
	/**
	 * Boolean option
	 */
	Boolean = "boolean",
	/**
	 * Number option
	 */
	Number = "number",
	/**
	 * Array option
	 */
	Array = "array",
	/**
	 * Object option
	 */
	Object = "object",
}

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

interface IFileSystem {
	zipFiles(
		zipFile: string,
		files: string[],
		zipPathCallback: (path: string) => string
	): Promise<void>;
	unzip(
		zipFile: string,
		destinationDir: string,
		options?: { overwriteExisitingFiles?: boolean; caseSensitive?: boolean },
		fileFilters?: string[]
	): Promise<void>;

	/**
	 * Test whether or not the given path exists by checking with the file system.
	 * @param {string} path Path to be checked.
	 * @returns {boolean} True if path exists, false otherwise.
	 */
	exists(path: string): boolean;

	/**
	 * Deletes a file.
	 * @param {string} path Path to be deleted.
	 * @returns {void} undefined
	 */
	deleteFile(path: string): void;

	/**
	 * Deletes whole directory.
	 * @param {string} directory Path to directory that has to be deleted.
	 * @returns {void}
	 */
	deleteDirectory(directory: string): void;

	/**
	 * Deletes whole directory without throwing exceptions.
	 * @param {string} directory Path to directory that has to be deleted.
	 * @returns {void}
	 */
	deleteDirectorySafe(directory: string): void;

	/**
	 * Returns the size of specified file.
	 * @param {string} path Path to file.
	 * @returns {number} File size in bytes.
	 */
	getFileSize(path: string): number;

	/**
	 * Change file timestamps of the file referenced by the supplied path.
	 * @param {string} path  File path
	 * @param {Date}   atime Access time
	 * @param {Date}   mtime Modified time
	 * @returns {void}
	 */
	utimes(path: string, atime: Date, mtime: Date): void;

	futureFromEvent(
		eventEmitter: NodeJS.EventEmitter,
		event: string
	): Promise<any>;

	/**
	 * Create a new directory and any necessary subdirectories at specified location.
	 * @param {string} path Directory to be created.
	 * @returns {void}
	 */
	createDirectory(path: string): void;

	/**
	 * Reads contents of directory and returns an array of filenames excluding '.' and '..'.
	 * @param {string} path Path to directory to be checked.
	 * @retruns {string[]} Array of filenames excluding '.' and '..'
	 */
	readDirectory(path: string): string[];

	/**
	 * Reads the entire contents of a file.
	 * @param {string} filename Path to the file that has to be read.
	 * @param {string} options Options used for reading the file - encoding and flags.
	 * @returns {string|Buffer} Content of the file as buffer. In case encoding is specified, the content is returned as string.
	 */
	readFile(filename: string, options?: IReadFileOptions): string | Buffer;

	/**
	 * Reads the entire contents of a file and returns the result as string.
	 * @param {string} filename Path to the file that has to be read.
	 * @param {IReadFileOptions | string} encoding Options used for reading the file - encoding and flags. If options are not passed, utf8 is used.
	 * @returns {string} Content of the file as string.
	 */
	readText(filename: string, encoding?: IReadFileOptions | string): string;

	/**
	 * Reads the entire content of a file and parses it to JSON object.
	 * @param {string} filename Path to the file that has to be read.
	 * @param {string} encoding File encoding, defaults to utf8.
	 * @returns {string} Content of the file as JSON object.
	 */
	readJson(filename: string, encoding?: string): any;

	readStdin(): Promise<string>;

	/**
	 * Writes data to a file, replacing the file if it already exists. data can be a string or a buffer.
	 * @param {string} filename Path to file to be created.
	 * @param {string | Buffer} data Data to be written to file.
	 * @param {string} encoding @optional File encoding, defaults to utf8.
	 * @returns {void}
	 */
	writeFile(filename: string, data: string | Buffer, encoding?: string): void;

	/**
	 * Appends data to a file, creating the file if it does not yet exist. Data can be a string or a buffer.
	 * @param {string} filename Path to file to be created.
	 * @param {string | Buffer} data Data to be appended to file.
	 * @param {string} encoding @optional File encoding, defaults to utf8.
	 * @returns {void}
	 */
	appendFile(filename: string, data: string | Buffer, encoding?: string): void;

	/**
	 * Writes JSON data to file.
	 * @param {string} filename Path to file to be created.
	 * @param {any} data JSON data to be written to file.
	 * @param {string} space Identation that will be used for the file.
	 * @param {string} encoding @optional File encoding, defaults to utf8.
	 * @returns {void}
	 */
	writeJson(
		filename: string,
		data: any,
		space?: string,
		encoding?: string
	): void;

	/**
	 * Copies a file.
	 * @param {string} sourceFileName The original file that has to be copied.
	 * @param {string} destinationFileName The filepath where the file should be copied.
	 * @returns {void}
	 */
	copyFile(sourceFileName: string, destinationFileName: string): void;

	/**
	 * Returns unique file name based on the passed name by checkin if it exists and adding numbers to the passed name until a non-existent file is found.
	 * @param {string} baseName The name based on which the unique name will be generated.
	 * @returns {string} Unique filename. In case baseName does not exist, it will be returned.
	 */
	getUniqueFileName(baseName: string): string;

	/**
	 * Checks if specified directory is empty.
	 * @param {string} directoryPath The directory that will be checked.
	 * @returns {boolean} True in case the directory is empty. False otherwise.
	 */
	isEmptyDir(directoryPath: string): boolean;

	isRelativePath(
		path: string
	): boolean /* feels so lonely here, I don't have a Future */;

	/**
	 * Checks if directory exists and if not - creates it.
	 * @param {string} directoryPath Directory path.
	 * @returns {void}
	 */
	ensureDirectoryExists(directoryPath: string): void;

	/**
	 * Renames file/directory. This method throws error in case the original file name does not exist.
	 * @param {string} oldPath The original filename.
	 * @param {string} newPath New filename.
	 * @returns {string} void.
	 */
	rename(oldPath: string, newPath: string): void;

	/**
	 * Renames specified file to the specified name only in case it exists.
	 * Used to skip ENOENT errors when rename is called directly.
	 * @param {string} oldPath Path to original file that has to be renamed. If this file does not exists, no operation is executed.
	 * @param {string} newPath The path where the file will be moved.
	 * @return {boolean} True in case of successful rename. False in case the file does not exist.
	 */
	renameIfExists(oldPath: string, newPath: string): boolean;

	/**
	 * Returns information about the specified file.
	 * In case the passed path is symlink, the returned information is about the original file.
	 * @param {string} path Path to file for which the information will be taken.
	 * @returns {IFsStats} Inforamation about the specified file.
	 */
	getFsStats(path: string): IFsStats;

	/**
	 * Returns information about the specified file.
	 * In case the passed path is symlink, the returned information is about the symlink itself.
	 * @param {string} path Path to file for which the information will be taken.
	 * @returns {IFsStats} Inforamation about the specified file.
	 */
	getLsStats(path: string): IFsStats;

	symlink(sourcePath: string, destinationPath: string, type: "file"): void;
	symlink(sourcePath: string, destinationPath: string, type: "dir"): void;
	symlink(sourcePath: string, destinationPath: string, type: "junction"): void;

	/**
	 * Creates a symbolic link.
	 * Symbolic links are interpreted at run time as if the contents of the
	 * link had been substituted into the path being followed to find a file
	 * or directory.
	 * @param {string} sourcePath The original path of the file/dir.
	 * @param {string} destinationPath The destination where symlink will be created.
	 * @param {string} type "file", "dir" or "junction". Default is 'file'.
	 * Type option is only available on Windows (ignored on other platforms).
	 * Note that Windows junction points require the destination path to be absolute.
	 * When using 'junction', the target argument will automatically be normalized to absolute path.
	 * @returns {void}
	 */
	symlink(sourcePath: string, destinationPath: string, type?: string): void;

	createReadStream(
		path: string,
		options?: {
			flags?: string;
			encoding?: string;
			fd?: number;
			mode?: number;
			bufferSize?: number;
			start?: number;
			end?: number;
			highWaterMark?: number;
		}
	): NodeJS.ReadableStream;
	createWriteStream(
		path: string,
		options?: {
			flags?: string;
			encoding?: string;
			string?: string;
		}
	): any;

	/**
	 * Changes file mode of the specified file. In case it is a symlink, the original file's mode is modified.
	 * @param {string} path Filepath to be modified.
	 * @param {number | string} mode File mode.
	 * @returns {void}
	 */
	chmod(path: string, mode: number | string): void;

	setCurrentUserAsOwner(path: string, owner: string): Promise<void>;
	enumerateFilesInDirectorySync(
		directoryPath: string,
		filterCallback?: (file: string, stat: IFsStats) => boolean,
		opts?: { enumerateDirectories?: boolean; includeEmptyDirectories?: boolean }
	): string[];

	/**
	 * Hashes a file's contents.
	 * @param {string} fileName Path to file
	 * @param {Object} options algorithm and digest encoding. Default values are sha1 for algorithm and hex for encoding
	 * @return {Promise<string>} The computed shasum
	 */
	getFileShasum(
		fileName: string,
		options?: { algorithm?: string; encoding?: "latin1" | "hex" | "base64" }
	): Promise<string>;

	// shell.js wrappers
	/**
	 * @param {string} options Options, can be undefined or a combination of "-r" (recursive) and "-f" (force)
	 * @param {string[]} files files and direcories to delete
	 */
	rm(options: string, ...files: string[]): void;

	/**
	 * Deletes all empty parent directories.
	 * @param {string} directory The directory from which this method will start looking for empty parents.
	 * @returns {void}
	 */
	deleteEmptyParents(directory: string): void;

	/**
	 * Return the canonicalized absolute pathname.
	 * NOTE: The method accepts second argument, but it's type and usage is different in Node 4 and Node 6. Once we drop support for Node 4, we can use the second argument as well.
	 * @param {string} filePath Path to file which should be resolved.
	 * @returns {string} The canonicalized absolute path to file.
	 */
	realpath(filePath: string): string;
}

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

interface IErrors {
	fail(formatStr: string, ...args: any[]): never;
	fail(opts: IFailOptions, ...args: any[]): never;
	/**
	 * @deprecated: use `fail` instead
	 */
	failWithoutHelp(message: string, ...args: any[]): never;
	/**
	 * @deprecated: use `fail` instead
	 */
	failWithoutHelp(opts: IFailOptions, ...args: any[]): never;
	failWithHelp(formatStr: string, ...args: any[]): never;
	failWithHelp(opts: IFailOptions, ...args: any[]): never;
	beginCommand(
		action: () => Promise<boolean>,
		printCommandHelp: () => Promise<void>
	): Promise<boolean>;
	verifyHeap(message: string): void;
	printCallStack: boolean;
}

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

declare const enum ErrorCodes {
	UNCAUGHT = 120,
	UNKNOWN = 127,
	INVALID_ARGUMENT = 128,
	RESOURCE_PROBLEM = 129,
	KARMA_FAIL = 130,
	UNHANDLED_REJECTION_FAILURE = 131,
	DELETED_KILL_FILE = 132,
	TESTS_INIT_REQUIRED = 133,
	ALL_DEVICES_DISCONNECTED = 134,
}

interface IFutureDispatcher {
	run(): void;
	dispatch(action: () => Promise<void>): void;
}

interface ICommandDispatcher {
	dispatchCommand(): Promise<void>;
	completeCommand(): Promise<boolean>;
}

interface ICancellationService extends IDisposable {
	begin(name: string): Promise<void>;
	end(name: string): void;
}

interface IQueue<T> {
	enqueue(item: T): void;
	dequeue(): Promise<T>;
}

interface IChildProcess extends NodeJS.EventEmitter {
	exec(
		command: string,
		options?: any,
		execOptions?: IExecOptions
	): Promise<any>;
	execFile<T>(command: string, args: string[]): Promise<T>;
	spawn(
		command: string,
		args?: string[],
		options?: any
	): child_process.ChildProcess; // it returns child_process.ChildProcess you can safely cast to it
	spawnFromEvent(
		command: string,
		args: string[],
		event: string,
		options?: any,
		spawnFromEventOptions?: ISpawnFromEventOptions
	): Promise<ISpawnResult>;
	trySpawnFromCloseEvent(
		command: string,
		args: string[],
		options?: any,
		spawnFromEventOptions?: ISpawnFromEventOptions
	): Promise<ISpawnResult>;
	tryExecuteApplication(
		command: string,
		args: string[],
		event: string,
		errorMessage: string,
		condition?: (childProcess: any) => boolean
	): Promise<any>;
	/**
	 * This is a special case of the child_process.spawn() functionality for spawning Node.js processes.
	 * In addition to having all the methods in a normal ChildProcess instance, the returned object has a communication channel built-in.
	 * Note: Unlike the fork() POSIX system call, child_process.fork() does not clone the current process.
	 * @param {string} modulePath String The module to run in the child
	 * @param {string[]} args Array List of string arguments You can access them in the child with 'process.argv'.
	 * @param {string} options Object
	 * @return {child_process} ChildProcess object.
	 */
	fork(
		modulePath: string,
		args?: string[],
		options?: {
			cwd?: string;
			env?: any;
			execPath?: string;
			execArgv?: string[];
			silent?: boolean;
			uid?: number;
			gid?: number;
		}
	): any;
}

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
		readableSettingName: string
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
	 * Tracks preview's app data to Google Analytics project.
	 */
	trackPreviewAppData(platform: string, projectDir: string): Promise<void>;

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
	T extends IPrompterAnswers<any> = IPrompterAnswers<any>
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
		answers?: T
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

	/**
	 * Gets information for projects that are exported from playground
	 * @param projectDir Project directory path
	 */
	getPlaygroundInfo(projectDir?: string): Promise<IPlaygroundInfo>;
}

/**
 * Designed for getting information for projects that are exported from playground.
 */
interface IPlaygroundService {
	/**
	 * Gets information for projects that are exported from playground
	 * @return {Promise<IPlaygroundInfo>} collected info
	 * @param projectDir Project directory path
	 */
	getPlaygroundInfo(projectDir?: string): Promise<IPlaygroundInfo>;
}
/**
 * Describes information about project that is exported from playground.
 */
interface IPlaygroundInfo {
	/**
	 * The unique client identifier
	 */
	id: string;
	/**
	 * Whether the user comes from tutorial page. Can be true or false
	 */
	usedTutorial: boolean;
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

interface IHooksService {
	hookArgsName: string;
	executeBeforeHooks(
		commandName: string,
		hookArguments?: IDictionary<any>
	): Promise<void>;
	executeAfterHooks(
		commandName: string,
		hookArguments?: IDictionary<any>
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
	extends IRejectUnauthorized,
		ICredentials,
		IProxySettingsBase {
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
		config?: NativeScriptDoctor.ISysInfoConfig
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

interface IHostInfo {
	isWindows: boolean;
	isWindows64: boolean;
	isWindows32: boolean;
	isDarwin: boolean;
	isLinux: boolean;
	isLinux64: boolean;
	dotNetVersion(): Promise<string>;
	isDotNet40Installed(message: string): Promise<boolean>;
	getMacOSVersion(): Promise<string>;
}

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
		opts?: any
	): string[];
	/**
	 * Checks if the file is excluded
	 */
	isFileExcluded(
		filePath: string,
		excludedProjectDirsAndFiles?: string[]
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
		projectFilesConfig?: IProjectFilesConfig
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
		excludedDirs?: string[]
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
		projectFilesConfig?: IProjectFilesConfig
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
		projectFilesConfig: IProjectFilesConfig
	): IProjectFileInfo;
	/**
	 * Parses file by removing platform or configuration from its name.
	 * @param {string} filePath Path to the project file.
	 * @param {IProjectFilesConfig} projectFilesConfig
	 * @return {string} Parsed file name or original file name in case it does not have platform/configuration in the filename.
	 */
	getPreparedFilePath(
		filePath: string,
		projectFilesConfig: IProjectFilesConfig
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
		waitForPortListenData: IWaitForPortListenData
	): Promise<boolean>;
}

interface IDependencyInformation {
	name: string;
	version?: string;
	projectType?: string;
	excludedPeerDependencies?: string[];
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
		timeout: number
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
		commandType?: string
	): Promise<number>;
}

// declare module "stringify-package" {
// 	function stringifyPackage(data: any, indent: any, newline: string): string
// 	export = stringifyPackage
// }

// declare module "detect-newline" {
// 	function detectNewline(data: string): string | null;
// 	export = detectNewline
// }

/**
 * Describes information for application.
 */
interface IAppInstalledInfo extends Mobile.IDeviceApplicationInformationBase {
	/**
	 * Defines if application is installed on device.
	 */
	isInstalled: boolean;
}
