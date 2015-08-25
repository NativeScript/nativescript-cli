interface INodePackageManager {
	getCache(): string;
	load(config?: any): IFuture<void>;
	install(packageName: string, pathToSave: string, config?: any): IFuture<any>;
	uninstall(packageName: string, config?: any): IFuture<any>;
	cache(packageName: string, version: string, cache?: any): IFuture<IDependencyData>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	view(packageName: string, propertyName: string): IFuture<any>;
	executeNpmCommand(npmCommandName: string, currentWorkingDirectory: string): IFuture<any>;
}

interface INpmInstallationManager {
	getCacheRootPath(): string;
	addToCache(packageName: string, version: string): IFuture<void>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	install(packageName: string, options?: INpmInstallOptions): IFuture<string>;
	getLatestVersion(packageName: string): IFuture<string>;
	getCachedPackagePath(packageName: string, version: string): string;
	addCleanCopyToCache(packageName: string, version: string): IFuture<void>;
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
	ANDROID_DEBUG_UI_MAC: string;
}

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

interface IUsbLiveSyncService {
	liveSync(platform: string): IFuture<void>;
}

interface IPlatformSpecificUsbLiveSyncService {
	restartApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths?: Mobile.ILocalToDevicePathData[]): IFuture<void>;
	beforeLiveSyncAction?(deviceAppData: Mobile.IDeviceAppData): IFuture<void>;
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
	tnsModulesVersion: string;
}

interface IProjectFilesManager {
	processPlatformSpecificFiles(directoryPath: string, platform: string, excludedDirs?: string[]): IFuture<void>;
}

interface IInitService {
	initialize(): IFuture<void>;
}
