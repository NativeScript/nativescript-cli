export class RemovePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $platformsData: IPlatformsData) {
		this.$projectData.initializeProjectData();
	}

	public execute(args: string[]): Promise<void> {
		return this.$platformService.removePlatforms(args, this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to remove");
		}

		for (const platform of args) {
			this.$platformService.validatePlatformInstalled(platform, this.$projectData);
			const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
			const platformProjectService = platformData.platformProjectService;
			await platformProjectService.validate(this.$projectData);
		}

		return true;
	}
}

$injector.registerCommand("platform|remove", RemovePlatformCommand);
