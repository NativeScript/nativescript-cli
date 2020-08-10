import { DeployController } from "../controllers/deploy-controller";
import { BuildController } from "../controllers/build-controller";
import { IAndroidBundleValidatorHelper, IOptions } from "../declarations";
import { IBuildDataService } from "../definitions/build";
import { IProjectData } from "../definitions/project";
import { $injector } from "../common/definitions/yok";

export class DeployCommandHelper {
	constructor(
		private $androidBundleValidatorHelper: IAndroidBundleValidatorHelper,
		private $buildDataService: IBuildDataService,
		private $buildController: BuildController,
		private $devicesService: Mobile.IDevicesService,
		private $deployController: DeployController,
		private $options: IOptions,
		private $projectData: IProjectData
	) { }

	public async deploy(platform: string, additionalOptions?: ILiveSyncCommandHelperAdditionalOptions) {
		const emulator = this.$options.emulator;
		await this.$devicesService.initialize({
			deviceId: this.$options.device,
			platform,
			emulator,
			skipInferPlatform: !platform,
			sdk: this.$options.sdk
		});

		const devices = this.$devicesService.getDeviceInstances()
			.filter(d => !platform || d.deviceInfo.platform.toLowerCase() === platform.toLowerCase());

		const deviceDescriptors: ILiveSyncDeviceDescriptor[] = devices
			.map(d => {
				const outputPath = additionalOptions && additionalOptions.getOutputDirectory && additionalOptions.getOutputDirectory({
					platform: d.deviceInfo.platform,
					emulator: d.isEmulator,
					projectDir: this.$projectData.projectDir
				});

				const buildData = this.$buildDataService.getBuildData(this.$projectData.projectDir, d.deviceInfo.platform,
					{
						...this.$options.argv,
						outputPath,
						buildForDevice: !d.isEmulator,
						skipWatcher: !this.$options.watch,
						nativePrepare: { skipNativePrepare: additionalOptions && additionalOptions.skipNativePrepare }
					});

				this.$androidBundleValidatorHelper.validateDeviceApiLevel(d, buildData);
				const buildAction = additionalOptions && additionalOptions.buildPlatform ?
					additionalOptions.buildPlatform.bind(additionalOptions.buildPlatform, d.deviceInfo.platform, buildData, this.$projectData) :
					this.$buildController.build.bind(this.$buildController, buildData);

				const info: ILiveSyncDeviceDescriptor = {
					identifier: d.deviceInfo.identifier,
					buildAction,
					debuggingEnabled: additionalOptions && additionalOptions.deviceDebugMap && additionalOptions.deviceDebugMap[d.deviceInfo.identifier],
					debugOptions: this.$options,
					skipNativePrepare: additionalOptions && additionalOptions.skipNativePrepare,
					buildData
				};

				return info;
			});

		await this.$deployController.deploy({ deviceDescriptors });
	}
}
$injector.register("deployCommandHelper", DeployCommandHelper);
