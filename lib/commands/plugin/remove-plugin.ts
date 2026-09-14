import * as _ from "lodash";
import { IProjectData } from "../../definitions/project";
import { IPluginsService } from "../../definitions/plugins";
import { IErrors } from "../../common/declarations";
import { CommandContext, defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";

export function setupRemovePluginCommand() {
	const services = {
		$pluginsService: inject<IPluginsService>("pluginsService"),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$projectData: inject<IProjectData>("projectData"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export type IRemovePluginCommandServices = ReturnType<
	typeof setupRemovePluginCommand
>;

export async function canExecuteRemovePluginCommand(
	context: CommandContext,
	services: IRemovePluginCommandServices,
): Promise<boolean> {
	if (!context.args[0]) {
		services.$errors.failWithHelp("You must specify plugin name.");
	}

	let pluginNames: string[] = [];
	try {
		// try installing the plugins, so we can get information from node_modules about their native code, libs, etc.
		const installedPlugins =
			await services.$pluginsService.getAllInstalledPlugins(
				services.$projectData,
			);
		pluginNames = installedPlugins.map((pl) => pl.name);
	} catch (err) {
		services.$logger.trace("Error while installing plugins. Error is:", err);
		pluginNames = _.keys(services.$projectData.dependencies);
	}

	const pluginName = context.args[0].toLowerCase();
	if (!_.some(pluginNames, (name) => name.toLowerCase() === pluginName)) {
		services.$errors.fail(`Plugin "${pluginName}" is not installed.`);
	}

	return true;
}

export const removePluginCommandDefinition = defineCommand({
	name: "plugin|remove",
	description: "Uninstalls the specified plugin and its dependencies.",
	arguments: "any",
	setup: setupRemovePluginCommand,
	canExecute: canExecuteRemovePluginCommand,
	run(context, services): Promise<void> {
		return services.$pluginsService.remove(
			context.args[0],
			services.$projectData,
		);
	},
});
