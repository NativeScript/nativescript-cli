interface INodePackageManager {
	cache: string;
	load(config?: any): IFuture<void>;
	install(where: string, what: string): IFuture<any>;
	installSafe(packageName: string, pathToSave?: string): IFuture<string>;
}

interface IPropertiesParser {
	createEditor(filePath: string): IFuture<any>;
}