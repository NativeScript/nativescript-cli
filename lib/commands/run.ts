export class RunCommandBase {
	constructor(protected $platformService: IPlatformService,
		protected $usbLiveSyncService: ILiveSyncService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $emulatorPlatformService: IEmulatorPlatformService) {
		this.$projectData.initializeProjectData();
	}

	public async executeCore(args: string[]): Promise<void> {

		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		const deployOptions: IDeployPlatformOptions = {
			clean: this.$options.clean,
			device: this.$options.device,
			emulator: this.$options.emulator,
			projectDir: this.$options.path,
			platformTemplate: this.$options.platformTemplate,
			release: this.$options.release,
			provision: this.$options.provision,
			teamId: this.$options.teamId,
			keyStoreAlias: this.$options.keyStoreAlias,
			keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
			keyStorePassword: this.$options.keyStorePassword,
			keyStorePath: this.$options.keyStorePath
		};

		await this.$platformService.deployPlatform(args[0], appFilesUpdaterOptions, deployOptions, this.$projectData, this.$options);

		if (this.$options.bundle) {
			this.$options.watch = false;
		}

		if (this.$options.release) {
			const deployOpts: IRunPlatformOptions = {
				device: this.$options.device,
				emulator: this.$options.emulator,
				justlaunch: this.$options.justlaunch,
			};

			await this.$platformService.startApplication(args[0], deployOpts, this.$projectData.projectId);
			return this.$platformService.trackProjectType(this.$projectData);
		}

		return this.$usbLiveSyncService.liveSync(args[0], this.$projectData);
	}
}

export class RunIosCommand extends RunCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		$usbLiveSyncService: ILiveSyncService,
		$projectData: IProjectData,
		$options: IOptions,
		$emulatorPlatformService: IEmulatorPlatformService) {
		super($platformService, $usbLiveSyncService, $projectData, $options, $emulatorPlatformService);
	}

	public async execute(args: string[]): Promise<void> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", this.$devicePlatformsConstants.iOS, process.platform);
		}

		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return args.length === 0 && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.iOS);
	}
}

$injector.registerCommand("run|ios", RunIosCommand);

export class RunAndroidCommand extends RunCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		$usbLiveSyncService: ILiveSyncService,
		$projectData: IProjectData,
		$options: IOptions,
		$emulatorPlatformService: IEmulatorPlatformService) {
		super($platformService, $usbLiveSyncService, $projectData, $options, $emulatorPlatformService);
	}

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.Android, this.$projectData)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", this.$devicePlatformsConstants.Android, process.platform);
		}

		if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
		}
		return args.length === 0 && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.Android);
	}
}

$injector.registerCommand("run|android", RunAndroidCommand);
