import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE, AndroidAppBundleMessages } from "../constants";
import { ValidatePlatformCommandBase } from "./command-base";

export abstract class BuildCommandBase extends ValidatePlatformCommandBase {
	constructor($options: IOptions,
		protected $errors: IErrors,
		$projectData: IProjectData,
		$platformsDataService: IPlatformsDataService,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $buildController: IBuildController,
		$platformValidationService: IPlatformValidationService,
		private $buildDataService: IBuildDataService,
		protected $logger: ILogger) {
		super($options, $platformsDataService, $platformValidationService, $projectData);
		this.$projectData.initializeProjectData();
	}

	public dashedOptions = {
		watch: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
		hmr: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
	};

	public async executeCore(args: string[]): Promise<string> {
		const platform = args[0].toLowerCase();
		const buildData = this.$buildDataService.getBuildData(this.$projectData.projectDir, platform, this.$options);
		const outputPath = await this.$buildController.prepareAndBuild(buildData);

		return outputPath;
	}

	protected validatePlatform(platform: string): void {
		if (!this.$platformValidationService.isPlatformSupportedForOS(platform, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${platform} can not be built on this OS`);
		}
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

		const result = await this.$platformValidationService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, platform);
		return result;
	}
}

export class BuildIosCommand extends BuildCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(protected $options: IOptions,
		$errors: IErrors,
		$projectData: IProjectData,
		$platformsDataService: IPlatformsDataService,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$buildController: IBuildController,
		$platformValidationService: IPlatformValidationService,
		$logger: ILogger,
		$buildDataService: IBuildDataService,
		private $migrateController: IMigrateController) {
		super($options, $errors, $projectData, $platformsDataService, $devicePlatformsConstants, $buildController, $platformValidationService, $buildDataService, $logger);
	}

	public async execute(args: string[]): Promise<void> {
		await this.executeCore([this.$devicePlatformsConstants.iOS.toLowerCase()]);
	}

	public async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		const platform = this.$devicePlatformsConstants.iOS;
		if (!this.$options.force) {
			await this.$migrateController.validate({ projectDir: this.$projectData.projectDir, platforms: [platform] });
		}

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
		platformsDataService: IPlatformsDataService,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$buildController: IBuildController,
		$platformValidationService: IPlatformValidationService,
		protected $androidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		$buildDataService: IBuildDataService,
		protected $logger: ILogger,
		private $migrateController: IMigrateController) {
		super($options, $errors, $projectData, platformsDataService, $devicePlatformsConstants, $buildController, $platformValidationService, $buildDataService, $logger);
	}

	public async execute(args: string[]): Promise<void> {
		await this.executeCore([this.$devicePlatformsConstants.Android.toLowerCase()]);

		if (this.$options.aab) {
			this.$logger.info(AndroidAppBundleMessages.ANDROID_APP_BUNDLE_DOCS_MESSAGE);

			if (this.$options.release) {
				this.$logger.info(AndroidAppBundleMessages.ANDROID_APP_BUNDLE_PUBLISH_DOCS_MESSAGE);
			}
		}
	}

	public async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		const platform = this.$devicePlatformsConstants.Android;
		if (!this.$options.force) {
			await this.$migrateController.validate({ projectDir: this.$projectData.projectDir, platforms: [platform] });
		}
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
