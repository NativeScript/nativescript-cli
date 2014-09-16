interface INodePackageManager {
	getCacheRootPath(): IFuture<string>;
	addToCache(packageName: string, version: string): IFuture<void>;
	cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void>;
	load(config?: any): IFuture<void>;
	install(packageName: string, options?: INpmInstallOptions): IFuture<string>;
	getLatestVersion(packageName: string): IFuture<string>;
}

interface INpmInstallOptions {
	pathToSave?: string;
	version?: string;
}

interface IStaticConfig extends Config.IStaticConfig { }

interface IApplicationPackage {
	packageName: string;
	time: Date;
}

