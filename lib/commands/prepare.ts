export class PrepareCommand implements ICommand {
	public allowedParameters = [this.$platformCommandParameter];

	constructor(private $options: IOptions,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $platformCommandParameter: ICommandParameter,
		private $platformsData: IPlatformsData) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		await this.$platformService.preparePlatform(args[0], appFilesUpdaterOptions, this.$options.platformTemplate, this.$projectData, this.$options);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = args[0];
		const result = await this.$platformCommandParameter.validate(platform) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, platform);
		const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
		const platformProjectService = platformData.platformProjectService;
		await platformProjectService.validate(this.$projectData);
		return result;
	}
}

$injector.registerCommand("prepare", PrepareCommand);
