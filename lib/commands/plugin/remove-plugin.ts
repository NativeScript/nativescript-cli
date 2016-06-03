export class RemovePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectData: IProjectData) { }

	execute(args: string[]): IFuture<void> {
		return this.$pluginsService.remove(args[0]);
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(!args[0]) {
				this.$errors.fail("You must specify plugin name.");
			}

			let pluginNames: string[] = [];
			try {
				// try installing the plugins, so we can get information from node_modules about their native code, libs, etc.
				let installedPlugins = this.$pluginsService.getAllInstalledPlugins().wait();
				pluginNames = installedPlugins.map(pl => pl.name);
			} catch(err) {
				this.$logger.trace("Error while installing plugins. Error is:", err);
				pluginNames =  _.keys(this.$projectData.dependencies);
			}

			let pluginName = args[0].toLowerCase();
			if(!_.any(pluginNames, name => name.toLowerCase() === pluginName)) {
				this.$errors.failWithoutHelp(`Plugin "${pluginName}" is not installed.`);
			}

			return true;
		}).future<boolean>()();
	}

	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|remove", RemovePluginCommand);
