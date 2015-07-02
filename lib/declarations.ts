interface INodePackageManager {
	getCache(): string;
	load(config?: any): IFuture<void>;
	install(packageName: string, pathToSave: string, config?: any): IFuture<any>;
	uninstall(packageName: string, config?: any): IFuture<any>;
	cache(packageName: string, version: string, cache?: any): IFuture<ICacheData>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	view(packageName: string, propertyName: string): IFuture<any>;
}

interface INpmInstallationManager {
	getCacheRootPath(): string;
	addToCache(packageName: string, version: string): IFuture<void>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	install(packageName: string, options?: INpmInstallOptions): IFuture<string>;
	getLatestVersion(packageName: string): IFuture<string>;
	getCachedPackagePath(packageName: string, version: string): string;
}

interface INpmInstallOptions {
	pathToSave?: string;
	version?: string;
}

interface ICacheData {
	name: string;
	version: string;
	dependencies: IStringDictionary;
	devDependencies: IStringDictionary;
	nativescript?: any;
}

interface IStaticConfig extends Config.IStaticConfig { }

interface IConfiguration extends Config.IConfig { }

interface IApplicationPackage {
	packageName: string;
	time: Date;
}

interface ILockFile {
	lock(): IFuture<void>;
	unlock(): IFuture<void>;
}

interface IOpener {
    open(target: string, appname: string): void;
}

interface IOptions extends ICommonOptions {
	frameworkPath: string;
	frameworkName: string;
	frameworkVersion: string;
	copyFrom: string;
	linkTo: string;
	release: boolean;
	emulator: boolean;
	symlink: boolean;
	forDevice: boolean;
	client: boolean;
	production: boolean;
	keyStorePath: string;
	keyStorePassword: string;
	keyStoreAlias: string;
	keyStoreAliasPassword: string;
	sdk: string;
	ignoreScripts: boolean;
}

interface IProjectFilesManager {
	processPlatformSpecificFiles(directoryPath: string, platform: string, excludedDirs?: string[]): IFuture<void>;
}

interface IInitService {
	initialize(): IFuture<void>;
}