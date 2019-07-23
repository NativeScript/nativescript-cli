export class RemovePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $errors: IErrors,
		private $platformCommandHelper: IPlatformCommandHelper,
		private $platformValidationService: IPlatformValidationService,
		private $projectData: IProjectData
	) {
		this.$projectData.initializeProjectData();
	}

	public execute(args: string[]): Promise<void> {
		return this.$platformCommandHelper.removePlatforms(args, this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.failWithHelp("No platform specified. Please specify a platform to remove.");
		}

		_.each(args, platform => {
			this.$platformValidationService.validatePlatform(platform, this.$projectData);
		});

		return true;
	}
}

$injector.registerCommand("platform|remove", RemovePlatformCommand);
