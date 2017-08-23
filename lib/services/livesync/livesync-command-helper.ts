export class LiveSyncCommandHelper implements ILiveSyncCommandHelper {

	constructor(private $platformService: IPlatformService,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $liveSyncService: ILiveSyncService,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsData: IPlatformsData,
		private $errors: IErrors) {
	}

	public getPlatformsForOperation(platform: string): string[] {
		const availablePlatforms = platform ? [platform] : _.values<string>(this.$platformsData.availablePlatforms);
		return availablePlatforms;
	}

	public async executeLiveSyncOperation(devices: Mobile.IDevice[], platform: string, deviceDebugMap?: IDictionary<boolean>): Promise<void> {
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
					platformSpecificOptions: this.$options,

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
					},
					debugggingEnabled: deviceDebugMap && deviceDebugMap[d.deviceInfo.identifier]
				};

				return info;
			});

		const liveSyncInfo: ILiveSyncInfo = {
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch,
			watchAllFiles: this.$options.syncAllFiles,
			clean: this.$options.clean,
			debugOptions: this.$options
		};

		await this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);

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
