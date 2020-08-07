import { ValidatePlatformCommandBase } from "./command-base";
import { PrepareController } from "../controllers/prepare-controller";
import { PrepareDataService } from "../services/prepare-data-service";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IProjectData } from "../definitions/project";
import { OptionType } from "../common/declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IMigrateController } from "../definitions/migrate";

import { ICommand, ICommandParameter } from "../common/definitions/commands";

export class PrepareCommand extends ValidatePlatformCommandBase implements ICommand {
	public allowedParameters = [this.$platformCommandParameter];

	public dashedOptions = {
		watch: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
		hmr: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
	};

	constructor($options: IOptions,
		private $prepareController: PrepareController,
		$platformValidationService: IPlatformValidationService,
		$projectData: IProjectData,
		private $platformCommandParameter: ICommandParameter,
		$platformsDataService: IPlatformsDataService,
		private $prepareDataService: PrepareDataService,
		private $migrateController: IMigrateController,
		private $markingModeService: IMarkingModeService,
		private $mobileHelper: Mobile.IMobileHelper) {
		super($options, $platformsDataService, $platformValidationService, $projectData);
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0];
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			await this.$markingModeService.handleMarkingModeFullDeprecation({ projectDir: this.$projectData.projectDir, skipWarnings: true });
		}

		const prepareData = this.$prepareDataService.getPrepareData(this.$projectData.projectDir, platform, this.$options);
		await this.$prepareController.prepare(prepareData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = args[0];
		const result = await this.$platformCommandParameter.validate(platform) &&
			await this.$platformValidationService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, platform);

		if (!this.$options.force) {
			await this.$migrateController.validate({ projectDir: this.$projectData.projectDir, platforms: [platform] });
		}

		if (!result) {
			return false;
		}

		const canExecuteOutput = await super.canExecuteCommandBase(platform);
		return canExecuteOutput;
	}
}

$injector.registerCommand("prepare", PrepareCommand);
