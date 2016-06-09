/* tslint:disable:no-empty */

import Future = require("fibers/future");
import * as util from "util";

import * as chai from "chai";

export class LoggerStub implements ILogger {
	setLevel(level: string): void { }
	getLevel(): string { return undefined; }
	fatal(...args: string[]): void {}
	error(...args: string[]): void {}
	warn(...args: string[]): void {}
	warnWithLabel(...args: string[]): void {}
	info(...args: string[]): void {}
	debug(...args: string[]): void {}
	trace(...args: string[]): void {}

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
	exists(path: string): IFuture<boolean> {
		return Future.fromResult(true);
	}

	deleteFile(path:string):IFuture<void> {
		return undefined;
	}

	deleteDirectory(directory: string): IFuture<void> {
		return Future.fromResult();
	}

	getFileSize(path:string):IFuture<number> {
		return undefined;
	}

	futureFromEvent(eventEmitter: any, event: string): IFuture<any> {
		return undefined;
	}

	createDirectory(path:string):IFuture<void> {
		return Future.fromResult();
	}

	readDirectory(path:string):IFuture<string[]> {
		return undefined;
	}

	readFile(filename:string):IFuture<NodeBuffer> {
		return undefined;
	}

	readText(filename:string, encoding?:string):IFuture<string> {
		return undefined;
	}

	readJson(filename:string, encoding?:string):IFuture<any> {
		return Future.fromResult({});
	}

	writeFile(filename: string, data: any, encoding?: string): IFuture<void> {
		return undefined;
	}

	appendFile(filename: string, data: any, encoding?: string): IFuture<void> {
		return undefined;
	}

	writeJson(filename: string, data: any, space?: string, encoding?: string): IFuture<void> {
		return undefined;
	}

	copyFile(sourceFileName:string, destinationFileName:string):IFuture<void> {
		return undefined;
	}

	openFile(filename: string): void { }

	createReadStream(path:string, options?:{flags?: string; encoding?: string; fd?: string; mode?: number; bufferSize?: number}): any {
		return undefined;
	}

	createWriteStream(path:string, options?:{flags?: string; encoding?: string; string?: string}): any {
		return undefined;
	}

	chmod(path: string, mode: any): IFuture<any> {
		return undefined;
	}

	getUniqueFileName(baseName: string): IFuture<string> {
		return undefined;
	}

	getFsStats(path: string): IFuture<IFsStats> {
		return undefined;
	}

	isEmptyDir(directoryPath: string): IFuture<boolean> {
		return Future.fromResult(true);
	}

	ensureDirectoryExists(directoryPath: string): IFuture<void> {
		return Future.fromResult();
	}

	rename(oldPath: string, newPath: string): IFuture<void> {
		return undefined;
	}

	symlink(sourcePath: string, destinationPath: string): IFuture<void> {
		return undefined;
	}

	closeStream(stream: any): IFuture<void> {
		return undefined;
	}

	setCurrentUserAsOwner(path: string, owner: string): IFuture<void> {
		return undefined;
	}

	enumerateFilesInDirectorySync(directoryPath: string, filterCallback?: (file: string, stat: IFsStats) => boolean): string[] {
		return [];
	}

	tryExecuteFileOperation(path: string, operation: () => IFuture<any>, enoentErrorMessage?: string): IFuture<void> {
		return undefined;
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

	renameIfExists(oldPath: string, newPath: string): IFuture<boolean> {
		return undefined;
	}

	rm(options: string, ...files: string[]): void {
		// Mock
	}
}

export class ErrorsStub implements IErrors {
	constructor() {
		new (require("../lib/common/errors").Errors)(); // we need the side effect of require'ing errors
	}

	fail(formatStr:string, ...args: any[]): void;
	fail(opts:{formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean}, ...args: any[]): void;

	fail(...args: any[]) {
		throw args;
	}

	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error(message);
	}

	beginCommand(action:() => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
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
	getCacheRootPath(): string {
		return undefined;
	}

	addToCache(packageName: string, version: string): IFuture<void> {
		return undefined;
	}

	cacheUnpack(packageName: string, version: string): IFuture<void> {
		return undefined;
	}

	load(config?: any): IFuture<void> {
		return undefined;
	}

	install(packageName: string, pathToSave?: string, version?: string): IFuture<string> {
		return Future.fromResult("");
	}

	getLatestVersion(packageName: string): IFuture<string> {
		return Future.fromResult("");
	}

	getLatestCompatibleVersion(packageName: string): IFuture<string> {
		return Future.fromResult("");
	}

	getCachedPackagePath(packageName: string, version: string): string {
		return "";
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
	getAppResourcesDestinationDirectoryPath(): IFuture<string>{
		return Future.fromResult("");
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
	afterCreateProject(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	prepareProject(): IFuture<void> {
		return Future.fromResult();
	}
	buildProject(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	buildForDeploy(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return Future.fromResult(false);
	}
	canUpdatePlatform(currentVersion: string, newVersion: string): IFuture<boolean> {
		return Future.fromResult(false);
	}
	updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean): IFuture<boolean> {
		return Future.fromResult(true);
	}
	prepareAppResources(appResourcesDirectoryPath: string): IFuture<void> {
		return Future.fromResult();
	}
	preparePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return Future.fromResult();
	}
	removePluginNativeCode(pluginData: IPluginData): IFuture<void> {
		return Future.fromResult();
	}
	afterPrepareAllPlugins(): IFuture<void> {
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

	setValue(key: string, value: any): IFuture<void> {
		return Future.fromResult();
	}

	removeProperty(propertyName: string): IFuture<void> {
		return Future.fromResult();
	}

	removeDependency(dependencyName: string): IFuture<void> {
		return Future.fromResult();
	}
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
}

export class LockFile {
	lock(): IFuture<void> {
		return (() => {}).future<void>()();
	}

	unlock(): IFuture<void> {
	 	return (() => {}).future<void>()();
	}
}

export class PrompterStub implements IPrompter {
	private strings: IDictionary<string> = {};
	private passwords: IDictionary<string> = {};

	expect(options?: { strings: IDictionary<string>, passwords: IDictionary<string> } ) {
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
