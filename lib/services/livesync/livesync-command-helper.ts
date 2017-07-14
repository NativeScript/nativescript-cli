export class LiveSyncCommandHelper implements ILiveSyncCommandHelper {
	protected platform: string;

	constructor(protected $platformService: IPlatformService,
		protected $projectData: IProjectData,
		protected $options: IOptions,
		protected $devicesService: Mobile.IDevicesService,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper) {
	}

	public async getDevicesLiveSyncInfo(args: string[], devices: Mobile.IDevice[]): Promise<IDevicesDescriptorsLiveSyncInfo> {
		await this.$devicesService.detectCurrentlyAttachedDevices();
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

		const workingWithiOSDevices = !this.platform || this.$mobileHelper.isiOSPlatform(this.platform);
		const shouldKeepProcessAlive = this.$options.watch || !this.$options.justlaunch;
		if (workingWithiOSDevices && shouldKeepProcessAlive) {
			this.$iosDeviceOperations.setShouldDispose(false);
		}

		// TODO: test it, might have isuues with `tns run` (no args)
		if (this.$options.release || this.$options.bundle) {
			const runPlatformOptions: IRunPlatformOptions = {
				device: this.$options.device,
				emulator: this.$options.emulator,
				justlaunch: this.$options.justlaunch
			};

			const deployOptions = _.merge<IDeployPlatformOptions>({
				projectDir: this.$projectData.projectDir,
				clean: true,
			}, this.$options.argv);

			await this.$platformService.deployPlatform(args[0], this.$options, deployOptions, this.$projectData, this.$options);
			await this.$platformService.startApplication(args[0], runPlatformOptions, this.$projectData.projectId);
			this.$platformService.trackProjectType(this.$projectData);
		}

		const liveSyncInfo: ILiveSyncInfo = {
			projectDir: this.$projectData.projectDir,
			skipWatcher: !this.$options.watch,
			watchAllFiles: this.$options.syncAllFiles,
			clean: this.$options.clean
		};

		return {
			deviceDescriptors,
			liveSyncInfo
		};
	}
}

$injector.register("liveSyncCommandHelper", LiveSyncCommandHelper);
