export class RemovePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $errors: IErrors) {
			this.$projectData.initializeProjectData();
		}

	public execute(args: string[]): Promise<void> {
		return this.$platformService.removePlatforms(args, this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to remove");
		}

		_.each(args, arg => this.$platformService.validatePlatformInstalled(arg, this.$projectData));

		return true;
	}
}

$injector.registerCommand("platform|remove", RemovePlatformCommand);
