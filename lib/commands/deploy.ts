import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { CommandBase } from "./command-base";

export class DeployOnDeviceCommand extends CommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter,
		$options: IOptions,
		$projectData: IProjectData,
		private $deployCommandHelper: IDeployCommandHelper,
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		$platformsData: IPlatformsData,
		private $bundleValidatorHelper: IBundleValidatorHelper) {
			super($options, $platformsData, $platformService, $projectData);
			this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const deployPlatformInfo = this.$deployCommandHelper.getDeployPlatformInfo(args[0]);

		return this.$platformService.deployPlatform(deployPlatformInfo);
	}

	public async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		this.$bundleValidatorHelper.validate();
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
