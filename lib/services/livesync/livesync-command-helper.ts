export class LiveSyncCommandHelper implements ILiveSyncCommandHelper {

	constructor(protected $platformService: IPlatformService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $devicesService: Mobile.IDevicesService,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsData: IPlatformsData,
		private $errors: IErrors) {
	}

	public getPlatformsForOperation(platform: string): string[] {
		const availablePlatforms = platform ? [platform] : _.values<string>(this.$platformsData.availablePlatforms);
		return availablePlatforms;
	}

	/**
	 * Method sets up configuration, before calling livesync and expects that devices are already discovered.
	 * @param devices List of discovered devices
	 * @param liveSyncService Service expected to do the actual livesyncing
	 * @param platform The platform for which the livesync will be ran
	 */
	public async executeLiveSyncOperation(devices: Mobile.IDevice[], liveSyncService: ILiveSyncService, platform: string): Promise<void> {
		if (!devices || !devices.length) {
			this.$errors.failWithoutHelp("Unable to find applicable devices to execute operation and unable to start emulator when platform is not specified.");
		}

		const workingWithiOSDevices = !platform || this.$mobileHelper.isiOSPlatform(platform);
		const shouldKeepProcessAlive = this.$options.watch || !this.$options.justlaunch;
		if (workingWithiOSDevices && shouldKeepProcessAlive) {
			this.$iosDeviceOperations.setShouldDispose(false);
		}

		if (this.$options.release || this.$options.bundle) {
			await this.runInReleaseMode(platform);
			return;
		}

		// Now let's take data for each device:
		const deviceDescriptors: ILiveSyncDeviceInfo[] = devices
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
						const result = await this.$platformService.lastOutputPath(d.deviceInfo.platform, buildConfig, this.$projectData);
						return result;
					}
				};

				return info;
			});

		const liveSyncInfo: ILiveSyncInfo = {
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch,
			watchAllFiles: this.$options.syncAllFiles,
			clean: this.$options.clean
		};

		await liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);

	}

	private async runInReleaseMode(platform: string): Promise<void> {
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
			await this.$platformService.deployPlatform(currentPlatform, this.$options, deployOptions, this.$projectData, this.$options);
			await this.$platformService.startApplication(currentPlatform, runPlatformOptions, this.$projectData.projectId);
			this.$platformService.trackProjectType(this.$projectData);
		}
	}
}

$injector.register("liveSyncCommandHelper", LiveSyncCommandHelper);
