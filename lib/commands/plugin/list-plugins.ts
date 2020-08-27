import { createTable } from "../../common/helpers";
import { IProjectData } from "../../definitions/project";
import {
	IPluginsService,
	IPackageJsonDepedenciesResult,
	IBasePluginData,
} from "../../definitions/plugins";
import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { injector } from "../../common/yok";

export class ListPluginsCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $pluginsService: IPluginsService,
		private $projectData: IProjectData,
		private $logger: ILogger
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const installedPlugins: IPackageJsonDepedenciesResult = this.$pluginsService.getDependenciesFromPackageJson(
			this.$projectData.projectDir
		);

		const headers: string[] = ["Plugin", "Version"];
		const dependenciesData: string[][] = this.createTableCells(
			installedPlugins.dependencies
		);

		const dependenciesTable: any = createTable(headers, dependenciesData);
		this.$logger.info("Dependencies:");
		this.$logger.info(dependenciesTable.toString());

		if (
			installedPlugins.devDependencies &&
			installedPlugins.devDependencies.length
		) {
			const devDependenciesData: string[][] = this.createTableCells(
				installedPlugins.devDependencies
			);

			const devDependenciesTable: any = createTable(
				headers,
				devDependenciesData
			);

			this.$logger.info("Dev Dependencies:");
			this.$logger.info(devDependenciesTable.toString());
		} else {
			this.$logger.info("There are no dev dependencies.");
		}

		const viewDependenciesCommand: string = "npm view <pluginName> grep dependencies".cyan.toString();
		const viewDevDependenciesCommand: string = "npm view <pluginName> grep devDependencies".cyan.toString();

		this.$logger.warn("NOTE:");
		this.$logger.warn(
			`If you want to check the dependencies of installed plugin use ${viewDependenciesCommand}`
		);
		this.$logger.warn(
			`If you want to check the dev dependencies of installed plugin use ${viewDevDependenciesCommand}`
		);
	}

	private createTableCells(items: IBasePluginData[]): string[][] {
		return items.map((item) => [item.name, item.version]);
	}
}

injector.registerCommand("plugin|*list", ListPluginsCommand);
