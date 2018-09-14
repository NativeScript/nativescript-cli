export abstract class ValidatePlatformCommandBase {
	constructor(protected $options: IOptions,
		protected $platformsData: IPlatformsData,
		protected $platformService: IPlatformService,
		protected $projectData: IProjectData) { }

	abstract allowedParameters: ICommandParameter[];
	abstract execute(args: string[]): Promise<void>;

	public async canExecuteCommandBase(platform: string, options?: ICanExecuteCommandOptions): Promise<ICanExecuteCommandOutput> {
		options = options || {};
		const validatePlatformOutput = await this.validatePlatformBase(platform, options.notConfiguredEnvOptions);
		const canExecute = this.canExecuteCommand(validatePlatformOutput);
		let result = { canExecute, suppressCommandHelp: !canExecute };

		if (canExecute && options.validateOptions) {
			const validateOptionsOutput = await this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, platform);
			result = { canExecute: validateOptionsOutput, suppressCommandHelp: false };
		}

		return result;
	}

	private async validatePlatformBase(platform: string, notConfiguredEnvOptions: INotConfiguredEnvOptions): Promise<IValidatePlatformOutput> {
		const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
		const platformProjectService = platformData.platformProjectService;
		const result = await platformProjectService.validate(this.$projectData, this.$options, notConfiguredEnvOptions);
		return result;
	}

	private canExecuteCommand(validatePlatformOutput: IValidatePlatformOutput): boolean {
		return validatePlatformOutput && validatePlatformOutput.checkEnvironmentRequirementsOutput && validatePlatformOutput.checkEnvironmentRequirementsOutput.canExecute;
	}
}
