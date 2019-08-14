export class CleanCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $errors: IErrors,
		private $options: IOptions,
		private $platformCommandHelper: IPlatformCommandHelper,
		private $platformValidationService: IPlatformValidationService,
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		private $projectData: IProjectData
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$platformCommandHelper.cleanPlatforms(args, this.$projectData, this.$options.frameworkPath);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.failWithHelp("No platform specified. Please specify a platform to clean.");
		}

		_.each(args, platform => {
			this.$platformValidationService.validatePlatform(platform, this.$projectData);
		});

		for (const platform of args) {
			this.$platformValidationService.validatePlatformInstalled(platform, this.$projectData);

			const currentRuntimeVersion = this.$platformCommandHelper.getCurrentPlatformVersion(platform, this.$projectData);
			await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
				platform,
				projectDir: this.$projectData.projectDir,
				runtimeVersion: currentRuntimeVersion,
				options: this.$options
			});
		}

		return true;
	}
}

$injector.registerCommand("platform|clean", CleanCommand);
