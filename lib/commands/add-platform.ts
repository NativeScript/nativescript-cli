export class AddPlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $options: IOptions,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $platformsData: IPlatformsData,
		private $errors: IErrors) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.addPlatforms(args, this.$options.platformTemplate, this.$projectData, this.$options, this.$options.frameworkPath);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to add");
		}

		for (const arg of args) {
			this.$platformService.validatePlatform(arg, this.$projectData);
			const platformData = this.$platformsData.getPlatformData(arg, this.$projectData);
			const platformProjectService = platformData.platformProjectService;
			await platformProjectService.validate(this.$projectData);
		}

		return true;
	}
}

$injector.registerCommand("platform|add", AddPlatformCommand);
