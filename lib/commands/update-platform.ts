export class UpdatePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $options: IOptions,
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $errors: IErrors) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.updatePlatforms(args, this.$options.platformTemplate, this.$projectData, { provision: this.$options.provision, sdk: this.$options.sdk });
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify platforms to update.");
		}

		_.each(args, arg => this.$platformService.validatePlatform(arg.split("@")[0], this.$projectData));

		return true;
	}
}

$injector.registerCommand("platform|update", UpdatePlatformCommand);
