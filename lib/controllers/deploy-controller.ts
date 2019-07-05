export class DeployController {

	constructor(
		private $deviceInstallAppService: IDeviceInstallAppService,
		private $devicesService: Mobile.IDevicesService,
		private $prepareController: IPrepareController
	) { }

	public async deploy(data: IDeployData): Promise<void> {
		const { buildData, deviceDescriptors } = data;

		const executeAction = async (device: Mobile.IDevice) => {
			await this.$prepareController.prepare(buildData);
			const deviceDescriptor = _.find(deviceDescriptors, dd => dd.identifier === device.deviceInfo.identifier);
			const packageFilePath = await deviceDescriptor.buildAction();
			await this.$deviceInstallAppService.installOnDevice(device, { ...buildData, buildForDevice: !device.isEmulator }, packageFilePath);
		};

		await this.$devicesService.execute(executeAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier));
	}
}
$injector.register("deployController", DeployController);
