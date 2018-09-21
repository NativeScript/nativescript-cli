import { PluginsSourceBase } from "./plugins-source-base";

export class NpmPluginsSource extends PluginsSourceBase implements IPluginsSource {
	constructor(protected $progressIndicator: IProgressIndicator,
		protected $logger: ILogger,
		private $npmService: INpmService) {
		super($progressIndicator, $logger);
	}

	protected get progressIndicatorMessage(): string {
		return "Searching for plugins with npm search command.";
	}

	public async getPlugins(page: number, count: number): Promise<IBasicPluginInformation[]> {
		const skip = page * count;

		return _.slice(this.plugins, skip, skip + count);
	}

	protected async initializeCore(projectDir: string, keywords: string[]): Promise<void> {
		this.plugins = await this.$npmService.search(this.projectDir, keywords);
	}
}
