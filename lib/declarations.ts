interface INodePackageManager {
	cache: string;
	load(config?: any): IFuture<void>;
	install(packageName: string, pathToSave?: string, version?: string): IFuture<string>;
}

interface IStaticConfig extends Config.IStaticConfig { }

interface IApplicationPackage {
	packageName: string;
	time: Date;
}

