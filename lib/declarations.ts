interface INodePackageManager {
	cache: string;
	load(config?: any): IFuture<void>;
	install(where: string, what: string): IFuture<any>;
	tryExecuteAction(action: any, args?: any[]): IFuture<void>;
	downloadNpmPackage(packageName: string, pathToSave?: string): IFuture<string>;
}

interface IPropertiesParser {
	createEditor(filePath: string): IFuture<any>;
}