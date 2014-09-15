interface INodePackageManager {
	cache: string;
	load(config?: any): IFuture<void>;
	install(packageName: string, options?: INpmInstallOptions): IFuture<string>;
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

