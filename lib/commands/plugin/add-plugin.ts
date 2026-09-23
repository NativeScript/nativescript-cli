import * as _ from "lodash";
import { IProjectData } from "../../definitions/project";
import { IPluginsService, IPluginData } from "../../definitions/plugins";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";

export const addPluginCommandDefinition = defineCommand({
	name: ["plugin|add", "plugin|install"],
	description: "Installs the specified plugin and its dependencies.",
	arguments: "any",
	async canExecute(context): Promise<boolean> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		if (!context.args[0]) {
			context.fail("You must specify plugin name.");
		}

		const installedPlugins =
			await $pluginsService.getAllInstalledPlugins($projectData);
		const pluginName = context.args[0].toLowerCase();
		if (
			_.some(
				installedPlugins,
				(plugin: IPluginData) => plugin.name.toLowerCase() === pluginName,
			)
		) {
			context.fail(`Plugin "${pluginName}" is already installed.`, {
				help: false,
			});
		}

		return true;
	},
	run(context): Promise<void> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject<IProjectData>("projectData");
		$projectData.initializeProjectData();

		return $pluginsService.add(context.args[0], $projectData);
	},
});
