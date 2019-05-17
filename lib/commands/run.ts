import { ERROR_NO_VALID_SUBCOMMAND_FORMAT } from "../common/constants";
import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { cache } from "../common/decorators";

export class RunCommandBase implements ICommand {
	private liveSyncCommandHelperAdditionalOptions: ILiveSyncCommandHelperAdditionalOptions = <ILiveSyncCommandHelperAdditionalOptions>{};

	public platform: string;
	constructor(
		private $analyticsService: IAnalyticsService,
		private $androidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper,
		private $projectData: IProjectData,
	) { }

	public allowedParameters: ICommandParameter[] = [];
	public async execute(args: string[]): Promise<void> {
		await this.$analyticsService.trackPreviewAppData(this.platform, this.$projectData.projectDir);
		return this.$liveSyncCommandHelper.executeCommandLiveSync(this.platform, this.liveSyncCommandHelperAdditionalOptions);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length) {
			this.$errors.fail(ERROR_NO_VALID_SUBCOMMAND_FORMAT, "run");
		}

		this.$androidBundleValidatorHelper.validateNoAab();

		this.$projectData.initializeProjectData();
		this.platform = args[0] || this.platform;

		if (!this.platform && !this.$hostInfo.isDarwin) {
			this.platform = this.$devicePlatformsConstants.Android;
		}

		const validatePlatformOutput = await this.$liveSyncCommandHelper.validatePlatform(this.platform);

		if (this.platform && validatePlatformOutput && validatePlatformOutput[this.platform.toLowerCase()]) {
			const checkEnvironmentRequirementsOutput = validatePlatformOutput[this.platform.toLowerCase()].checkEnvironmentRequirementsOutput;
			this.liveSyncCommandHelperAdditionalOptions.syncToPreviewApp = checkEnvironmentRequirementsOutput && checkEnvironmentRequirementsOutput.selectedOption === "Sync to Playground";
		}
		return true;
	}
}

$injector.registerCommand("run|*all", RunCommandBase);

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
		private $projectDataService: IProjectDataService,
	) {
	}

	public async execute(args: string[]): Promise<void> {
		return this.runCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData();

		if (!this.$platformValidationService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		const result = await this.runCommand.canExecute(args) && await this.$platformValidationService.validateOptions(this.$options.provision, this.$options.teamId, projectData, this.$devicePlatformsConstants.iOS.toLowerCase());
		return result;
	}
}

$injector.registerCommand("run|ios", RunIosCommand);

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
		private $projectData: IProjectData,
	) { }

	public execute(args: string[]): Promise<void> {
		return this.runCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.runCommand.canExecute(args);

		if (!this.$platformValidationService.isPlatformSupportedForOS(this.$devicePlatformsConstants.Android, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.Android} can not be built on this OS`);
		}

		if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
		}

		return this.$platformValidationService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, this.$devicePlatformsConstants.Android.toLowerCase());
	}
}

$injector.registerCommand("run|android", RunAndroidCommand);
