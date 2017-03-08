export class DebugPlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: IConfiguration,
		private $usbLiveSyncService: ILiveSyncService,
		protected $platformService: IPlatformService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $platformsData: IPlatformsData) {
			this.$projectData.initializeProjectData();
		}

	public async execute(args: string[]): Promise<void> {
		if (this.$options.start) {
			return this.debugService.debug(this.$projectData);
		}

		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
		const deployOptions: IDeployPlatformOptions = {
			clean: this.$options.clean,
			device: this.$options.device,
			emulator: this.$options.emulator,
			platformTemplate: this.$options.platformTemplate,
			projectDir: this.$options.path,
			release: this.$options.release,
			provision: this.$options.provision,
			teamId: this.$options.teamId
		};
		await this.$platformService.deployPlatform(this.$devicesService.platform, appFilesUpdaterOptions, deployOptions, this.$projectData, { provision: this.$options.provision, sdk: this.$options.sdk });
		this.$config.debugLivesync = true;
		let applicationReloadAction = async (deviceAppData: Mobile.IDeviceAppData): Promise<void> => {
			let projectData: IProjectData = this.$injector.resolve("projectData");

			await this.debugService.debugStop();

			let applicationId = deviceAppData.appIdentifier;
			if (deviceAppData.device.isEmulator && deviceAppData.platform.toLowerCase() === this.$devicePlatformsConstants.iOS.toLowerCase()) {
				applicationId = projectData.projectName;
			}

			await deviceAppData.device.applicationManager.stopApplication(applicationId);

			await this.debugService.debug(this.$projectData);
		};
		return this.$usbLiveSyncService.liveSync(this.$devicesService.platform, this.$projectData, applicationReloadAction);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await this.$devicesService.initialize({ platform: this.debugService.platform, deviceId: this.$options.device });
		// Start emulator if --emulator is selected or no devices found.
		if (this.$options.emulator || this.$devicesService.deviceCount === 0) {
			return true;
		}

		if (this.$devicesService.deviceCount > 1) {
			// Starting debugger on emulator.
			this.$options.emulator = true;

			this.$logger.warn("Multiple devices found! Starting debugger on emulator. If you want to debug on specific device please select device with --device option.".yellow.bold);
		}

		return true;
	}
}

export class DebugIOSCommand extends DebugPlatformCommand {
	constructor($iOSDebugService: IDebugService,
		$devicesService: Mobile.IDevicesService,
		$injector: IInjector,
		$logger: ILogger,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$config: IConfiguration,
		$usbLiveSyncService: ILiveSyncService,
		$platformService: IPlatformService,
		$options: IOptions,
		$projectData: IProjectData,
		$platformsData: IPlatformsData) {

		super($iOSDebugService, $devicesService, $injector, $logger, $devicePlatformsConstants, $config, $usbLiveSyncService, $platformService, $projectData, $options, $platformsData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await super.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.iOS);
	}
}

$injector.registerCommand("debug|ios", DebugIOSCommand);

export class DebugAndroidCommand extends DebugPlatformCommand {
	constructor($androidDebugService: IDebugService,
		$devicesService: Mobile.IDevicesService,
		$injector: IInjector,
		$logger: ILogger,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$config: IConfiguration,
		$usbLiveSyncService: ILiveSyncService,
		$platformService: IPlatformService,
		$options: IOptions,
		$projectData: IProjectData,
		$platformsData: IPlatformsData) {

		super($androidDebugService, $devicesService, $injector, $logger, $devicePlatformsConstants, $config, $usbLiveSyncService, $platformService, $projectData, $options, $platformsData);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await super.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.Android);
	}
}

$injector.registerCommand("debug|android", DebugAndroidCommand);
