import { ValidatePlatformCommandBase } from "./command-base";
import { BundleWorkflowService } from "../services/bundle-workflow-service";

export class PrepareCommand extends ValidatePlatformCommandBase implements ICommand {
	public allowedParameters = [this.$platformCommandParameter];

	constructor($options: IOptions,
		private $bundleWorkflowService: BundleWorkflowService,
		$platformValidationService: IPlatformValidationService,
		$projectData: IProjectData,
		private $platformCommandParameter: ICommandParameter,
		$platformsData: IPlatformsData) {
			super($options, $platformsData, $platformValidationService, $projectData);
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0];

		await this.$bundleWorkflowService.preparePlatform(platform, this.$projectData.projectDir, this.$options);
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
