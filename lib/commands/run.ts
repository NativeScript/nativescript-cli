import { ERROR_NO_VALID_SUBCOMMAND_FORMAT } from "../common/constants";
import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { cache } from "../common/decorators";

export class RunCommandBase implements ICommand {
	private liveSyncCommandHelperAdditionalOptions: ILiveSyncCommandHelperAdditionalOptions = <ILiveSyncCommandHelperAdditionalOptions>{};

	public platform: string;
	constructor(private $projectData: IProjectData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper) { }

	public allowedParameters: ICommandParameter[] = [];
	public async execute(args: string[]): Promise<void> {
		return this.$liveSyncCommandHelper.executeCommandLiveSync(this.platform, this.liveSyncCommandHelperAdditionalOptions);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length) {
			this.$errors.fail(ERROR_NO_VALID_SUBCOMMAND_FORMAT, "run");
		}

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

	constructor(private $platformsData: IPlatformsData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $injector: IInjector,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $options: IOptions) {
	}

	public async execute(args: string[]): Promise<void> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		return this.runCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const result = await this.runCommand.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, this.$platformsData.availablePlatforms.iOS);
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

	constructor(private $platformsData: IPlatformsData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $injector: IInjector,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $options: IOptions) { }

	public execute(args: string[]): Promise<void> {
		return this.runCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.runCommand.canExecute(args);

		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.Android, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.Android} can not be built on this OS`);
		}

		if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
		}

		return this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, this.$platformsData.availablePlatforms.Android);
	}
}

$injector.registerCommand("run|android", RunAndroidCommand);
