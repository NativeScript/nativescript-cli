export abstract class PluginsSourceBase implements IPluginsSource {
	protected progressIndicatorMessage: string;
	protected projectDir: string;
	protected plugins: IBasicPluginInformation[];

	private _isInitialized: boolean;

	constructor(protected $progressIndicator: IProgressIndicator,
		protected $logger: ILogger) { }

	public async initialize(projectDir: string, keywords: string[]): Promise<void> {
		if (this._isInitialized) {
			return;
		}

		this.plugins = [];
		this.projectDir = projectDir;
		this._isInitialized = true;

		this.$logger.printInfoMessageOnSameLine(this.progressIndicatorMessage);
		await this.$progressIndicator.showProgressIndicator(this.initializeCore(projectDir, keywords), 2000);
	}

	public hasPlugins(): boolean {
		return !!(this.plugins && this.plugins.length);
	}

	public async getAllPlugins(): Promise<IBasicPluginInformation[]> {
		return this.plugins;
	}

	public abstract getPlugins(page: number, count: number): Promise<IBasicPluginInformation[]>;

	protected abstract initializeCore(projectDir: string, keywords: string[]): Promise<void>;
}
