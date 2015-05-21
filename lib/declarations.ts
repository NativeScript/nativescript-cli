interface INodePackageManager {
	getCacheRootPath(): string;
	addToCache(packageName: string, version: string): IFuture<void>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	load(config?: any): IFuture<void>;
	install(packageName: string, options?: INpmInstallOptions): IFuture<string>;
	getLatestVersion(packageName: string): IFuture<string>;
	getCachedPackagePath(packageName: string, version: string): string;
}

interface INpmInstallOptions {
	pathToSave?: string;
	version?: string;
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
	copyFrom: string;
	linkTo: string;
	release: boolean;
	emulator: boolean;
	symlink: boolean;
	forDevice: boolean;
	client: boolean;
	keyStorePath: string;
	keyStorePassword: string;
	keyStoreAlias: string;
	keyStoreAliasPassword: string;
}
