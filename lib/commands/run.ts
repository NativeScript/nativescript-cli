import { ERROR_NO_VALID_SUBCOMMAND_FORMAT } from "../common/constants";
import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { cache } from "../common/decorators";

export class RunCommandBase implements ICommand {

	public platform: string;
	constructor(protected $platformService: IPlatformService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $errors: IErrors,
		protected $devicesService: Mobile.IDevicesService,
		protected $platformsData: IPlatformsData,
		private $hostInfo: IHostInfo,
		private $liveSyncCommandHelper: ILiveSyncCommandHelper
	) { }

	public allowedParameters: ICommandParameter[] = [];
	public async execute(args: string[]): Promise<void> {
		return this.executeCore(args);
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

		const availablePlatforms = this.$liveSyncCommandHelper.getPlatformsForOperation(this.platform);
		for (const platform of availablePlatforms) {
			const platformData = this.$platformsData.getPlatformData(platform, this.$projectData);
			const platformProjectService = platformData.platformProjectService;
			await platformProjectService.validate(this.$projectData);
		}

		return true;
	}

	public async executeCore(args: string[]): Promise<void> {
		if (this.$options.bundle) {
			this.$options.watch = false;
		}

		await this.$devicesService.initialize({
			deviceId: this.$options.device,
			platform: this.platform,
			emulator: this.$options.emulator,
			skipDeviceDetectionInterval: true,
			skipInferPlatform: !this.platform
		});

		await this.$devicesService.detectCurrentlyAttachedDevices({ shouldReturnImmediateResult: false, platform: this.platform });
		let devices = this.$devicesService.getDeviceInstances();
		devices = devices.filter(d => !this.platform || d.deviceInfo.platform.toLowerCase() === this.platform.toLowerCase());
		await this.$liveSyncCommandHelper.executeLiveSyncOperation(devices, this.platform);
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

	constructor(protected $platformsData: IPlatformsData,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $errors: IErrors,
		private $injector: IInjector,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $options: IOptions) {
	}

	public async execute(args: string[]): Promise<void> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		return this.runCommand.executeCore(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await this.runCommand.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$options.teamId, this.$projectData, this.$platformsData.availablePlatforms.iOS);
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

	constructor(protected $platformsData: IPlatformsData,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $errors: IErrors,
		private $injector: IInjector,
		private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $options: IOptions) {
	}

	public async execute(args: string[]): Promise<void> {
		return this.runCommand.executeCore(args);
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
