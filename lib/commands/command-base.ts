import { IProjectData, IValidatePlatformOutput } from "../definitions/project";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import {
	ICommandParameter,
	ICanExecuteCommandOptions,
	INotConfiguredEnvOptions
} from "../common/definitions/commands";

export abstract class ValidatePlatformCommandBase {
	constructor(
		protected $options: IOptions,
		protected $platformsDataService: IPlatformsDataService,
		protected $platformValidationService: IPlatformValidationService,
		protected $projectData: IProjectData
	) {}

	abstract allowedParameters: ICommandParameter[];
	abstract execute(args: string[]): Promise<void>;

	public async canExecuteCommandBase(
		platform: string,
		options?: ICanExecuteCommandOptions
	): Promise<boolean> {
		options = options || {};
		const validatePlatformOutput = await this.validatePlatformBase(
			platform,
			options.notConfiguredEnvOptions
		);
		const canExecute = this.canExecuteCommand(validatePlatformOutput);
		let result = canExecute;

		if (canExecute && options.validateOptions) {
			result = await this.$platformValidationService.validateOptions(
				this.$options.provision,
				this.$options.teamId,
				this.$projectData,
				platform
			);
		}

		return result;
	}

	private async validatePlatformBase(
		platform: string,
		notConfiguredEnvOptions: INotConfiguredEnvOptions
	): Promise<IValidatePlatformOutput> {
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			this.$projectData
		);
		const platformProjectService = platformData.platformProjectService;
		const result = await platformProjectService.validate(
			this.$projectData,
			this.$options,
			notConfiguredEnvOptions
		);
		return result;
	}

	private canExecuteCommand(
		validatePlatformOutput: IValidatePlatformOutput
	): boolean {
		return (
			validatePlatformOutput &&
			validatePlatformOutput.checkEnvironmentRequirementsOutput &&
			validatePlatformOutput.checkEnvironmentRequirementsOutput.canExecute
		);
	}
}
