export class CleanCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $options: IOptions,
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $errors: IErrors) {
			this.$projectData.initializeProjectData();
		}

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.removePlatforms(args, this.$projectData);
		await this.$platformService.addPlatforms(args, this.$options.platformTemplate, this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to clean");
		}

		_.each(args, arg => this.$platformService.validatePlatform(arg, this.$projectData));

		return true;
	}
}

$injector.registerCommand("platform|clean", CleanCommand);
