import * as _ from "lodash";
import { IPluginsService } from "../../definitions/plugins";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { ProjectData } from "../../contracts/project-data";
import { provideProject } from "../command-base";

export const removePluginCommandDefinition = defineCommand({
	name: "plugin|remove",
	description: "Uninstalls the specified plugin and its dependencies.",
	params: "any",
	providers: [provideProject()],
	async canExecute(context): Promise<boolean> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $logger = inject<ILogger>("logger");
		const $projectData = inject(ProjectData);

		if (!context.args[0]) {
			context.fail("You must specify plugin name.");
		}

		let pluginNames: string[] = [];
		try {
			// try installing the plugins, so we can get information from node_modules about their native code, libs, etc.
			const installedPlugins =
				await $pluginsService.getAllInstalledPlugins($projectData);
			pluginNames = installedPlugins.map((pl) => pl.name);
		} catch (err) {
			$logger.trace("Error while installing plugins. Error is:", err);
			pluginNames = _.keys($projectData.dependencies);
		}

		const pluginName = context.args[0].toLowerCase();
		if (!_.some(pluginNames, (name) => name.toLowerCase() === pluginName)) {
			context.fail(`Plugin "${pluginName}" is not installed.`, { help: false });
		}

		return true;
	},
	run(context): Promise<void> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject(ProjectData);

		return $pluginsService.remove(context.args[0], $projectData);
	},
});
