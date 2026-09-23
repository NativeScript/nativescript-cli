import * as _ from "lodash";
import { IPluginsService } from "../../definitions/plugins";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { ProjectData } from "../../contracts/project-data";
import { provideProject } from "../command-base";

export const updatePluginCommandDefinition = defineCommand({
	name: "plugin|update",
	description: "Uninstalls and installs the specified plugin(s).",
	params: "any",
	providers: [provideProject()],
	async canExecute(context): Promise<boolean> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject(ProjectData);

		const args = context.args;
		if (!args || args.length === 0) {
			return true;
		}

		const installedPlugins =
			await $pluginsService.getAllInstalledPlugins($projectData);
		const installedPluginNames: string[] = installedPlugins.map(
			(pl) => pl.name,
		);

		const pluginName = args[0].toLowerCase();
		if (
			!_.some(installedPluginNames, (name) => name.toLowerCase() === pluginName)
		) {
			context.fail(`Plugin "${pluginName}" is not installed.`, { help: false });
		}

		return true;
	},
	async run(context): Promise<void> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject(ProjectData);

		let pluginNames = context.args;

		if (!pluginNames || context.args.length === 0) {
			const installedPlugins =
				await $pluginsService.getAllInstalledPlugins($projectData);
			pluginNames = installedPlugins.map((p) => p.name);
		}

		for (const pluginName of pluginNames) {
			await $pluginsService.remove(pluginName, $projectData);
			await $pluginsService.add(pluginName, $projectData);
		}
	},
});
