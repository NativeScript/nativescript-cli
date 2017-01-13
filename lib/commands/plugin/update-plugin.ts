export class UpdatePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

	public async execute(args: string[]): Promise<void> {
		let pluginNames = args;

		if (!pluginNames || args.length === 0) {
			let installedPlugins = await this.$pluginsService.getAllInstalledPlugins();
			pluginNames = installedPlugins.map(p => p.name);
		}

		for (let p of pluginNames) {
			await this.$pluginsService.remove(p);
			await this.$pluginsService.add(p);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			return true;
		}

		let installedPlugins = await this.$pluginsService.getAllInstalledPlugins();
		let installedPluginNames: string[] = installedPlugins.map(pl => pl.name);

		let pluginName = args[0].toLowerCase();
		if (!_.some(installedPluginNames, name => name.toLowerCase() === pluginName)) {
			this.$errors.failWithoutHelp(`Plugin "${pluginName}" is not installed.`);
		}

		return true;
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("plugin|update", UpdatePluginCommand);
