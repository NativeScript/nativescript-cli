///<reference path=".d.ts"/>

import Future = require("fibers/future");
import util = require("util");
import path = require("path");

export class LoggerStub implements ILogger {
	setLevel(level: string): void {}
	fatal(...args: string[]): void {}
	error(...args: string[]): void {}
	warn(...args: string[]): void {}
	info(...args: string[]): void {}
	debug(...args: string[]): void {}
	trace(...args: string[]): void {}

	public output = "";

	out(...args: string[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args: string[]): void { }
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

	symlink(sourePath: string, destinationPath: string): IFuture<void> {
		return undefined;
	}

	closeStream(stream: any): IFuture<void> {
		return undefined;
	}

	setCurrentUserAsOwner(path: string, owner: string): IFuture<void> {
		return undefined;
	}
}

export class ErrorsStub implements IErrors {
	private impl: IErrors = new (require("../lib/common/errors").Errors)();

	fail(formatStr:string, ...args: any[]): void;
	fail(opts:{formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean}, ...args: any[]): void;

	fail(...args: any[]) {
		throw args;
	}

	beginCommand(action:() => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		throw new Error("not supported");
	}

	verifyHeap(message: string): void {

	}
}

export class NPMStub implements INodePackageManager {
	getCacheRootPath(): IFuture<string> {
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
}

export class ProjectDataStub implements IProjectData {
	projectDir: string;
	projectName: string;
	get platformsDir(): string {
		return "";
	}
	projectFilePath: string;
	projectId: string;
}

export class PlatformsDataStub implements IPlatformsData {
	public get platformsNames(): string[] {
		return undefined;
	}

	public getPlatformData(platform: string): IPlatformData {
		return {
			frameworkPackageName: "",
			normalizedPlatformName: "",
			platformProjectService: new PlatformProjectServiceStub(),
			emulatorServices: undefined,
			projectRoot: "",
			deviceBuildOutputPath: "",
			validPackageNamesForDevice: [],
			frameworkFilesExtensions: []
		};
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
			frameworkFilesExtensions: []
		};
	}
	validate(): IFuture<void> {
		return Future.fromResult();
	}
	createProject(projectRoot: string, frameworkDir: string): IFuture<void> {
		return Future.fromResult();
	}
	interpolateData(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	afterCreateProject(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	prepareProject(platformData: IPlatformData): IFuture<string> {
		return Future.fromResult("");
	}
	buildProject(projectRoot: string): IFuture<void> {
		return Future.fromResult();
	}
	isPlatformPrepared(projectRoot: string): IFuture<boolean> {
		return Future.fromResult(false);
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
}

export class ProjectHelperStub implements IProjectHelper {
	get projectDir(): string {
		return "";
	}

	generateDefaultAppId(appName: string, baseAppId: string): string {
		return "org.nativescript";
	}
}

export class ProjectTemplatesService implements IProjectTemplatesService {
	get defaultTemplatePath(): IFuture<string> {
		return Future.fromResult("");
	}
}

export class HooksServiceStub implements IHooksService {
	initialize(commandName: string): void {
	}
	executeBeforeHooks(): IFuture<void> {
		return (() => { }).future<void>()();
	}
	executeAfterHooks(): IFuture<void> {
		return (() => { }).future<void>()();
	}
}
