import { createTable, isInteractive } from "../../common/helpers";
import { NATIVESCRIPT_KEY_NAME } from "../../constants";

export class FindPluginsCommand implements ICommand {
	private static COUNT_OF_PLUGINS_TO_DISPLAY: number = 10;

	public allowedParameters: ICommandParameter[] = [];

	constructor(private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $options: IOptions,
		private $progressIndicator: IProgressIndicator) { }

	public async execute(args: string[]): Promise<void> {
		let filter: string[] = this.prepareFilter(args);

		let pluginsPromise: Promise<IDictionary<any>> = this.$pluginsService.getAvailable(filter);
		if (this.$options.json) {
			this.$logger.out(JSON.stringify(await pluginsPromise));
			return;
		}

		this.$logger.printInfoMessageOnSameLine("Searching npm please be patient...");
		let plugins = await this.$progressIndicator.showProgressIndicator(pluginsPromise, 500);

		await this.showPlugins(plugins);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return Promise.resolve(true);
	}

	private async showPlugins(plugins: IDictionary<any>): Promise<void> {
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

			shouldDisplayMorePlugins = await this.$prompter.confirm("Load more plugins?");
		} while (shouldDisplayMorePlugins);
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
