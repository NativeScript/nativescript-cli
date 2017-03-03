export class UpdatePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $projectData: IProjectData,
		private $errors: IErrors) {
			this.$projectData.initializeProjectData();
		}

	public async execute(args: string[]): Promise<void> {
		let pluginNames = args;

		if (!pluginNames || args.length === 0) {
			let installedPlugins = await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
			pluginNames = installedPlugins.map(p => p.name);
		}

		for (let pluginName of pluginNames) {
			await this.$pluginsService.remove(pluginName, this.$projectData);
			await this.$pluginsService.add(pluginName, this.$projectData);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			return true;
		}

		let installedPlugins = await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
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
