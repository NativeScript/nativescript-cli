import { EOL } from "os";

export abstract class DebugPlatformCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(private debugService: IPlatformDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $injector: IInjector,
		private $config: IConfiguration,
		private $usbLiveSyncService: ILiveSyncService,
		private $debugDataService: IDebugDataService,
		protected $platformService: IPlatformService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $platformsData: IPlatformsData,
		protected $logger: ILogger) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const debugOptions = this.$options;
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

		let debugData = this.$debugDataService.createDebugData(this.$projectData, this.$options);

		await this.$platformService.trackProjectType(this.$projectData);

		if (this.$options.start) {
			return this.printDebugInformation(await this.debugService.debug<string[]>(debugData, debugOptions));
		}

		const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };

		await this.$platformService.deployPlatform(this.$devicesService.platform, appFilesUpdaterOptions, deployOptions, this.$projectData, this.$options);
		this.$config.debugLivesync = true;
		let applicationReloadAction = async (deviceAppData: Mobile.IDeviceAppData): Promise<void> => {
			let projectData: IProjectData = this.$injector.resolve("projectData");

			await this.debugService.debugStop();

			let applicationId = deviceAppData.appIdentifier;
			await deviceAppData.device.applicationManager.stopApplication(applicationId, projectData.projectName);

			const buildConfig: IBuildConfig = _.merge({ buildForDevice: !deviceAppData.device.isEmulator }, deployOptions);
			debugData.pathToAppPackage = this.$platformService.lastOutputPath(this.debugService.platform, buildConfig, projectData);

			this.printDebugInformation(await this.debugService.debug<string[]>(debugData, debugOptions));
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

	protected printDebugInformation(information: string[]): void {
		_.each(information, i => {
			this.$logger.info(`To start debugging, open the following URL in Chrome:${EOL}${i}${EOL}`.cyan);
		});
	}
}

export class DebugIOSCommand extends DebugPlatformCommand {
	constructor(private $errors: IErrors,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$logger: ILogger,
		$iOSDebugService: IPlatformDebugService,
		$devicesService: Mobile.IDevicesService,
		$injector: IInjector,
		$config: IConfiguration,
		$usbLiveSyncService: ILiveSyncService,
		$debugDataService: IDebugDataService,
		$platformService: IPlatformService,
		$options: IOptions,
		$projectData: IProjectData,
		$platformsData: IPlatformsData,
		$iosDeviceOperations: IIOSDeviceOperations) {
		super($iOSDebugService, $devicesService, $injector, $config, $usbLiveSyncService, $debugDataService, $platformService, $projectData, $options, $platformsData, $logger);
		// Do not dispose ios-device-lib, so the process will remain alive and the debug application (NativeScript Inspector or Chrome DevTools) will be able to connect to the socket.
		// In case we dispose ios-device-lib, the socket will be closed and the code will fail when the debug application tries to read/send data to device socket.
		// That's why the `$ tns debug ios --justlaunch` command will not release the terminal.
		// In case we do not set it to false, the dispose will be called once the command finishes its execution, which will prevent the debugging.
		$iosDeviceOperations.setShouldDispose(false);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", this.$devicePlatformsConstants.iOS, process.platform);
		}

		return await super.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.iOS);
	}

	protected printDebugInformation(information: string[]): void {
		if (this.$options.chrome) {
			super.printDebugInformation(information);
		}
	}
}

$injector.registerCommand("debug|ios", DebugIOSCommand);

export class DebugAndroidCommand extends DebugPlatformCommand {
	constructor(private $errors: IErrors,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$logger: ILogger,
		$androidDebugService: IPlatformDebugService,
		$devicesService: Mobile.IDevicesService,
		$injector: IInjector,
		$config: IConfiguration,
		$usbLiveSyncService: ILiveSyncService,
		$debugDataService: IDebugDataService,
		$platformService: IPlatformService,
		$options: IOptions,
		$projectData: IProjectData,
		$platformsData: IPlatformsData) {
		super($androidDebugService, $devicesService, $injector, $config, $usbLiveSyncService, $debugDataService, $platformService, $projectData, $options, $platformsData, $logger);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.Android, this.$projectData)) {
			this.$errors.fail("Applications for platform %s can not be built on this OS - %s", this.$devicePlatformsConstants.Android, process.platform);
		}

		return await super.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.Android);
	}
}

$injector.registerCommand("debug|android", DebugAndroidCommand);
