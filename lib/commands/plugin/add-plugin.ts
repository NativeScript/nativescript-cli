export class AddPluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $pluginsService: IPluginsService,
		private $projectData: IProjectData,
		private $errors: IErrors) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		return this.$pluginsService.add(args[0], this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args[0]) {
			this.$errors.failWithHelp("You must specify plugin name.");
		}

		const installedPlugins = await this.$pluginsService.getAllInstalledPlugins(this.$projectData);
		const pluginName = args[0].toLowerCase();
		if (_.some(installedPlugins, (plugin: IPluginData) => plugin.name.toLowerCase() === pluginName)) {
			this.$errors.failWithoutHelp(`Plugin "${pluginName}" is already installed.`);
		}

		return true;
	}
}

$injector.registerCommand(["plugin|add", "plugin|install"], AddPluginCommand);
