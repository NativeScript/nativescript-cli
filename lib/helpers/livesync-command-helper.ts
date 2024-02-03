import * as _ from "lodash";
import {
	ErrorCodes,
	IAnalyticsService,
	IDictionary,
	IErrors,
} from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { RunOnDeviceEvents } from "../constants";
import { DeployController } from "../controllers/deploy-controller";
import { IAndroidBundleValidatorHelper, IOptions } from "../declarations";
import { IBuildController, IBuildDataService } from "../definitions/build";
import { ICleanupService } from "../definitions/cleanup-service";
import { IPlatformsDataService } from "../definitions/platform";
import { IProjectData, IValidatePlatformOutput } from "../definitions/project";

export class LiveSyncCommandHelper implements ILiveSyncCommandHelper {
	constructor(
		private $androidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		private $buildDataService: IBuildDataService,
		private $projectData: IProjectData,
		private $options: IOptions,
		private $deployController: DeployController,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicesService: Mobile.IDevicesService,
		private $injector: IInjector,
		private $buildController: IBuildController,
		private $analyticsService: IAnalyticsService,
		private $errors: IErrors,
		private $iOSSimulatorLogProvider: Mobile.IiOSSimulatorLogProvider,
		private $cleanupService: ICleanupService,
		private $runController: IRunController
	) {}

	private get $platformsDataService(): IPlatformsDataService {
		return this.$injector.resolve("platformsDataService");
	}

	// TODO: Remove this and replace it with buildData
	public getLiveSyncData(projectDir: string): ILiveSyncInfo {
		const liveSyncInfo: ILiveSyncInfo = {
			projectDir,
			skipWatcher: !this.$options.watch || this.$options.justlaunch,
			clean: this.$options.clean,
			release: this.$options.release,
			env: this.$options.env,
			timeout: this.$options.timeout,
			useHotModuleReload: this.$options.hmr,
			force: this.$options.force,
			emulator: this.$options.emulator,
		};

		return liveSyncInfo;
	}

	public async getDeviceInstances(
		platform?: string
	): Promise<Mobile.IDevice[]> {
		await this.$devicesService.initialize({
			platform,
			deviceId: this.$options.device,
			emulator: this.$options.emulator,
			skipInferPlatform: !platform,
			sdk: this.$options.sdk,
		});

		const devices = this.$devicesService
			.getDeviceInstances()
			.filter(
				(d) =>
					!platform ||
					d.deviceInfo.platform.toLowerCase() === platform.toLowerCase()
			);

		return devices;
	}

	public async createDeviceDescriptors(
		devices: Mobile.IDevice[],
		platform: string,
		additionalOptions?: ILiveSyncCommandHelperAdditionalOptions
	): Promise<ILiveSyncDeviceDescriptor[]> {
		// Now let's take data for each device:
		const deviceDescriptors: ILiveSyncDeviceDescriptor[] = devices.map((d) => {
			const outputPath =
				additionalOptions &&
				additionalOptions.getOutputDirectory &&
				additionalOptions.getOutputDirectory({
					platform: d.deviceInfo.platform,
					emulator: d.isEmulator,
					projectDir: this.$projectData.projectDir,
				});

			const buildData = this.$buildDataService.getBuildData(
				this.$projectData.projectDir,
				d.deviceInfo.platform,
				{
					...this.$options.argv,
					outputPath,
					buildForDevice: !d.isEmulator,
					watch: !this.$options.release && this.$options.watch,
					nativePrepare: {
						forceRebuildNativeApp: additionalOptions.forceRebuildNativeApp,
					},
					_device: d,
				}
			);
			this.$androidBundleValidatorHelper.validateDeviceApiLevel(d, buildData);

			const buildAction =
				additionalOptions && additionalOptions.buildPlatform
					? additionalOptions.buildPlatform.bind(
							additionalOptions.buildPlatform,
							d.deviceInfo.platform,
							buildData,
							this.$projectData
					  )
					: this.$buildController.build.bind(this.$buildController, buildData);

			const info: ILiveSyncDeviceDescriptor = {
				identifier: d.deviceInfo.identifier,
				buildAction,
				debuggingEnabled:
					additionalOptions &&
					additionalOptions.deviceDebugMap &&
					additionalOptions.deviceDebugMap[d.deviceInfo.identifier],
				debugOptions: this.$options,
				skipNativePrepare:
					additionalOptions && additionalOptions.skipNativePrepare,
				buildData,
			};

			return info;
		});

		return deviceDescriptors;
	}

	public getPlatformsForOperation(platform: string): string[] {
		const availablePlatforms = platform
			? [platform]
			: _.values<string>(
					this.$mobileHelper.platformNames.map((p) => p.toLowerCase())
			  );
		return availablePlatforms;
	}

	public async executeCommandLiveSync(
		platform?: string,
		additionalOptions?: ILiveSyncCommandHelperAdditionalOptions
	) {
		const devices = await this.getDeviceInstances(platform);
		await this.executeLiveSyncOperation(devices, platform, additionalOptions);
	}

	public async executeLiveSyncOperation(
		devices: Mobile.IDevice[],
		platform: string,
		additionalOptions?: ILiveSyncCommandHelperAdditionalOptions
	): Promise<void> {
		const { liveSyncInfo, deviceDescriptors } =
			await this.executeLiveSyncOperationCore(
				devices,
				platform,
				additionalOptions
			);

		if (this.$options.release) {
			await this.runInRelease(platform, deviceDescriptors);
			return;
		}

		if (additionalOptions.restartLiveSync) {
			await this.$runController.stop({
				projectDir: this.$projectData.projectDir,
				deviceIdentifiers: deviceDescriptors.map((device) => device.identifier),
				stopOptions: {
					shouldAwaitAllActions: true,
					keepProcessAlive: true,
				},
			});

			const devices = await this.getDeviceInstances(platform);
			await this.executeLiveSyncOperation(devices, platform, {
				...additionalOptions,
				restartLiveSync: false,
			});
			return;
		} else {
			await this.$runController.run({
				liveSyncInfo,
				deviceDescriptors,
			});
		}

		this.$runController.on(
			RunOnDeviceEvents.runOnDeviceStopped,
			async (data: {
				projectDir: string;
				deviceIdentifier: string;
				keepProcessAlive: boolean;
			}) => {
				const devices = await this.getDeviceInstances(platform);
				const remainingDevicesToSync = devices.map(
					(d) => d.deviceInfo.identifier
				);

				_.remove(remainingDevicesToSync, (d) => d === data.deviceIdentifier);
				if (remainingDevicesToSync.length === 0 && !data.keepProcessAlive) {
					process.exit(ErrorCodes.ALL_DEVICES_DISCONNECTED);
				}
			}
		);
	}

	public async validatePlatform(
		platform: string
	): Promise<IDictionary<IValidatePlatformOutput>> {
		const result: IDictionary<IValidatePlatformOutput> = {};

		const availablePlatforms = this.getPlatformsForOperation(platform);
		for (const availablePlatform of availablePlatforms) {
			const platformData = this.$platformsDataService.getPlatformData(
				availablePlatform,
				this.$projectData
			);
			const platformProjectService = platformData.platformProjectService;
			const validateOutput = await platformProjectService.validate(
				this.$projectData,
				this.$options
			);
			result[availablePlatform.toLowerCase()] = validateOutput;
		}

		return result;
	}

	private async executeLiveSyncOperationCore(
		devices: Mobile.IDevice[],
		platform: string,
		additionalOptions?: ILiveSyncCommandHelperAdditionalOptions
	): Promise<{
		liveSyncInfo: ILiveSyncInfo;
		deviceDescriptors: ILiveSyncDeviceDescriptor[];
	}> {
		if (!devices || !devices.length) {
			if (platform) {
				this.$errors.fail(
					"Unable to find applicable devices to execute operation. Ensure connected devices are trusted and try again."
				);
			} else {
				this.$errors.fail(
					"Unable to find applicable devices to execute operation and unable to start emulator when platform is not specified."
				);
			}
		}

		const workingWithiOSDevices =
			!platform || this.$mobileHelper.isiOSPlatform(platform);
		const shouldKeepProcessAlive =
			this.$options.watch || !this.$options.justlaunch;
		if (shouldKeepProcessAlive) {
			this.$analyticsService.setShouldDispose(false);
			this.$cleanupService.setShouldDispose(false);

			if (workingWithiOSDevices) {
				this.$iosDeviceOperations.setShouldDispose(false);
				this.$iOSSimulatorLogProvider.setShouldDispose(false);
			}
		}
		const deviceDescriptors = await this.createDeviceDescriptors(
			devices,
			platform,
			additionalOptions
		);
		const liveSyncInfo = this.getLiveSyncData(this.$projectData.projectDir);

		return { liveSyncInfo, deviceDescriptors };
	}

	private async runInRelease(
		platform: string,
		deviceDescriptors: ILiveSyncDeviceDescriptor[]
	): Promise<void> {
		await this.$devicesService.initialize({
			platform,
			deviceId: this.$options.device,
			emulator: this.$options.emulator,
			skipInferPlatform: !platform,
			sdk: this.$options.sdk,
		});

		await this.$deployController.deploy({ deviceDescriptors });

		for (const deviceDescriptor of deviceDescriptors) {
			const device = this.$devicesService.getDeviceByIdentifier(
				deviceDescriptor.identifier
			);
			await device.applicationManager.startApplication({
				appId:
					this.$projectData.projectIdentifiers[
						device.deviceInfo.platform.toLowerCase()
					],
				projectName: this.$projectData.projectName,
				projectDir: this.$projectData.projectDir,
			});
		}
	}

	public async stop() {
		const devices = await this.getDeviceInstances();
		return this.$runController.stop({
			projectDir: this.$projectData.projectDir,
			deviceIdentifiers: devices.map((d) => d.deviceInfo.identifier),
			stopOptions: {
				shouldAwaitAllActions: true,
				keepProcessAlive: true,
			},
		});
	}
}

injector.register("liveSyncCommandHelper", LiveSyncCommandHelper);