import { DeviceInstallAppService } from "../services/device/device-install-app-service";
import { RunOnDevicesData } from "../data/run-on-devices-data";
import { BuildController } from "./build-controller";
import { BuildDataService } from "../services/build-data-service";

export class DeployOnDevicesController {

	constructor(
		private $buildDataService: BuildDataService,
		private $buildController: BuildController,
		private $deviceInstallAppService: DeviceInstallAppService,
		private $devicesService: Mobile.IDevicesService
	) { }

	public async deployOnDevices(data: RunOnDevicesData): Promise<void> {
		const { projectDir, liveSyncInfo, deviceDescriptors } = data;

		const executeAction = async (device: Mobile.IDevice) => {
			const buildData = this.$buildDataService.getBuildData(projectDir, device.deviceInfo.platform, liveSyncInfo);
			await this.$buildController.prepareAndBuildPlatform(buildData);
			await this.$deviceInstallAppService.installOnDevice(device, buildData);
		};

		await this.$devicesService.execute(executeAction, (device: Mobile.IDevice) => _.some(deviceDescriptors, deviceDescriptor => deviceDescriptor.identifier === device.deviceInfo.identifier));
	}
}
$injector.register("deployOnDevicesController", DeployOnDevicesController);
