/* tslint:disable:no-empty */

import Future = require("fibers/future");
import * as util from "util";
import * as chai from "chai";

export class LoggerStub implements ILogger {
	setLevel(level: string): void { }
	getLevel(): string { return undefined; }
	fatal(...args: string[]): void { }
	error(...args: string[]): void { }
	warn(...args: string[]): void { }
	warnWithLabel(...args: string[]): void { }
	info(...args: string[]): void { }
	debug(...args: string[]): void { }
	trace(...args: string[]): void { }

	public output = "";

	out(...args: string[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args: string[]): void { }

	prepare(item: any): string {
		return "";
	}

	printInfoMessageOnSameLine(message: string): void { }
	printMsgWithTimeout(message: string, timeout: number): IFuture<void> {
		return null;
	}

	printMarkdown(message: string): void { }
}

export class FileSystemStub implements IFileSystem {
	zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): IFuture<void> {
		return undefined;
	}

	unzip(zipFile: string, destination: string): IFuture<void> {
		return undefined;
	}

	exists(path: string): boolean {
		return true;
	}

	deleteFile(path: string): void {
		return undefined;
	}

	deleteDirectory(directory: string): IFuture<void> {
		return Future.fromResult();
	}

	getFileSize(path: string): number {
		return undefined;
	}

	futureFromEvent(eventEmitter: any, event: string): IFuture<any> {
		return undefined;
	}

	createDirectory(path: string): void {
		return undefined;
	}

	readDirectory(path: string): string[] {
		return undefined;
	}

	readFile(filename: string): NodeBuffer | string {
		return undefined;
	}

	readText(filename: string, encoding?: string): string {
		return undefined;
	}

	readJson(filename: string, encoding?: string): any {
		return {};
	}

	writeFile(filename: string, data: any, encoding?: string): void {
		return undefined;
	}

	appendFile(filename: string, data: any, encoding?: string): void {
		return undefined;
	}

	writeJson(filename: string, data: any, space?: string, encoding?: string): void {
		return undefined;
	}

	copyFile(sourceFileName: string, destinationFileName: string): IFuture<void> {
		return undefined;
	}

	openFile(filename: string): void { }

	createReadStream(path: string, options?: { flags?: string; encoding?: string; fd?: string; mode?: number; bufferSize?: number }): any {
		return undefined;
	}

	createWriteStream(path: string, options?: { flags?: string; encoding?: string; string?: string }): any {
		return undefined;
	}

	chmod(path: string, mode: any): IFuture<any> {
		return undefined;
	}

	getUniqueFileName(baseName: string): string {
		return undefined;
	}

	getFsStats(path: string): IFsStats {
		return undefined;
	}

	getLsStats(path: string): IFuture<IFsStats> {
		return undefined;
	}

	isEmptyDir(directoryPath: string): boolean {
		return true;
	}

	ensureDirectoryExists(directoryPath: string): void {
		return undefined;
	}

	rename(oldPath: string, newPath: string): void {
		return undefined;
	}

	symlink(sourcePath: string, destinationPath: string): void { }

	setCurrentUserAsOwner(path: string, owner: string): IFuture<void> {
		return undefined;
	}

	enumerateFilesInDirectorySync(directoryPath: string, filterCallback?: (file: string, stat: IFsStats) => boolean): string[] {
		return [];
	}

	isRelativePath(path: string): boolean {
		return false;
	}

	getFileShasum(fileName: string): IFuture<string> {
		return undefined;
	}

	readStdin(): IFuture<string> {
		return undefined;
	}

	renameIfExists(oldPath: string, newPath: string): boolean {
		return undefined;
	}

	rm(options: string, ...files: string[]): void {
		// Mock
	}

	deleteEmptyParents(directory: string): void { }
}

export class ErrorsStub implements IErrors {
	constructor() {
		new (require("../lib/common/errors").Errors)(); // we need the side effect of require'ing errors
	}

	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) {
		throw args;
	}

	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error(message);
	}

	beginCommand(action: () => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		throw new Error("not supported");
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }

	printCallStack: boolean = false;

	validateArgs(client: string, knownOpts: any, shorthands: any): any { return null; }
	validateYargsArguments(parsed: any, knownOpts: any, shorthands: any, clientName?: string): void { }
}

export class NpmInstallationManagerStub implements INpmInstallationManager {
	install(packageName: string, pathToSave?: string, version?: string): IFuture<string> {
		return Future.fromResult("");
	}

	getLatestVersion(packageName: string): IFuture<string> {
		return Future.fromResult("");
	}

	getNextVersion(packageName: string): IFuture<string> {
		return Future.fromResult("");
	}

	getLatestCompatibleVersion(packageName: string): IFuture<string> {
		return Future.fromResult("");
	}

	getInspectorFromCache(name: string, projectDir: string): IFuture<string> {
		return Future.fromResult("");
	}
}

export class ProjectDataStub implements IProjectData {
	projectDir: string;
	projectName: string;
	get platformsDir(): string {
		return "";
	}
	projectFilePath: string;
	projectId: string;
	dependencies: any;
	appDirectoryPath: string;
	appResourcesDirectoryPath: string;
}

export class PlatformsDataStub implements IPlatformsData {
	public platformsNames: string[];

	public getPlatformData(platform: string): IPlatformData {
		return {
			frameworkPackageName: "",
			platformProjectService: new PlatformProjectServiceStub(),
			emulatorServices: undefined,
			projectRoot: "",
			normalizedPlatformName: "",
			appDestinationDirectoryPath: "",
			deviceBuildOutputPath: "",
			validPackageNamesForDevice: [],
			frameworkFilesExtensions: [],
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: []
		};
	}

	public get availablePlatforms(): any {
		return undefined;
	}
}

export class PlatformProjectServiceStub implements IPlatformProjectService {
	get platformData(): IPlatformData {
		return {
			frameworkPackageName: "",
			normalizedPlatformName: "",
			platformProjectService: this,
			emulatorServices: undefined,
			projectRoot: "",
			deviceBuildOutputPath: "",
			validPackageNamesForDevice: [],
			frameworkFilesExtensions: [],
			appDestinationDirectoryPath: "",
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: []
		};
	}
	getAppResourcesDestinationDirectoryPath(): string {
		return "";
	}
	validate(): IFuture<void> {
		return Future.fromResult();
	}
	createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return Future.fromResult();
	}
	interpolateData(): IFuture<void> {
		return Future.fromResult();
	}
	interpolateConfigurationFile(): IFuture<void> {
		return Future.fromResult();
	}
	afterCreateProject(projectRoot: string): void {
		return null;
	}
	prepareProject(): void { }

	buildProject(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	buildForDeploy(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	isPlatformPrepared(projectRoot: string): boolean {
		return false;
	}
	canUpdatePlatform(installedModulePath: string): boolean {
		return false;
	}
	updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean): IFuture<boolean> {
		return Future.fromResult(true);
	}
	prepareAppResources(appResourcesDirectoryPath: string): void { }

	preparePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return Future.fromResult();
	}
	removePluginNativeCode(pluginData: IPluginData): void { }

	afterPrepareAllPlugins(): IFuture<void> {
		return Future.fromResult();
	}
	beforePrepareAllPlugins(): IFuture<void> {
		return Future.fromResult();
	}
	deploy(deviceIdentifier: string): IFuture<void> {
		return Future.fromResult();
	}
	processConfigurationFilesFromAppResources(): IFuture<void> {
		return Future.fromResult();
	}
	ensureConfigurationFileInAppResources(): IFuture<void> {
		return Future.fromResult();
	}
}

export class ProjectDataService implements IProjectDataService {
	initialize(projectDir: string): void { }

	getValue(propertyName: string): IFuture<any> {
		return Future.fromResult({});
	}

	setValue(key: string, value: any): void { }

	removeProperty(propertyName: string): void { }

	removeDependency(dependencyName: string): void { }
}

export class ProjectHelperStub implements IProjectHelper {
	get projectDir(): string {
		return "";
	}

	generateDefaultAppId(appName: string, baseAppId: string): string {
		return "org.nativescript";
	}

	sanitizeName(appName: string): string {
		return "";
	}
}

export class ProjectTemplatesService implements IProjectTemplatesService {
	get defaultTemplatePath(): IFuture<string> {
		return Future.fromResult("");
	}
	setProjectDir(projectDir: string): void {
	}
	prepareTemplate(templateName: string): IFuture<string> {
		return Future.fromResult("");
	}
}

export class HooksServiceStub implements IHooksService {
	executeBeforeHooks(commandName: string): IFuture<void> {
		return Future.fromResult();
	}
	executeAfterHooks(commandName: string): IFuture<void> {
		return Future.fromResult();
	}

	hookArgsName = "hookArgs";
}

export class LockFile {

	check(): IFuture<boolean> {
		return (() => { return false; }).future<boolean>()();
	}

	lock(): IFuture<void> {
		return (() => { }).future<void>()();
	}

	unlock(): IFuture<void> {
		return (() => { }).future<void>()();
	}
}

export class PrompterStub implements IPrompter {
	private strings: IDictionary<string> = {};
	private passwords: IDictionary<string> = {};

	expect(options?: { strings: IDictionary<string>, passwords: IDictionary<string> }) {
		if (options) {
			this.strings = options.strings || this.strings;
			this.passwords = options.passwords || this.passwords;
		}
	}

	get(schemas: IPromptSchema[]): IFuture<any> {
		throw unreachable();
	}
	getPassword(prompt: string, options?: IAllowEmpty): IFuture<string> {
		chai.assert.ok(prompt in this.passwords, `PrompterStub didn't expect to give password for: ${prompt}`);
		let result = this.passwords[prompt];
		delete this.passwords[prompt];
		return (() => {
			return result;
		}).future<string>()();
	}
	getString(prompt: string, options?: IPrompterOptions): IFuture<string> {
		chai.assert.ok(prompt in this.strings, `PrompterStub didn't expect to be asked for: ${prompt}`);
		let result = this.strings[prompt];
		delete this.strings[prompt];
		return (() => {
			return result;
		}).future<string>()();
	}
	promptForChoice(promptMessage: string, choices: any[]): IFuture<string> {
		throw unreachable();
	}
	confirm(prompt: string, defaultAction?: () => boolean): IFuture<boolean> {
		throw unreachable();
	}
	dispose(): void {
		throw unreachable();
	}

	assert() {
		for (let key in this.strings) {
			throw unexpected(`PrompterStub was instructed to reply with "${this.strings[key]}" to a "${key}" question, but was never asked!`);
		}
		for (let key in this.passwords) {
			throw unexpected(`PrompterStub was instructed to reply with "${this.passwords[key]}" to a "${key}" password request, but was never asked!`);
		}
	}
}

function unreachable(): Error {
	return unexpected("Test case should not reach this point.");
}

function unexpected(msg: string): Error {
	let err = new chai.AssertionError(msg);
	err.showDiff = false;
	return err;
}

export class DebugServiceStub implements IDebugService {
	public debug(shouldBreak?: boolean): IFuture<void> {
		return Future.fromResult();
	}

	public debugStart(): IFuture<void> {
		return Future.fromResult();
	}

	public debugStop(): IFuture<void> {
		return Future.fromResult();
	}

	public platform: string;
}

export class LiveSyncServiceStub implements ILiveSyncService {
	public liveSync(platform: string, applicationReloadAction?: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): IFuture<void> {
		return Future.fromResult();
	}

	public forceExecuteFullSync: boolean;
}

export class AndroidToolsInfoStub implements IAndroidToolsInfo {
	public getToolsInfo(): IFuture<IAndroidToolsInfoData> {
		let infoData: IAndroidToolsInfoData = Object.create(null);
		infoData.androidHomeEnvVar = "";
		infoData.compileSdkVersion = 23;
		infoData.buildToolsVersion = "23";
		infoData.targetSdkVersion = 23;
		infoData.supportRepositoryVersion = "23";
		return Future.fromResult(infoData);
	}

	public validateInfo(options?: { showWarningsAsErrors: boolean, validateTargetSdk: boolean }): IFuture<boolean> {
		return Future.fromResult(true);
	}

	public validateJavacVersion(installedJavaVersion: string, options?: { showWarningsAsErrors: boolean }): IFuture<boolean> {
		return Future.fromResult(true);
	}

	public getPathToAndroidExecutable(options?: { showWarningsAsErrors: boolean }): IFuture<string> {
		return Future.fromResult("");
	}

	getPathToAdbFromAndroidHome(): IFuture<string> {
		return Future.fromResult("");
	}
}

export class ChildProcessStub {
	public spawnCount = 0;
	public spawnFromEventCount = 0;
	public lastCommand = "";
	public lastCommandArgs: string[] = [];

	public spawn(command: string, args?: string[], options?: any): any {
		this.spawnCount++;
		this.lastCommand = command;
		this.lastCommandArgs = args;
		return null;
	}

	public spawnFromEvent(command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): IFuture<ISpawnResult> {
		this.spawnFromEventCount++;
		this.lastCommand = command;
		this.lastCommandArgs = args;
		return Future.fromResult(null);
	}
}
