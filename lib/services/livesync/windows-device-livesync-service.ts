import * as fs from "fs";
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
		this.$logger.info(
			`[Windows LiveSync] Restarting application ${projectData.projectName}`,
		);

		const appId =
			projectData.projectIdentifiers?.["windows"] ?? projectData.projectId;

		await this.device.applicationManager.restartApplication({
			appId,
			projectName: projectData.projectName,
			projectDir: projectData.projectDir,
			waitForDebugger: _liveSyncInfo?.waitForDebugger,
			debugMode: _liveSyncInfo?.debugMode,
		} as Mobile.IStartApplicationData);
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
			if (fs.existsSync(devicePath)) {
				fs.unlinkSync(devicePath);
			}
		}
	}
}
