export class CleanCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $options: IOptions,
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $errors: IErrors,
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$platformService.cleanPlatforms(args, this.$options.platformTemplate, this.$projectData, this.$options);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.fail("No platform specified. Please specify a platform to clean");
		}

		_.each(args, platform => {
			this.$platformService.validatePlatform(platform, this.$projectData);
		});

		for (const platform of args) {
			this.$platformService.validatePlatformInstalled(platform, this.$projectData);

			const currentRuntimeVersion = this.$platformService.getCurrentPlatformVersion(platform, this.$projectData);
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
