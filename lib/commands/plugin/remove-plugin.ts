export class RemovePluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectData: IProjectData) {
			this.$projectData.initializeProjectData();
		}

	public async execute(args: string[]): Promise<void> {
		return this.$pluginsService.remove(args[0], this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args[0]) {
			this.$errors.fail("You must specify plugin name.");
		}

		let pluginNames: string[] = [];
		try {
			// try installing the plugins, so we can get information from node_modules about their native code, libs, etc.
			const installedPlugins = await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
			pluginNames = installedPlugins.map(pl => pl.name);
		} catch (err) {
			this.$logger.trace("Error while installing plugins. Error is:", err);
			pluginNames = _.keys(this.$projectData.dependencies);
		}

		const pluginName = args[0].toLowerCase();
		if (!_.some(pluginNames, name => name.toLowerCase() === pluginName)) {
			this.$errors.failWithoutHelp(`Plugin "${pluginName}" is not installed.`);
		}

		return true;
	}

}

$injector.registerCommand("plugin|remove", RemovePluginCommand);
