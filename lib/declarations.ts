interface INodePackageManager {
	cache: string;
	load(config?: any): IFuture<void>;
	install(where: string, what: string): IFuture<any>;
}

interface IPropertiesParser {
	createEditor(filePath: string): IFuture<any>;
}