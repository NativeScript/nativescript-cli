import { createTable, isInteractive } from "../../common/helpers";
import { NATIVESCRIPT_KEY_NAME } from "../../constants";
import Future = require("fibers/future");

export class FindPluginsCommand implements ICommand {
	private static COUNT_OF_PLUGINS_TO_DISPLAY: number = 10;

	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $options: IOptions,
		private $progressIndicator: IProgressIndicator) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			let filter: string[] = this.prepareFilter(args);

			let pluginsFuture: IFuture<IDictionary<any>> = this.$pluginsService.getAvailable(filter);
			if (this.$options.json) {
				this.$logger.out(JSON.stringify(pluginsFuture.wait()));
				return;
			}

			this.$logger.printInfoMessageOnSameLine("Searching npm please be patient...");
			this.$progressIndicator.showProgressIndicator(pluginsFuture, 500).wait();
			let plugins: IDictionary<any> = pluginsFuture.get();

			this.showPlugins(plugins).wait();
		}).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return Future.fromResult(true);
	}

	public allowedParameters: ICommandParameter[] = [];

	private showPlugins(plugins: IDictionary<any>): IFuture<void> {
		return (() => {
			let allPluginsNames: string[] = _.keys(plugins).sort();

			if (!allPluginsNames || !allPluginsNames.length) {
				this.$logger.warn("No plugins found.");
				return;
			}

			let count: number = this.$options.count || FindPluginsCommand.COUNT_OF_PLUGINS_TO_DISPLAY;

			if (!isInteractive() || this.$options.all) {
				count = allPluginsNames.length;
			}

			let data: string[][] = [];

			let pluginsToDisplay: string[] = allPluginsNames.splice(0, count);
			let shouldDisplayMorePlugins: boolean = true;

			this.$logger.out("Available NativeScript plugins:");

			do {
				data = this.createTableCells(plugins, pluginsToDisplay);

				let table: any = this.createPluginsTable(data);

				this.$logger.out(table.toString());

				pluginsToDisplay = allPluginsNames.splice(0, count);

				if (!pluginsToDisplay || pluginsToDisplay.length < 1) {
					return;
				}

				shouldDisplayMorePlugins = this.$prompter.confirm("Load more plugins?").wait();
			} while (shouldDisplayMorePlugins);
		}).future<void>()();
	}

	private createPluginsTable(data: string[][]): any {
		let headers: string[] = ["Plugin", "Version", "Description"];

		let table: any = createTable(headers, data);

		return table;
	}

	private createTableCells(plugins: IDictionary<any>, pluginsToDisplay: string[]): string[][] {
		return pluginsToDisplay.map(pluginName => {
			let pluginDetails: any = plugins[pluginName];
			return [pluginName, pluginDetails.version, pluginDetails.description || ""];
		});
	}

	private prepareFilter(args: string[]): string[] {
		return _(args || [])
			.map(arg => arg.toLowerCase())
			.concat(NATIVESCRIPT_KEY_NAME)
			.uniq()
			.value();
	}

}

$injector.registerCommand(["plugin|find", "plugin|search"], FindPluginsCommand);
