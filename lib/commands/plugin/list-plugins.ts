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

function createTableCells(items: IBasePluginData[]): string[][] {
	return items.map((item) => [item.name, item.version]);
}

export const listPluginsCommandDefinition = defineCommand({
	name: "plugin|*list",
	description: "Lists all installed plugins.",
	arguments: "none",
	// In setup, not run: it lands ahead of the arguments policy, so being
	// outside a project is what a bad invocation reports first.
	setup(): void {
		inject<IProjectData>("projectData").initializeProjectData();
	},
	async run(): Promise<void> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject<IProjectData>("projectData");
		const $logger = inject<ILogger>("logger");
		const installedPlugins: IPackageJsonDepedenciesResult =
			$pluginsService.getDependenciesFromPackageJson($projectData.projectDir);

		const headers: string[] = ["Plugin", "Version"];
		const dependenciesData: string[][] = createTableCells(
			installedPlugins.dependencies,
		);

		const dependenciesTable: any = createTable(headers, dependenciesData);
		$logger.info("Dependencies:");
		$logger.info(dependenciesTable.toString());

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

			$logger.info("Dev Dependencies:");
			$logger.info(devDependenciesTable.toString());
		} else {
			$logger.info("There are no dev dependencies.");
		}

		const viewDependenciesCommand: string = color.cyan(
			"npm view <pluginName> grep dependencies",
		);
		const viewDevDependenciesCommand: string = color.cyan(
			"npm view <pluginName> grep devDependencies",
		);

		$logger.warn("NOTE:");
		$logger.warn(
			`If you want to check the dependencies of installed plugin use ${viewDependenciesCommand}`,
		);
		$logger.warn(
			`If you want to check the dev dependencies of installed plugin use ${viewDevDependenciesCommand}`,
		);
	},
});
