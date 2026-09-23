import { createTable } from "../../common/helpers";
import {
	IPluginsService,
	IPackageJsonDepedenciesResult,
	IBasePluginData,
} from "../../definitions/plugins";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { color } from "../../color";
import { ProjectData } from "../../contracts/project-data";
import { provideProject } from "../command-base";

function createTableCells(items: IBasePluginData[]): string[][] {
	return items.map((item) => [item.name, item.version]);
}

export const listPluginsCommandDefinition = defineCommand({
	name: "plugin|*list",
	description: "Lists all installed plugins.",
	arguments: "none",
	providers: [provideProject()],
	async run(): Promise<void> {
		const $pluginsService = inject<IPluginsService>("pluginsService");
		const $projectData = inject(ProjectData);
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
