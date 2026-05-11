import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";

export class WindowsDeviceLiveSyncService
	extends DeviceLiveSyncServiceBase
	implements INativeScriptDeviceLiveSyncService
{
	constructor(
		protected platformsDataService: IPlatformsDataService,
		protected device: Mobile.IDevice,
		private $logger: ILogger,
	) {
		super(platformsDataService, device);
	}

	public async restartApplication(
		projectData: IProjectData,
		_liveSyncInfo: ILiveSyncResultInfo,
	): Promise<void> {
		// TODO: kill the running Windows app process and relaunch it
		this.$logger.info(
			`[Windows LiveSync] Restart required for ${projectData.projectName}`,
		);
	}

	public async shouldRestart(
		_projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo,
	): Promise<boolean> {
		return !liveSyncInfo.useHotModuleReload;
	}

	public async tryRefreshApplication(
		_projectData: IProjectData,
		_liveSyncInfo: ILiveSyncResultInfo,
	): Promise<boolean> {
		// HMR not yet implemented for Windows — signal full restart
		return false;
	}

	public async removeFiles(
		_deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
	): Promise<void> {
		for (const localToDevicePathData of localToDevicePaths) {
			const devicePath = localToDevicePathData.getDevicePath();
			if (require("fs").existsSync(devicePath)) {
				require("fs").unlinkSync(devicePath);
			}
		}
	}
}
