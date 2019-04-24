import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE, AndroidAppBundleMessages } from "../constants";
import { ValidatePlatformCommandBase } from "./command-base";

export abstract class BuildCommandBase extends ValidatePlatformCommandBase {
	constructor($options: IOptions,
		protected $errors: IErrors,
		$projectData: IProjectData,
		$platformsData: IPlatformsData,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$platformService: IPlatformService,
		private $bundleValidatorHelper: IBundleValidatorHelper,
		protected $logger: ILogger,
		protected $workflowService: IWorkflowService) {
		super($options, $platformsData, $platformService, $projectData);
		this.$projectData.initializeProjectData();
	}

	public async executeCore(args: string[]): Promise<string> {
		await this.$workflowService.handleLegacyWorkflow({ projectDir: this.$projectData.projectDir, settings: this.$options, skipWarnings: true });
		const platform = args[0].toLowerCase();
		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
			bundle: !!this.$options.bundle,
			release: this.$options.release,
			useHotModuleReload: this.$options.hmr
		};
		const platformInfo: IPreparePlatformInfo = {
			platform,
			appFilesUpdaterOptions,
			platformTemplate: this.$options.platformTemplate,
			projectData: this.$projectData,
			config: this.$options,
			env: this.$options.env
		};

		await this.$platformService.preparePlatform(platformInfo);
		const buildConfig: IBuildConfig = {
			buildForDevice: this.$options.forDevice,
			iCloudContainerEnvironment: this.$options.iCloudContainerEnvironment,
			projectDir: this.$options.path,
			clean: this.$options.clean,
			teamId: this.$options.teamId,
			device: this.$options.device,
			provision: this.$options.provision,
			release: this.$options.release,
			keyStoreAlias: this.$options.keyStoreAlias,
			keyStorePath: this.$options.keyStorePath,
			keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
			keyStorePassword: this.$options.keyStorePassword,
			androidBundle: this.$options.aab
		};

		const outputPath = await this.$platformService.buildPlatform(platform, buildConfig, this.$projectData);

		if (this.$options.copyTo) {
			this.$platformService.copyLastOutput(platform, this.$options.copyTo, buildConfig, this.$projectData);
		} else {
			this.$logger.info(`The build result is located at: ${outputPath}`);
		}

		return outputPath;
	}

	protected validatePlatform(platform: string): void {
		if (!this.$platformService.isPlatformSupportedForOS(platform, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${platform} can not be built on this OS`);
		}

		this.$bundleValidatorHelper.validate(this.$projectData);
	}

	protected async validateArgs(args: string[], platform: string): Promise<ICanExecuteCommandOutput> {
		const canExecute = await this.validateArgsCore(args, platform);
		return {
			canExecute,
			suppressCommandHelp: false
		};
	}

	private async validateArgsCore(args: string[], platform: string): Promise<boolean> {
		if (args.length !== 0) {
			return false;
		}

		const result = await this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, platform);
		return result;
	}
}

export class BuildIosCommand extends BuildCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $options: IOptions,
		$errors: IErrors,
		$projectData: IProjectData,
		$platformsData: IPlatformsData,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$platformService: IPlatformService,
		$bundleValidatorHelper: IBundleValidatorHelper,
		$logger: ILogger,
		$workflowService: IWorkflowService) {
		super($options, $errors, $projectData, $platformsData, $devicePlatformsConstants, $platformService, $bundleValidatorHelper, $logger, $workflowService);
	}

	public async execute(args: string[]): Promise<void> {
		await this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}

	public async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		const platform = this.$devicePlatformsConstants.iOS;

		super.validatePlatform(platform);

		let result = await super.canExecuteCommandBase(platform, { notConfiguredEnvOptions: { hideSyncToPreviewAppOption: true } });
		if (result.canExecute) {
			result = await super.validateArgs(args, platform);
		}

		return result;
	}
}

$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildAndroidCommand extends BuildCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $options: IOptions,
		protected $errors: IErrors,
		$projectData: IProjectData,
		$platformsData: IPlatformsData,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$platformService: IPlatformService,
		$bundleValidatorHelper: IBundleValidatorHelper,
		protected $androidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		protected $logger: ILogger,
		$workflowService: IWorkflowService) {
		super($options, $errors, $projectData, $platformsData, $devicePlatformsConstants, $platformService, $bundleValidatorHelper, $logger, $workflowService);
	}

	public async execute(args: string[]): Promise<void> {
		await this.executeCore([this.$platformsData.availablePlatforms.Android]);

		if (this.$options.aab) {
			this.$logger.info(AndroidAppBundleMessages.ANDROID_APP_BUNDLE_DOCS_MESSAGE);

			if (this.$options.release) {
				this.$logger.info(AndroidAppBundleMessages.ANDROID_APP_BUNDLE_PUBLISH_DOCS_MESSAGE);
			}
		}
	}

	public async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		const platform = this.$devicePlatformsConstants.Android;
		super.validatePlatform(platform);
		this.$androidBundleValidatorHelper.validateRuntimeVersion(this.$projectData);
		let result = await super.canExecuteCommandBase(platform, { notConfiguredEnvOptions: { hideSyncToPreviewAppOption: true } });
		if (result.canExecute) {
			if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
				this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			}

			result = await super.validateArgs(args, platform);
		}

		return result;
	}
}

$injector.registerCommand("build|android", BuildAndroidCommand);
