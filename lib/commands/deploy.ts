import {
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
} from "../constants";
import { ValidatePlatformCommandBase } from "./command-base";
import { DeployCommandHelper } from "../helpers/deploy-command-helper";
import { hasValidAndroidSigning } from "../common/helpers";
import { IProjectData } from "../definitions/project";
import { IPlatformValidationService, IOptions } from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IMigrateController } from "../definitions/migrate";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { OptionType, IErrors } from "../common/declarations";
import { injector } from "../common/yok";

export class DeployOnDeviceCommand
	extends ValidatePlatformCommandBase
	implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	public dashedOptions = {
		watch: {
			type: OptionType.Boolean,
			default: false,
			hasSensitiveValue: false,
		},
		hmr: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
	};

	constructor(
		$platformValidationService: IPlatformValidationService,
		private $platformCommandParameter: ICommandParameter,
		$options: IOptions,
		$projectData: IProjectData,
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		$platformsDataService: IPlatformsDataService,
		private $deployCommandHelper: DeployCommandHelper,
		private $migrateController: IMigrateController
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

		await this.$deployCommandHelper.deploy(platform);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = args[0];
		if (!this.$options.force) {
			await this.$migrateController.validate({
				projectDir: this.$projectData.projectDir,
				platforms: [platform],
			});
		}

		if (!args || !args.length || args.length > 1) {
			return false;
		}

		if (!(await this.$platformCommandParameter.validate(platform))) {
			return false;
		}

		if (
			this.$mobileHelper.isAndroidPlatform(platform) &&
			(this.$options.release || this.$options.aab) &&
			!hasValidAndroidSigning(this.$options)
		) {
			if (this.$options.release) {
				this.$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			} else {
				this.$errors.failWithHelp(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		const result = await super.canExecuteCommandBase(platform, {
			validateOptions: true,
		});
		return result;
	}
}

injector.registerCommand("deploy", DeployOnDeviceCommand);
