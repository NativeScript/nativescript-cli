interface INodePackageManager {
	load(config: any): IFuture<void>;
	executeCommand(command: string, arguments: string[]): IFuture<any>;
	cache: string;
}