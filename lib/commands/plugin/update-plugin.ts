export class UpdatePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			let pluginNames = args;

			if (!pluginNames || args.length === 0) {
				let installedPlugins = this.$pluginsService.getAllInstalledPlugins().wait();
				pluginNames = installedPlugins.map(p => p.name);
			}

			_.each(pluginNames, p => {
				this.$pluginsService.remove(p).wait();
				this.$pluginsService.add(p).wait();
			});
		}).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (!args || args.length === 0) {
				return true;
			}

			let installedPlugins = this.$pluginsService.getAllInstalledPlugins().wait();
			let installedPluginNames: string[] = installedPlugins.map(pl => pl.name);

			let pluginName = args[0].toLowerCase();
			if (!_.some(installedPluginNames, name => name.toLowerCase() === pluginName)) {
				this.$errors.failWithoutHelp(`Plugin "${pluginName}" is not installed.`);
			}

			return true;
		}).future<boolean>()();
	}

	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|update", UpdatePluginCommand);
