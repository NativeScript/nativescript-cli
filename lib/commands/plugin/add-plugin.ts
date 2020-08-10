import * as _ from 'lodash';
import { IProjectData } from "../../definitions/project";
import { IPluginsService, IPluginData } from "../../definitions/plugins";
import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { IErrors } from "../../common/declarations";
import { $injector } from "../../common/definitions/yok";

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
			this.$errors.fail(`Plugin "${pluginName}" is already installed.`);
		}

		return true;
	}
}

$injector.registerCommand(["plugin|add", "plugin|install"], AddPluginCommand);
