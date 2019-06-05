export class DeployController {

	constructor(
		private $buildController: IBuildController,
		private $deviceInstallAppService: IDeviceInstallAppService,
		private $devicesService: Mobile.IDevicesService
	) { }

	public async deploy(data: IDeployData): Promise<void> {
		const { buildData, deviceDescriptors } = data;

		const executeAction = async (device: Mobile.IDevice) => {
			await this.$buildController.prepareAndBuild(buildData);
			await this.$deviceInstallAppService.installOnDevice(device, buildData);
		};

		await this.$devicesService.execute(executeAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier));
	}
}
$injector.register("deployController", DeployController);
