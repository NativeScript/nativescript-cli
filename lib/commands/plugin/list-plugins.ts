import { createTable } from "../../common/helpers";

export class ListPluginsCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $logger: ILogger) { }

	allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let installedPlugins: IPackageJsonDepedenciesResult = this.$pluginsService.getDependenciesFromPackageJson();

			let headers: string[] = ["Plugin", "Version"];
			let dependenciesData: string[][] = this.createTableCells(installedPlugins.dependencies);

			let dependenciesTable: any = createTable(headers, dependenciesData);
			this.$logger.out("Dependencies:");
			this.$logger.out(dependenciesTable.toString());

			if (installedPlugins.devDependencies && installedPlugins.devDependencies.length) {
				let devDependenciesData: string[][] = this.createTableCells(installedPlugins.devDependencies);

				let devDependenciesTable: any = createTable(headers, devDependenciesData);

				this.$logger.out("Dev Dependencies:");
				this.$logger.out(devDependenciesTable.toString());
			} else {
				this.$logger.out("There are no dev dependencies.");
			}

			let viewDependenciesCommand: string = "npm view <pluginName> grep dependencies".cyan.toString();
			let viewDevDependenciesCommand: string = "npm view <pluginName> grep devDependencies".cyan.toString();

			this.$logger.warn("NOTE:");
			this.$logger.warn(`If you want to check the dependencies of installed plugin use ${viewDependenciesCommand}`);
			this.$logger.warn(`If you want to check the dev dependencies of installed plugin use ${viewDevDependenciesCommand}`);
		}).future<void>()();
	}

	private createTableCells(items: IBasePluginData[]): string[][] {
		return items.map(item => [item.name, item.version]);
	}
}

$injector.registerCommand("plugin|*list", ListPluginsCommand);
