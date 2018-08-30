export class LiveSyncCommandHelper implements ILiveSyncCommandHelper {

	constructor(private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $liveSyncService: ILiveSyncService,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicesService: Mobile.IDevicesService,
		private $platformsData: IPlatformsData,
		private $analyticsService: IAnalyticsService,
		private $bundleValidatorHelper: IBundleValidatorHelper,
		private $errors: IErrors,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $logger: ILogger) {
		this.$analyticsService.setShouldDispose(this.$options.justlaunch || !this.$options.watch);
	}

	public getPlatformsForOperation(platform: string): string[] {
		const availablePlatforms = platform ? [platform] : _.values<string>(this.$platformsData.availablePlatforms);
		return availablePlatforms;
	}

	public async executeCommandLiveSync(platform?: string, additionalOptions?: ILiveSyncCommandHelperAdditionalOptions) {
		if (additionalOptions && additionalOptions.syncToPreviewApp) {
			return;
		}

		if (!this.$options.syncAllFiles) {
			this.$logger.info("Skipping node_modules folder! Use the syncAllFiles option to sync files from this folder.");
		}

		const emulator = this.$options.emulator;
		await this.$devicesService.initialize({
			deviceId: this.$options.device,
			platform,
			emulator,
			skipDeviceDetectionInterval: true,
			skipInferPlatform: !platform,
			sdk: this.$options.sdk
		});

		const devices = this.$devicesService.getDeviceInstances()
			.filter(d => !platform || d.deviceInfo.platform.toLowerCase() === platform.toLowerCase());

		const devicesPlatforms = _(devices).map(d => d.deviceInfo.platform).uniq().value();
		if (this.$options.bundle && devicesPlatforms.length > 1) {
			this.$errors.failWithoutHelp("Bundling doesn't work with multiple platforms. Please specify platform to the run command.");
		}

		await this.executeLiveSyncOperation(devices, platform, additionalOptions);
	}

	public async executeLiveSyncOperation(devices: Mobile.IDevice[], platform: string, additionalOptions?: ILiveSyncCommandHelperAdditionalOptions): Promise<void> {
		if (!devices || !devices.length) {
			if (platform) {
				this.$errors.failWithoutHelp("Unable to find applicable devices to execute operation. Ensure connected devices are trusted and try again.");
			} else {
				this.$errors.failWithoutHelp("Unable to find applicable devices to execute operation and unable to start emulator when platform is not specified.");
			}
		}

		const workingWithiOSDevices = !platform || this.$mobileHelper.isiOSPlatform(platform);
		const shouldKeepProcessAlive = this.$options.watch || !this.$options.justlaunch;
		if (workingWithiOSDevices && shouldKeepProcessAlive) {
			this.$iosDeviceOperations.setShouldDispose(false);
			this.$iOSSimulatorLogProvider.setShouldDispose(false);
		}

		if (this.$options.release) {
			await this.runInReleaseMode(platform, additionalOptions);
			return;
		}

		// Now let's take data for each device:
		const deviceDescriptors: ILiveSyncDeviceInfo[] = devices
			.map(d => {
				let buildAction: IBuildAction;

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

				buildAction = additionalOptions && additionalOptions.buildPlatform ?
					additionalOptions.buildPlatform.bind(additionalOptions.buildPlatform, d.deviceInfo.platform, buildConfig, this.$projectData) :
					this.$platformService.buildPlatform.bind(this.$platformService, d.deviceInfo.platform, buildConfig, this.$projectData);

				const info: ILiveSyncDeviceInfo = {
					identifier: d.deviceInfo.identifier,
					platformSpecificOptions: this.$options,
					buildAction,
					debugggingEnabled: additionalOptions && additionalOptions.deviceDebugMap && additionalOptions.deviceDebugMap[d.deviceInfo.identifier],
					debugOptions: this.$options,
					outputPath: additionalOptions && additionalOptions.getOutputDirectory && additionalOptions.getOutputDirectory({
						platform: d.deviceInfo.platform,
						emulator: d.isEmulator,
						projectDir: this.$projectData.projectDir
					}),
					skipNativePrepare: additionalOptions && additionalOptions.skipNativePrepare,
				};

				return info;
			});

		const liveSyncInfo: ILiveSyncInfo = {
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch,
			watchAllFiles: this.$options.syncAllFiles,
			clean: this.$options.clean,
			bundle: !!this.$options.bundle,
			release: this.$options.release,
			env: this.$options.env,
			timeout: this.$options.timeout,
			useHotModuleReload: this.$options.hmr
		};

		await this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);
	}

	public async validatePlatform(platform: string): Promise<IDictionary<IValidatePlatformOutput>> {
		const result: IDictionary<IValidatePlatformOutput> = {};

		const availablePlatforms = this.getPlatformsForOperation(platform);
		for (const availablePlatform of availablePlatforms) {
			const platformData = this.$platformsData.getPlatformData(availablePlatform, this.$projectData);
			const platformProjectService = platformData.platformProjectService;
			const validateOutput = await platformProjectService.validate(this.$projectData, this.$options);
			result[availablePlatform.toLowerCase()] = validateOutput;
		}

		this.$bundleValidatorHelper.validate();

		return result;
	}

	private async runInReleaseMode(platform: string, additionalOptions?: ILiveSyncCommandHelperAdditionalOptions): Promise<void> {
		const runPlatformOptions: IRunPlatformOptions = {
			device: this.$options.device,
			emulator: this.$options.emulator,
			justlaunch: this.$options.justlaunch
		};

		const deployOptions = _.merge<IDeployPlatformOptions>({
			projectDir: this.$projectData.projectDir,
			clean: true,
		}, this.$options.argv);

		const availablePlatforms = this.getPlatformsForOperation(platform);
		for (const currentPlatform of availablePlatforms) {
			const deployPlatformInfo: IDeployPlatformInfo = {
				platform: currentPlatform,
				appFilesUpdaterOptions: {
					bundle: !!this.$options.bundle,
					release: this.$options.release
				},
				deployOptions,
				buildPlatform: this.$platformService.buildPlatform.bind(this.$platformService),
				projectData: this.$projectData,
				config: this.$options,
				env: this.$options.env
			};

			await this.$platformService.deployPlatform(deployPlatformInfo);
			await this.$platformService.startApplication(currentPlatform, runPlatformOptions, { appId: this.$projectData.projectId, projectName: this.$projectData.projectName });
			await this.$platformService.trackProjectType(this.$projectData);
		}
	}
}

$injector.register("liveSyncCommandHelper", LiveSyncCommandHelper);
