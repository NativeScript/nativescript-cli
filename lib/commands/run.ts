export class RunCommandBase implements ICommand {
	protected platform: string;

	constructor(protected $platformService: IPlatformService,
		protected $liveSyncService: ILiveSyncService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $emulatorPlatformService: IEmulatorPlatformService,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $devicesService: Mobile.IDevicesService,
		private $hostInfo: IHostInfo,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper) {
		this.$projectData.initializeProjectData();
	}

	public allowedParameters: ICommandParameter[] = [ ];
	public async execute(args: string[]): Promise<void> {
		return this.executeCore(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.platform && !this.$hostInfo.isDarwin) {
			this.platform = this.$devicePlatformsConstants.Android;
		}

		return true;
	}

	public async executeCore(args: string[]): Promise<void> {
		if (this.$options.bundle) {
			this.$options.watch = false;
		}

		await this.$devicesService.initialize({ deviceId: this.$options.device, platform: this.platform, skipDeviceDetectionInterval: true, skipInferPlatform: true });
		await this.$devicesService.detectCurrentlyAttachedDevices();

		const devices = this.$devicesService.getDeviceInstances();
		// Now let's take data for each device:
		const deviceDescriptors: ILiveSyncDeviceInfo[] = devices.filter(d => !this.platform || d.deviceInfo.platform === this.platform)
			.map(d => {
				const info: ILiveSyncDeviceInfo = {
					identifier: d.deviceInfo.identifier,
					buildAction: async (): Promise<string> => {
						const buildConfig: IBuildConfig = {
							buildForDevice: !d.isEmulator, // this.$options.forDevice,
							projectDir: this.$options.path,
							clean: this.$options.clean,
							teamId: this.$options.teamId,
							device: this.$options.device,
							provision: this.$options.provision,
							release: this.$options.release,
							keyStoreAlias: this.$options.keyStoreAlias,
							keyStorePath: this.$options.keyStorePath,
							keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
							keyStorePassword: this.$options.keyStorePassword
						};

						await this.$platformService.buildPlatform(d.deviceInfo.platform, buildConfig, this.$projectData);
						const pathToBuildResult = await this.$platformService.lastOutputPath(d.deviceInfo.platform, buildConfig, this.$projectData);
						return pathToBuildResult;
					}
				};

				return info;
			});

		// if (this.$options.release) {
		// 	const deployOpts: IRunPlatformOptions = {
		// 		device: this.$options.device,
		// 		emulator: this.$options.emulator,
		// 		justlaunch: this.$options.justlaunch,
		// 	};

		// 	await this.$platformService.startApplication(args[0], deployOpts, this.$projectData.projectId);
		// 	return this.$platformService.trackProjectType(this.$projectData);
		// }

		if ((!this.platform || this.$mobileHelper.isiOSPlatform(this.platform)) && (this.$options.watch || !this.$options.justlaunch)) {
			this.$iosDeviceOperations.setShouldDispose(false);
		}

		const liveSyncInfo: ILiveSyncInfo = { projectDir: this.$projectData.projectDir, skipWatcher: !this.$options.watch, watchAllFiles: this.$options.syncAllFiles };
		await this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);
	}
}
$injector.registerCommand("run|*all", RunCommandBase);

export class RunIosCommand extends RunCommandBase implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	public get platform(): string {
		return this.$devicePlatformsConstants.iOS;
	}

	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		$liveSyncService: ILiveSyncService,
		$projectData: IProjectData,
		$options: IOptions,
		$emulatorPlatformService: IEmulatorPlatformService,
		$devicesService: Mobile.IDevicesService,
		$hostInfo: IHostInfo,
		$iosDeviceOperations: IIOSDeviceOperations,
		$mobileHelper: Mobile.IMobileHelper) {
		super($platformService, $liveSyncService, $projectData, $options, $emulatorPlatformService, $devicePlatformsConstants, $devicesService, $hostInfo, $iosDeviceOperations, $mobileHelper);
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
	public get platform(): string {
		return this.$devicePlatformsConstants.Android;
	}

	constructor($platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		$liveSyncService: ILiveSyncService,
		$projectData: IProjectData,
		$options: IOptions,
		$emulatorPlatformService: IEmulatorPlatformService,
		$devicesService: Mobile.IDevicesService,
		$hostInfo: IHostInfo,
		$iosDeviceOperations: IIOSDeviceOperations,
		$mobileHelper: Mobile.IMobileHelper) {
		super($platformService, $liveSyncService, $projectData, $options, $emulatorPlatformService, $devicePlatformsConstants, $devicesService, $hostInfo, $iosDeviceOperations, $mobileHelper);
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
