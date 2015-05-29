interface IPluginsService {
	add(plugin: string): IFuture<void>;
	prepare(plugin: string): IFuture<void>;
	remove(plugin: string): IFuture<void>;
}