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
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: !!this.$options.bundle, release: this.$options.release };
		const platformInfo: IPreparePlatformInfo = {
			platform: args[0],
			appFilesUpdaterOptions,
			skipModulesNativeCheck: !this.$options.syncAllFiles,
			platformTemplate: this.$options.platformTemplate,
			projectData: this.$projectData,
			config: this.$options,
			env: this.$options.env
		};

		await this.$platformService.preparePlatform(platformInfo);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = args[0];
		const result = await this.$platformCommandParameter.validate(platform) && await this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, platform);
		if (result) {
			const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
			const platformProjectService = platformData.platformProjectService;
			await platformProjectService.validate(this.$projectData);
		}

		return result;
	}
}

$injector.registerCommand("prepare", PrepareCommand);
