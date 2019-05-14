import { RunOnDevicesController } from "../controllers/run-on-devices-controller";
import { BuildController } from "../controllers/build-controller";

export class LiveSyncCommandHelper implements ILiveSyncCommandHelper {
	public static MIN_SUPPORTED_WEBPACK_VERSION_WITH_HMR = "0.17.0";

	constructor(
		private $projectData: IProjectData,
		private $options: IOptions,
		private $runOnDevicesController: RunOnDevicesController,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicesService: Mobile.IDevicesService,
		private $injector: IInjector,
		private $buildController: BuildController,
		private $analyticsService: IAnalyticsService,
		private $bundleValidatorHelper: IBundleValidatorHelper,
		private $errors: IErrors,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $cleanupService: ICleanupService
	) { }

	private get $platformsData(): IPlatformsData {
		return this.$injector.resolve("platformsData");
	}

	public async getDeviceInstances(platform?: string): Promise<Mobile.IDevice[]> {
		await this.$devicesService.initialize({
			platform,
			deviceId: this.$options.device,
			emulator: this.$options.emulator,
			skipInferPlatform: !platform,
			sdk: this.$options.sdk
		});

		const devices = this.$devicesService.getDeviceInstances()
			.filter(d => !platform || d.deviceInfo.platform.toLowerCase() === platform.toLowerCase());

		return devices;
	}

	public createLiveSyncInfo(): ILiveSyncInfo {
		const liveSyncInfo: ILiveSyncInfo = {
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch || this.$options.justlaunch,
			clean: this.$options.clean,
			release: this.$options.release,
			env: this.$options.env,
			timeout: this.$options.timeout,
			useHotModuleReload: this.$options.hmr,
			force: this.$options.force,
			emulator: this.$options.emulator
		};

		return liveSyncInfo;
	}

	public async createDeviceDescriptors(devices: Mobile.IDevice[], platform: string, additionalOptions?: ILiveSyncCommandHelperAdditionalOptions): Promise<ILiveSyncDeviceInfo[]> {
		if (!devices || !devices.length) {
			if (platform) {
				this.$errors.failWithoutHelp("Unable to find applicable devices to execute operation. Ensure connected devices are trusted and try again.");
			} else {
				this.$errors.failWithoutHelp("Unable to find applicable devices to execute operation and unable to start emulator when platform is not specified.");
			}
		}

		const workingWithiOSDevices = !platform || this.$mobileHelper.isiOSPlatform(platform);
		const shouldKeepProcessAlive = this.$options.watch || !this.$options.justlaunch;
		if (shouldKeepProcessAlive) {
			this.$analyticsService.setShouldDispose(false);
			this.$cleanupService.setShouldDispose(false);

			if (workingWithiOSDevices) {
				this.$iosDeviceOperations.setShouldDispose(false);
				this.$iOSSimulatorLogProvider.setShouldDispose(false);
			}
		}

		// Now let's take data for each device:
		const deviceDescriptors: ILiveSyncDeviceInfo[] = devices
			.map(d => {
				const buildConfig: IBuildConfig = {
					buildForDevice: !d.isEmulator,
					iCloudContainerEnvironment: this.$options.iCloudContainerEnvironment,
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

				const buildAction = additionalOptions && additionalOptions.buildPlatform ?
					additionalOptions.buildPlatform.bind(additionalOptions.buildPlatform, d.deviceInfo.platform, buildConfig, this.$projectData) :
					this.$buildController.prepareAndBuildPlatform.bind(this.$buildController, d.deviceInfo.platform, buildConfig, this.$projectData);

				const outputPath = additionalOptions && additionalOptions.getOutputDirectory && additionalOptions.getOutputDirectory({
					platform: d.deviceInfo.platform,
					emulator: d.isEmulator,
					projectDir: this.$projectData.projectDir
				});

				const info: ILiveSyncDeviceInfo = {
					identifier: d.deviceInfo.identifier,
					buildAction,
					debuggingEnabled: additionalOptions && additionalOptions.deviceDebugMap && additionalOptions.deviceDebugMap[d.deviceInfo.identifier],
					debugOptions: this.$options,
					outputPath,
					skipNativePrepare: additionalOptions && additionalOptions.skipNativePrepare,
				};

				return info;
			});

			return deviceDescriptors;
	}

	public getPlatformsForOperation(platform: string): string[] {
		const availablePlatforms = platform ? [platform] : _.values<string>(this.$platformsData.availablePlatforms);
		return availablePlatforms;
	}

	public async executeCommandLiveSync(platform?: string, additionalOptions?: ILiveSyncCommandHelperAdditionalOptions) {
		const devices = await this.getDeviceInstances(platform);
		await this.executeLiveSyncOperation(devices, platform, additionalOptions);
	}

	public async executeLiveSyncOperation(devices: Mobile.IDevice[], platform: string, additionalOptions?: ILiveSyncCommandHelperAdditionalOptions): Promise<void> {
		const deviceDescriptors = await this.createDeviceDescriptors(devices, platform, additionalOptions);

		const liveSyncInfo: ILiveSyncInfo = {
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch || this.$options.justlaunch,
			clean: this.$options.clean,
			release: this.$options.release,
			env: this.$options.env,
			timeout: this.$options.timeout,
			useHotModuleReload: this.$options.hmr,
			force: this.$options.force,
			emulator: this.$options.emulator
		};

		// if (this.$options.release) {
			// liveSyncInfo.skipWatcher = true;
			// await this.$bundleWorkflowService.deployPlatform(this.$projectData.projectDir, deviceDescriptors, liveSyncInfo);
			// return;
		// }

		await this.$runOnDevicesController.runOnDevices({
			projectDir: this.$projectData.projectDir,
			liveSyncInfo,
			deviceDescriptors
		});

		// const remainingDevicesToSync = devices.map(d => d.deviceInfo.identifier);
		// this.$liveSyncService.on(LiveSyncEvents.liveSyncStopped, (data: { projectDir: string, deviceIdentifier: string }) => {
		// 	_.remove(remainingDevicesToSync, d => d === data.deviceIdentifier);

		// 	if (remainingDevicesToSync.length === 0) {
		// 		process.exit(ErrorCodes.ALL_DEVICES_DISCONNECTED);
		// 	}
		// });

		// await this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);
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

		const minSupportedWebpackVersion = this.$options.hmr ? LiveSyncCommandHelper.MIN_SUPPORTED_WEBPACK_VERSION_WITH_HMR : null;
		this.$bundleValidatorHelper.validate(minSupportedWebpackVersion);

		return result;
	}
}

$injector.register("liveSyncCommandHelper", LiveSyncCommandHelper);
