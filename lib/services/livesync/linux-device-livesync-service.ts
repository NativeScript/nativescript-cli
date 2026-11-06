import * as fs from "fs";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import { LinuxApplicationManager } from "../../common/mobile/linux/linux-application-manager";

export class LinuxDeviceLiveSyncService
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

	private get applicationManager(): LinuxApplicationManager {
		return this.device.applicationManager as LinuxApplicationManager;
	}

	public async restartApplication(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo,
	): Promise<void> {
		this.$logger.info(
			`[Linux LiveSync] Restarting application ${projectData.projectName}`,
		);
		await this.applicationManager.restartApplication({
			appId: projectData.projectIdentifiers?.linux ?? projectData.projectId,
			projectName: projectData.projectName,
			projectDir: projectData.projectDir,
			waitForDebugger: liveSyncInfo?.waitForDebugger,
			debugMode: liveSyncInfo?.debugMode,
		});
	}

	public async shouldRestart(
		_projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo,
	): Promise<boolean> {
		return (
			!liveSyncInfo.useHotModuleReload ||
			!!liveSyncInfo.isFullSync ||
			!!liveSyncInfo.waitForDebugger
		);
	}

	public async tryRefreshApplication(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo,
	): Promise<boolean> {
		if (
			!liveSyncInfo.useHotModuleReload ||
			!this.applicationManager.isRunning()
		) {
			return false;
		}
		// vite: the app pulls changes from the dev server itself
		if (projectData.bundler === "vite") {
			return true;
		}
		// webpack: the hot-update files are synced, the runtime applies them on SIGUSR1
		return this.applicationManager.signalLiveSync();
	}

	public async removeFiles(
		_deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
	): Promise<void> {
		for (const pathData of localToDevicePaths) {
			const devicePath = pathData.getDevicePath();
			if (fs.existsSync(devicePath)) {
				fs.unlinkSync(devicePath);
			}
		}
	}
}
