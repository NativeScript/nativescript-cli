export class DeployController {

	constructor(
		private $buildDataService: IBuildDataService,
		private $buildController: IBuildController,
		private $deviceInstallAppService: IDeviceInstallAppService,
		private $devicesService: Mobile.IDevicesService
	) { }

	public async deploy(data: IRunData): Promise<void> {
		const { projectDir, liveSyncInfo, deviceDescriptors } = data;

		const executeAction = async (device: Mobile.IDevice) => {
			const buildData = this.$buildDataService.getBuildData(projectDir, device.deviceInfo.platform, liveSyncInfo);
			await this.$buildController.prepareAndBuild(buildData);
			await this.$deviceInstallAppService.installOnDevice(device, buildData);
		};

		await this.$devicesService.execute(executeAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier));
	}
}
$injector.register("deployController", DeployController);
