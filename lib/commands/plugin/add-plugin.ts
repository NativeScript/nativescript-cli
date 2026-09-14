import * as _ from "lodash";
import { IProjectData } from "../../definitions/project";
import { IPluginsService, IPluginData } from "../../definitions/plugins";
import { IErrors } from "../../common/declarations";
import { CommandContext, defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";

export interface IAddPluginCommandServices {
	$pluginsService: IPluginsService;
	$projectData: IProjectData;
	$errors: IErrors;
}

export function setupAddPluginCommand(): IAddPluginCommandServices {
	const services = {
		$pluginsService: inject<IPluginsService>("pluginsService"),
		$projectData: inject<IProjectData>("projectData"),
		$errors: inject<IErrors>("errors"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export async function canExecuteAddPluginCommand(
	context: CommandContext,
	services: IAddPluginCommandServices,
): Promise<boolean> {
	if (!context.args[0]) {
		services.$errors.failWithHelp("You must specify plugin name.");
	}

	const installedPlugins =
		await services.$pluginsService.getAllInstalledPlugins(
			services.$projectData,
		);
	const pluginName = context.args[0].toLowerCase();
	if (
		_.some(
			installedPlugins,
			(plugin: IPluginData) => plugin.name.toLowerCase() === pluginName,
		)
	) {
		services.$errors.fail(`Plugin "${pluginName}" is already installed.`);
	}

	return true;
}

export const addPluginCommandDefinition = defineCommand({
	name: ["plugin|add", "plugin|install"],
	description: "Installs the specified plugin and its dependencies.",
	arguments: "any",
	setup: setupAddPluginCommand,
	canExecute: canExecuteAddPluginCommand,
	run(context, services): Promise<void> {
		return services.$pluginsService.add(context.args[0], services.$projectData);
	},
});
