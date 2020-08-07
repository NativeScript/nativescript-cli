export class UpdatePlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $errors: IErrors,
		private $options: IOptions,
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		private $platformCommandHelper: IPlatformCommandHelper,
		private $platformValidationService: IPlatformValidationService,
		private $projectData: IProjectData,
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		await this.$platformCommandHelper.updatePlatforms(args, this.$projectData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args || args.length === 0) {
			this.$errors.failWithHelp("No platform specified. Please specify platforms to update.");
		}

		_.each(args, arg => {
			const platform = arg.split("@")[0];
			this.$platformValidationService.validatePlatform(platform, this.$projectData);
		});

		for (const arg of args) {
			const [platform, versionToBeInstalled] = arg.split("@");
			const checkEnvironmentRequirementsInput: ICheckEnvironmentRequirementsInput = { platform, options: this.$options };
			// If version is not specified, we know the command will install the latest compatible Android runtime.
			// The latest compatible Android runtime supports Java version, so we do not need to pass it here.
			// Passing projectDir to the nativescript-doctor validation will cause it to check the runtime from the current package.json
			// So in this case, where we do not want to validate the runtime, just do not pass both projectDir and runtimeVersion.
			if (versionToBeInstalled) {
				checkEnvironmentRequirementsInput.projectDir = this.$projectData.projectDir;
				checkEnvironmentRequirementsInput.runtimeVersion = versionToBeInstalled;
			}

			await this.$platformEnvironmentRequirements.checkEnvironmentRequirements(checkEnvironmentRequirementsInput);
		}

		return true;
	}
}

$injector.registerCommand("platform|update", UpdatePlatformCommand);
