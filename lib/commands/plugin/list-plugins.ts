///<reference path="../../.d.ts"/>
"use strict";

import { createTable } from "../../common/helpers";

export class ListPluginsCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $options: IOptions) { }

	allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let installedPlugins: IPackageJsonDepedenciesResult = this.$pluginsService.getDependenciesFromPackageJson().wait();
			let headers: string[] = ["Plugin", "Version"];
			let dependenciesData: string[][] = [];
			let devDependenciesData: string[][] = [];

			_.each(installedPlugins.dependencies, (dependency: IBasePluginData) => {
				dependenciesData.push([dependency.name, dependency.version]);
			});

			let dependenciesTable: any = createTable(headers, dependenciesData);
			this.$logger.out("Dependencies");
			this.$logger.out(dependenciesTable.toString());

			if (installedPlugins.devDependencies && installedPlugins.devDependencies.length) {
				_.each(installedPlugins.devDependencies, (dependency: IBasePluginData) => {
					devDependenciesData.push([dependency.name, dependency.version]);
				});

				let devDependenciesTable: any = createTable(headers, devDependenciesData);

				this.$logger.out("Dev Dependencies");
				this.$logger.out(devDependenciesTable.toString());
			} else {
				this.$logger.out("There are no dev dependencies.");
			}

			let viewDependenciesCommand: string = "npm view <pluginName> grep dependencies".cyan.toString();
			let viewDevDependenciesCommand: string = "npm view <pluginName> grep devDependencies".cyan.toString();

			this.$logger.warn("NOTE:");
			this.$logger.warn(`If you want to see the dependencies of installed plugin use ${viewDependenciesCommand}`);
			this.$logger.warn(`If you want to see the dev dependencies of installed plugin use ${viewDevDependenciesCommand}`);
		}).future<void>()();
	}
}

$injector.registerCommand("plugin|*list", ListPluginsCommand);
