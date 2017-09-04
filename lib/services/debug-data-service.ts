export class DebugDataService implements IDebugDataService {
	constructor(
		private $devicesService: Mobile.IDevicesService
	) { }
	public createDebugData(projectData: IProjectData, options: IDeviceIdentifier): IDebugData {
		const device = this.$devicesService.getDeviceByIdentifier(options.device);

		return {
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			projectDir: projectData.projectDir,
			deviceIdentifier: options.device,
			projectName: projectData.projectName
		};
	}
}

$injector.register("debugDataService", DebugDataService);
