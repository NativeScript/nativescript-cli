import { ValidatePlatformCommandBase } from "./command-base";

export class PrepareCommand extends ValidatePlatformCommandBase implements ICommand {
	public allowedParameters = [this.$platformCommandParameter];

	constructor($options: IOptions,
		private $platformWorkflowDataFactory: IPlatformWorkflowDataFactory,
		private $platformWorkflowService: IPlatformWorkflowService,
		$platformValidationService: IPlatformValidationService,
		$projectData: IProjectData,
		private $platformCommandParameter: ICommandParameter,
		$platformsData: IPlatformsData) {
			super($options, $platformsData, $platformValidationService, $projectData);
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0];
		const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
		const workflowData = this.$platformWorkflowDataFactory.createPlatformWorkflowData(platform, this.$options);

		await this.$platformWorkflowService.preparePlatform(platformData, this.$projectData, workflowData);
	}

	public async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		const platform = args[0];
		const result = await this.$platformCommandParameter.validate(platform) &&
			await this.$platformValidationService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, platform);
		if (!result) {
			return false;
		}

		const canExecuteOutput = await super.canExecuteCommandBase(platform);
		return canExecuteOutput;
	}
}

$injector.registerCommand("prepare", PrepareCommand);
