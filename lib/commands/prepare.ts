import { ValidatePlatformCommandBase } from "./command-base";
import { PrepareController } from "../controllers/prepare-controller";
import { PrepareDataService } from "../services/prepare-data-service";
import { IProjectData } from "../definitions/project";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IMigrateController } from "../definitions/migrate";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { OptionType } from "../common/declarations";
import { injector } from "../common/yok";

export class PrepareCommand
	extends ValidatePlatformCommandBase
	implements ICommand
{
	public allowedParameters = [this.$platformCommandParameter];

	public dashedOptions = {
		watch: {
			type: OptionType.Boolean,
			default: false,
			hasSensitiveValue: false
		},
		hmr: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },

		whatever: {
			type: OptionType.Boolean,
			default: false,
			hasSensitiveValue: false
		}
	};

	constructor(
		public $options: IOptions,
		public $prepareController: PrepareController,
		public $platformValidationService: IPlatformValidationService,
		public $projectData: IProjectData,
		public $platformCommandParameter: ICommandParameter,
		public $platformsDataService: IPlatformsDataService,
		public $prepareDataService: PrepareDataService,
		public $migrateController: IMigrateController
	) {
		super(
			$options,
			$platformsDataService,
			$platformValidationService,
			$projectData
		);
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0];

		const prepareData = this.$prepareDataService.getPrepareData(
			this.$projectData.projectDir,
			platform,
			this.$options
		);
		await this.$prepareController.prepare(prepareData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = args[0];
		const result =
			(await this.$platformCommandParameter.validate(platform)) &&
			(await this.$platformValidationService.validateOptions(
				this.$options.provision,
				this.$options.teamId,
				this.$projectData,
				platform
			));

		if (!this.$options.force) {
			await this.$migrateController.validate({
				projectDir: this.$projectData.projectDir,
				platforms: [platform]
			});
		}

		if (!result) {
			return false;
		}

		const canExecuteOutput = await super.canExecuteCommandBase(platform);
		return canExecuteOutput;
	}
}

injector.registerCommand("prepare", PrepareCommand);
