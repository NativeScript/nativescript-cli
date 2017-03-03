export class PrepareCommand implements ICommand {
	public allowedParameters = [this.$platformCommandParameter];

	constructor(private $options: IOptions,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $platformCommandParameter: ICommandParameter) {
			this.$projectData.initializeProjectData();
		}

	public async execute(args: string[]): Promise<void> {
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		await this.$platformService.preparePlatform(args[0], appFilesUpdaterOptions, this.$options.platformTemplate, this.$projectData, this.$options.provision);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await this.$platformCommandParameter.validate(args[0]) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, args[0]);
	}
}

$injector.registerCommand("prepare", PrepareCommand);
