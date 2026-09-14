import { createTable } from "../../common/helpers";
import { IProjectData } from "../../definitions/project";
import {
	IPluginsService,
	IPackageJsonDepedenciesResult,
	IBasePluginData,
} from "../../definitions/plugins";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { color } from "../../color";

export interface IListPluginsCommandServices {
	$pluginsService: IPluginsService;
	$projectData: IProjectData;
	$logger: ILogger;
}

export function setupListPluginsCommand(): IListPluginsCommandServices {
	const services = {
		$pluginsService: inject<IPluginsService>("pluginsService"),
		$projectData: inject<IProjectData>("projectData"),
		$logger: inject<ILogger>("logger"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

function createTableCells(items: IBasePluginData[]): string[][] {
	return items.map((item) => [item.name, item.version]);
}

export const listPluginsCommandDefinition = defineCommand({
	name: "plugin|*list",
	description: "Lists all installed plugins.",
	arguments: "none",
	setup: setupListPluginsCommand,
	async run(context, services): Promise<void> {
		const installedPlugins: IPackageJsonDepedenciesResult =
			services.$pluginsService.getDependenciesFromPackageJson(
				services.$projectData.projectDir,
			);

		const headers: string[] = ["Plugin", "Version"];
		const dependenciesData: string[][] = createTableCells(
			installedPlugins.dependencies,
		);

		const dependenciesTable: any = createTable(headers, dependenciesData);
		services.$logger.info("Dependencies:");
		services.$logger.info(dependenciesTable.toString());

		if (
			installedPlugins.devDependencies &&
			installedPlugins.devDependencies.length
		) {
			const devDependenciesData: string[][] = createTableCells(
				installedPlugins.devDependencies,
			);

			const devDependenciesTable: any = createTable(
				headers,
				devDependenciesData,
			);

			services.$logger.info("Dev Dependencies:");
			services.$logger.info(devDependenciesTable.toString());
		} else {
			services.$logger.info("There are no dev dependencies.");
		}

		const viewDependenciesCommand: string = color.cyan(
			"npm view <pluginName> grep dependencies",
		);
		const viewDevDependenciesCommand: string = color.cyan(
			"npm view <pluginName> grep devDependencies",
		);

		services.$logger.warn("NOTE:");
		services.$logger.warn(
			`If you want to check the dependencies of installed plugin use ${viewDependenciesCommand}`,
		);
		services.$logger.warn(
			`If you want to check the dev dependencies of installed plugin use ${viewDevDependenciesCommand}`,
		);
	},
});
