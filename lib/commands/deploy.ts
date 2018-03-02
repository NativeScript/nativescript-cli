import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";

export class DeployOnDeviceCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter,
		private $options: IOptions,
		private $projectData: IProjectData,
		private $deployCommandHelper: IDeployCommandHelper,
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsData: IPlatformsData,
		private $bundleValidatorHelper: IBundleValidatorHelper) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const deployPlatformInfo = this.$deployCommandHelper.getDeployPlatformInfo(args[0]);

		return this.$platformService.deployPlatform(deployPlatformInfo);
	}

	public async canExecute(args: string[]): Promise<boolean> {
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

		const platformData = this.$platformsData.getPlatformData(args[0], this.$projectData);
		const platformProjectService = platformData.platformProjectService;
		await platformProjectService.validate(this.$projectData);

		return this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, args[0]);
	}
}

$injector.registerCommand("deploy", DeployOnDeviceCommand);
