import { ERROR_NO_VALID_SUBCOMMAND_FORMAT } from "../common/constants";

export class RunCommandBase implements ICommand {
	protected platform: string;

	constructor(protected $platformService: IPlatformService,
		protected $liveSyncService: ILiveSyncService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $emulatorPlatformService: IEmulatorPlatformService,
		protected $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		protected $errors: IErrors,
		private $devicesService: Mobile.IDevicesService,
		private $hostInfo: IHostInfo,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper) {
	}

	public allowedParameters: ICommandParameter[] = [];
	public async execute(args: string[]): Promise<void> {
		return this.executeCore(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (args.length) {
			this.$errors.fail(ERROR_NO_VALID_SUBCOMMAND_FORMAT, "run");
		}

		this.$projectData.initializeProjectData();
		if (!this.platform && !this.$hostInfo.isDarwin) {
			this.platform = this.$devicePlatformsConstants.Android;
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
		await this.$devicesService.detectCurrentlyAttachedDevices();

		const devices = this.$devicesService.getDeviceInstances();
		// Now let's take data for each device:
		const deviceDescriptors: ILiveSyncDeviceInfo[] = devices.filter(d => !this.platform || d.deviceInfo.platform === this.platform)
			.map(d => {
				const info: ILiveSyncDeviceInfo = {
					identifier: d.deviceInfo.identifier,
					buildAction: async (): Promise<string> => {
						const buildConfig: IBuildConfig = {
							buildForDevice: !d.isEmulator,
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

		const workingWithiOSDevices = !this.platform || this.$mobileHelper.isiOSPlatform(this.platform);
		const shouldKeepProcessAlive = this.$options.watch || !this.$options.justlaunch;
		if (workingWithiOSDevices && shouldKeepProcessAlive) {
			this.$iosDeviceOperations.setShouldDispose(false);
		}

		if (this.$options.release) {
			const runPlatformOptions: IRunPlatformOptions = {
				device: this.$options.device,
				emulator: this.$options.emulator,
				justlaunch: this.$options.justlaunch,
			};

			const deployOptions = _.merge<IDeployPlatformOptions>({ projectDir: this.$projectData.projectDir, clean: true }, this.$options);

			await this.$platformService.deployPlatform(args[0], this.$options, deployOptions, this.$projectData, this.$options);
			await this.$platformService.startApplication(args[0], runPlatformOptions, this.$projectData.projectId);
			return this.$platformService.trackProjectType(this.$projectData);
		}

		const liveSyncInfo: ILiveSyncInfo = {
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch,
			watchAllFiles: this.$options.syncAllFiles,
			clean: this.$options.clean
		};

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
		protected $errors: IErrors,
		$liveSyncService: ILiveSyncService,
		$projectData: IProjectData,
		$options: IOptions,
		$emulatorPlatformService: IEmulatorPlatformService,
		$devicesService: Mobile.IDevicesService,
		$hostInfo: IHostInfo,
		$iosDeviceOperations: IIOSDeviceOperations,
		$mobileHelper: Mobile.IMobileHelper) {
		super($platformService, $liveSyncService, $projectData, $options, $emulatorPlatformService, $devicePlatformsConstants, $errors, $devicesService, $hostInfo, $iosDeviceOperations, $mobileHelper);
	}

	public async execute(args: string[]): Promise<void> {
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.iOS, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.iOS} can not be built on this OS`);
		}

		return this.executeCore([this.$platformsData.availablePlatforms.iOS]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await super.canExecute(args) && await this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.iOS);
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
		protected $errors: IErrors,
		$liveSyncService: ILiveSyncService,
		$projectData: IProjectData,
		$options: IOptions,
		$emulatorPlatformService: IEmulatorPlatformService,
		$devicesService: Mobile.IDevicesService,
		$hostInfo: IHostInfo,
		$iosDeviceOperations: IIOSDeviceOperations,
		$mobileHelper: Mobile.IMobileHelper) {
		super($platformService, $liveSyncService, $projectData, $options, $emulatorPlatformService, $devicePlatformsConstants, $errors, $devicesService, $hostInfo, $iosDeviceOperations, $mobileHelper);
	}

	public async execute(args: string[]): Promise<void> {
		return this.executeCore([this.$platformsData.availablePlatforms.Android]);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		await super.canExecute(args);
		if (!this.$platformService.isPlatformSupportedForOS(this.$devicePlatformsConstants.Android, this.$projectData)) {
			this.$errors.fail(`Applications for platform ${this.$devicePlatformsConstants.Android} can not be built on this OS`);
		}

		if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
			this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
		}
		return this.$platformService.validateOptions(this.$options.provision, this.$projectData, this.$platformsData.availablePlatforms.Android);
	}
}

$injector.registerCommand("run|android", RunAndroidCommand);
