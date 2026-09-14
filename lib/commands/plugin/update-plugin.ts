import * as _ from "lodash";
import { IProjectData } from "../../definitions/project";
import { IPluginsService } from "../../definitions/plugins";
import { IErrors } from "../../common/declarations";
import { CommandContext, defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { registerCommand } from "../../common/services/command-definition-adapter";

export interface IUpdatePluginCommandServices {
	$pluginsService: IPluginsService;
	$projectData: IProjectData;
	$errors: IErrors;
}

export function setupUpdatePluginCommand(): IUpdatePluginCommandServices {
	const services = {
		$pluginsService: inject<IPluginsService>("pluginsService"),
		$projectData: inject<IProjectData>("projectData"),
		$errors: inject<IErrors>("errors"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export async function canExecuteUpdatePluginCommand(
	context: CommandContext,
	services: IUpdatePluginCommandServices,
): Promise<boolean> {
	const args = context.args;
	if (!args || args.length === 0) {
		return true;
	}

	const installedPlugins =
		await services.$pluginsService.getAllInstalledPlugins(
			services.$projectData,
		);
	const installedPluginNames: string[] = installedPlugins.map((pl) => pl.name);

	const pluginName = args[0].toLowerCase();
	if (
		!_.some(installedPluginNames, (name) => name.toLowerCase() === pluginName)
	) {
		services.$errors.fail(`Plugin "${pluginName}" is not installed.`);
	}

	return true;
}

export async function runUpdatePluginCommand(
	context: CommandContext,
	services: IUpdatePluginCommandServices,
): Promise<void> {
	let pluginNames = context.args;

	if (!pluginNames || context.args.length === 0) {
		const installedPlugins =
			await services.$pluginsService.getAllInstalledPlugins(
				services.$projectData,
			);
		pluginNames = installedPlugins.map((p) => p.name);
	}

	for (const pluginName of pluginNames) {
		await services.$pluginsService.remove(pluginName, services.$projectData);
		await services.$pluginsService.add(pluginName, services.$projectData);
	}
}

export const updatePluginCommandDefinition = defineCommand({
	name: "plugin|update",
	description: "Uninstalls and installs the specified plugin(s).",
	arguments: "any",
	setup: setupUpdatePluginCommand,
	canExecute: canExecuteUpdatePluginCommand,
	run: runUpdatePluginCommand,
});

registerCommand(updatePluginCommandDefinition);
