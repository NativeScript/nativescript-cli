import { ERROR_NO_VALID_SUBCOMMAND_FORMAT } from "../common/constants";
import { IErrors, IHostInfo } from "../common/declarations";
import { cache } from "../common/decorators";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import {
	IKeyCommandHelper,
	IKeyCommandPlatform,
} from "../common/definitions/key-commands";
import { IInjector } from "../common/definitions/yok";
import { hasValidAndroidSigning } from "../common/helpers";
import { injector } from "../common/yok";
import {
	ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE,
	ANDROID_RELEASE_BUILD_ERROR_MESSAGE,
} from "../constants";
import { IOptions, IPlatformValidationService } from "../declarations";
import { IMigrateController } from "../definitions/migrate";
import { IProjectData, IProjectDataService } from "../definitions/project";

export class RunCommandBase implements ICommand {
	private liveSyncCommandHelperAdditionalOptions: ILiveSyncCommandHelperAdditionalOptions =
		<ILiveSyncCommandHelperAdditionalOptions>{};

	public platform: string;
	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper,
		private $migrateController: IMigrateController,
		private $options: IOptions,
		private $projectData: IProjectData,
		private $keyCommandHelper: IKeyCommandHelper
	) {}

	public allowedParameters: ICommandParameter[] = [];
	public async execute(args: string[]): Promise<void> {
		await this.$liveSyncCommandHelper.executeCommandLiveSync(
			this.platform,
			this.liveSyncCommandHelperAdditionalOptions
		);

		if (process.env.NS_IS_INTERACTIVE) {
			this.$keyCommandHelper.attachKeyCommands(
				this.platform as IKeyCommandPlatform,
				"run"
			);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length) {
			this.$errors.failWithHelp(ERROR_NO_VALID_SUBCOMMAND_FORMAT, "run");
		}

		this.platform = args[0] || this.platform;
		if (!this.platform && !this.$hostInfo.isDarwin) {
			this.platform = this.$devicePlatformsConstants.Android;
		}

		this.$projectData.initializeProjectData();
		const platforms = this.platform
			? [this.platform]
			: [
					this.$devicePlatformsConstants.Android,
					this.$devicePlatformsConstants.iOS,
			  ];

		if (!this.$options.force) {
			await this.$migrateController.validate({
				projectDir: this.$projectData.projectDir,
				platforms,
			});
		}

		await this.$liveSyncCommandHelper.validatePlatform(this.platform);

		return true;
	}
}

injector.registerCommand("run|*all", RunCommandBase);

export class RunIosCommand implements ICommand {
	@cache()
	private get runCommand(): RunCommandBase {
		const runCommand = this.$injector.resolve<RunCommandBase>(RunCommandBase);
		runCommand.platform = this.platform;
		return runCommand;
	}

	public allowedParameters: ICommandParameter[] = [];
	public get platform(): string {
		return this.$devicePlatformsConstants.iOS;
	}

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $injector: IInjector,
		private $options: IOptions,
		private $platformValidationService: IPlatformValidationService,
		private $projectDataService: IProjectDataService
	) {}

	public async execute(args: string[]): Promise<void> {
		return this.runCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData();

		if (
			!this.$platformValidationService.isPlatformSupportedForOS(
				this.$devicePlatformsConstants.iOS,
				projectData
			)
		) {
			this.$errors.fail(
				`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`
			);
		}

		const result =
			(await this.runCommand.canExecute(args)) &&
			(await this.$platformValidationService.validateOptions(
				this.$options.provision,
				this.$options.teamId,
				projectData,
				this.$devicePlatformsConstants.iOS.toLowerCase()
			));
		return result;
	}
}

injector.registerCommand("run|ios", RunIosCommand);

export class RunAndroidCommand implements ICommand {
	@cache()
	private get runCommand(): RunCommandBase {
		const runCommand = this.$injector.resolve<RunCommandBase>(RunCommandBase);
		runCommand.platform = this.platform;
		return runCommand;
	}

	public allowedParameters: ICommandParameter[] = [];
	public get platform(): string {
		return this.$devicePlatformsConstants.Android;
	}

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $injector: IInjector,
		private $options: IOptions,
		private $platformValidationService: IPlatformValidationService,
		private $projectData: IProjectData
	) {}

	public async execute(args: string[]): Promise<void> {
		return this.runCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.runCommand.canExecute(args);

		if (
			!this.$platformValidationService.isPlatformSupportedForOS(
				this.$devicePlatformsConstants.Android,
				this.$projectData
			)
		) {
			this.$errors.fail(
				`Applications for platform ${this.$devicePlatformsConstants.Android} can not be built on this OS`
			);
		}

		if (
			(this.$options.release || this.$options.aab) &&
			!hasValidAndroidSigning(this.$options)
		) {
			if (this.$options.release) {
				this.$errors.failWithHelp(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
			} else {
				this.$errors.failWithHelp(ANDROID_APP_BUNDLE_SIGNING_ERROR_MESSAGE);
			}
		}

		return this.$platformValidationService.validateOptions(
			this.$options.provision,
			this.$options.teamId,
			this.$projectData,
			this.$devicePlatformsConstants.Android.toLowerCase()
		);
	}
}

injector.registerCommand("run|android", RunAndroidCommand);
