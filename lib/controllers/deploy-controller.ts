export class DeployController {

	constructor(
		private $buildDataService: IBuildDataService,
		private $buildController: IBuildController,
		private $deviceInstallAppService: IDeviceInstallAppService,
		private $devicesService: Mobile.IDevicesService
	) { }

	public async deploy(data: IRunData): Promise<void> {
		const { liveSyncInfo, deviceDescriptors } = data;

		const executeAction = async (device: Mobile.IDevice) => {
			const options = { ...liveSyncInfo, buildForDevice: !device.isEmulator };
			const buildData = this.$buildDataService.getBuildData(liveSyncInfo.projectDir, device.deviceInfo.platform, options);
			await this.$buildController.prepareAndBuild(buildData);
			await this.$deviceInstallAppService.installOnDevice(device, buildData);
		};

		await this.$devicesService.execute(executeAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier));
	}
}
$injector.register("deployController", DeployController);
