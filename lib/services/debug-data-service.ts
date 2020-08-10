import { IProjectData } from "../definitions/project";
import { IDebugOptions, IDebugData, IDebugDataService } from "../definitions/debug";

export class DebugDataService implements IDebugDataService {
	constructor(
		private $devicesService: Mobile.IDevicesService
	) { }

	public getDebugData(deviceIdentifier: string, projectData: IProjectData, debugOptions: IDebugOptions): IDebugData {
		const device = this.$devicesService.getDeviceByIdentifier(deviceIdentifier);

		return {
			applicationIdentifier: projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()],
			projectDir: projectData.projectDir,
			deviceIdentifier,
			projectName: projectData.projectName,
			debugOptions
		};
	}
}

$injector.register("debugDataService", DebugDataService);
