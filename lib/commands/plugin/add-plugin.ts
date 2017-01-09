export class AddPluginCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

	public async execute(args: string[]): Promise<void> {
		return this.$pluginsService.add(args[0]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args[0]) {
			this.$errors.fail("You must specify plugin name.");
		}

		let installedPlugins = await this.$pluginsService.getAllInstalledPlugins();
		let pluginName = args[0].toLowerCase();
		if (_.some(installedPlugins, (plugin: IPluginData) => plugin.name.toLowerCase() === pluginName)) {
			this.$errors.failWithoutHelp(`Plugin "${pluginName}" is already installed.`);
		}

		return true;
	}
}

$injector.registerCommand(["plugin|add", "plugin|install"], AddPluginCommand);
