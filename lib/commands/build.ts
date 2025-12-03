import {
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
	AndroidAppBundleMessages,
} from "../constants";
import { ValidatePlatformCommandBase } from "./command-base";
import { hasValidAndroidSigning } from "../common/helpers";
import { IProjectData } from "../definitions/project";
import {
	IOptions,
	IPlatformValidationService,
	IAndroidBundleValidatorHelper,
} from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IBuildController, IBuildDataService } from "../definitions/build";
import { IMigrateController } from "../definitions/migrate";
import { IErrors, OptionType } from "../common/declarations";
import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { injector } from "../common/yok";

export abstract class BuildCommandBase extends ValidatePlatformCommandBase {
	constructor(
		$options: IOptions,
		protected $errors: IErrors,
		$projectData: IProjectData,
		$platformsDataService: IPlatformsDataService,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $buildController: IBuildController,
		$platformValidationService: IPlatformValidationService,
		private $buildDataService: IBuildDataService,
		protected $logger: ILogger,
	) {
		super(
			$options,
			$platformsDataService,
			$platformValidationService,
			$projectData,
		);
		this.$projectData.initializeProjectData();
	}

	public dashedOptions = {
		watch: {
			type: OptionType.Boolean,
			default: false,
			hasSensitiveValue: false,
		},
		hmr: { type: OptionType.Boolean, default: false, hasSensitiveValue: false },
	};

	public async executeCore(args: string[]): Promise<string> {
		const platform = args[0].toLowerCase();
		const buildData = this.$buildDataService.getBuildData(
			this.$projectData.projectDir,
			platform,
			{
				...this.$options.argv,
				// we disable buildFilterDevicesArch for build only to ensure we dont use it in production builds
				buildFilterDevicesArch: false,
			},
		);
		const outputPath = await this.$buildController.prepareAndBuild(buildData);

		return outputPath;
	}

	protected validatePlatform(platform: string): void {
		if (
			!this.$platformValidationService.isPlatformSupportedForOS(
				platform,
				this.$projectData,
			)
		) {
			this.$errors.fail(
				`Applications for platform ${platform} can not be built on this OS`,
			);
		}
	}

	protected async validateArgs(
		args: string[],
		platform: string,
	): Promise<boolean> {
		if (args.length !== 0) {
			this.$errors.failWithHelp(
				`The arguments '${args.join(
					" ",
				)}' are not valid for the current command.`,
			);
		}

		const result = await this.$platformValidationService.validateOptions(
			this.$options.provision,
			this.$options.teamId,
			this.$projectData,
			platform,
		);

		return result;
	}
}

export class BuildIosCommand extends BuildCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		protected $options: IOptions,
		$errors: IErrors,
		$projectData: IProjectData,
		$platformsDataService: IPlatformsDataService,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$buildController: IBuildController,
		$platformValidationService: IPlatformValidationService,
		$logger: ILogger,
		$buildDataService: IBuildDataService,
		protected $migrateController: IMigrateController,
	) {
		super(
			$options,
			$errors,
			$projectData,
			$platformsDataService,
			$devicePlatformsConstants,
			$buildController,
			$platformValidationService,
			$buildDataService,
			$logger,
		);
	}

	public async execute(args: string[]): Promise<void> {
		await this.executeCore([this.$devicePlatformsConstants.iOS.toLowerCase()]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = this.$devicePlatformsConstants.iOS;
		if (!this.$options.force) {
			await this.$migrateController.validate({
				projectDir: this.$projectData.projectDir,
				platforms: [platform],
			});
		}

		super.validatePlatform(platform);

		let canExecute = await super.canExecuteCommandBase(platform);
		if (canExecute) {
			canExecute = await super.validateArgs(args, platform);
		}

		return canExecute;
	}
}

injector.registerCommand("build|ios", BuildIosCommand);

export class BuildAndroidCommand extends BuildCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		protected $options: IOptions,
		protected $errors: IErrors,
		$projectData: IProjectData,
		platformsDataService: IPlatformsDataService,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$buildController: IBuildController,
		$platformValidationService: IPlatformValidationService,
		protected $androidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		$buildDataService: IBuildDataService,
		protected $logger: ILogger,
		private $migrateController: IMigrateController,
	) {
		super(
			$options,
			$errors,
			$projectData,
			platformsDataService,
			$devicePlatformsConstants,
			$buildController,
			$platformValidationService,
			$buildDataService,
			$logger,
		);
	}

	public async execute(args: string[]): Promise<void> {
		await this.executeCore([
			this.$devicePlatformsConstants.Android.toLowerCase(),
		]);

		if (this.$options.aab) {
			this.$logger.info(
				AndroidAppBundleMessages.ANDROID_APP_BUNDLE_DOCS_MESSAGE,
			);

			if (this.$options.release) {
				this.$logger.info(
					AndroidAppBundleMessages.ANDROID_APP_BUNDLE_PUBLISH_DOCS_MESSAGE,
				);
			}
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = this.$devicePlatformsConstants.Android;
		if (!this.$options.force) {
			await this.$migrateController.validate({
				projectDir: this.$projectData.projectDir,
				platforms: [platform],
			});
		}
		this.$androidBundleValidatorHelper.validateRuntimeVersion(
			this.$projectData,
		);
		let canExecute = await super.canExecuteCommandBase(platform);
		if (canExecute) {
			if (this.$options.release && !hasValidAndroidSigning(this.$options)) {
				this.$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			}

			canExecute = await super.validateArgs(args, platform);
		}

		return canExecute;
	}
}

injector.registerCommand("build|android", BuildAndroidCommand);

export class BuildVisionOsCommand extends BuildIosCommand implements ICommand {
	constructor(
		protected $options: IOptions,
		$errors: IErrors,
		$projectData: IProjectData,
		$platformsDataService: IPlatformsDataService,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$buildController: IBuildController,
		$platformValidationService: IPlatformValidationService,
		$logger: ILogger,
		$buildDataService: IBuildDataService,
		protected $migrateController: IMigrateController,
	) {
		super(
			$options,
			$errors,
			$projectData,
			$platformsDataService,
			$devicePlatformsConstants,
			$buildController,
			$platformValidationService,
			$logger,
			$buildDataService,
			$migrateController,
		);
	}

	public async execute(args: string[]): Promise<void> {
		await this.executeCore([
			this.$devicePlatformsConstants.visionOS.toLowerCase(),
		]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = this.$devicePlatformsConstants.visionOS;
		if (!this.$options.force) {
			await this.$migrateController.validate({
				projectDir: this.$projectData.projectDir,
				platforms: [platform],
			});
		}

		super.validatePlatform(platform);

		let canExecute = await super.canExecuteCommandBase(platform);
		if (canExecute) {
			canExecute = await super.validateArgs(args, platform);
		}

		return canExecute;
	}
}

injector.registerCommand("build|vision", BuildVisionOsCommand);
injector.registerCommand("build|visionos", BuildVisionOsCommand);
