export class UpdatePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $options: IOptions,
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $errors: IErrors,
		private $platformsData: IPlatformsData) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.updatePlatforms(args, this.$options.platformTemplate, this.$projectData, this.$options);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify platforms to update.");
		}

		for (const arg of args) {
			const platform = arg.split("@")[0];
			this.$platformService.validatePlatform(platform, this.$projectData);
			const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
			const platformProjectService = platformData.platformProjectService;
			await platformProjectService.validate(this.$projectData);
		}

		return true;
	}
}

$injector.registerCommand("platform|update", UpdatePlatformCommand);
