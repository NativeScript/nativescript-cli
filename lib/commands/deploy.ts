import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { ValidatePlatformCommandBase } from "./command-base";
import { DeployCommandHelper } from "../helpers/deploy-command-helper";

export class DeployOnDeviceCommand extends ValidatePlatformCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	public dashedOptions = {
		watch: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
		hmr: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
	};

	constructor($platformValidationService: IPlatformValidationService,
		private $platformCommandParameter: ICommandParameter,
		$options: IOptions,
		$projectData: IProjectData,
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		$platformsDataService: IPlatformsDataService,
		private $bundleValidatorHelper: IBundleValidatorHelper,
		private $deployCommandHelper: DeployCommandHelper,
		private $androidBundleValidatorHelper: IAndroidBundleValidatorHelper) {
			super($options, $platformsDataService, $platformValidationService, $projectData);
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0].toLowerCase();
		await this.$deployCommandHelper.deploy(platform);
	}

	public async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		this.$androidBundleValidatorHelper.validateNoAab();
		this.$bundleValidatorHelper.validate(this.$projectData);
		if (!args || !args.length || args.length > 1) {
			return false;
		}

		if (!(await this.$platformCommandParameter.validate(args[0]))) {
			return false;
		}

		if (this.$mobileHelper.isAndroidPlatform(args[0]) && this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
		}

		const result = await super.canExecuteCommandBase(args[0], { validateOptions: true });
		return result;
	}
}

$injector.registerCommand("deploy", DeployOnDeviceCommand);
