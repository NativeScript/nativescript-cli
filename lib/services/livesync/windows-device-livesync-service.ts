import * as fs from "fs";
import { spawnSync } from "child_process";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import { WindowsApplicationManager } from "../../common/mobile/windows/windows-application-manager";

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
		// A full sync (also the CLI's recovery after a failed hot update) needs a fresh start.
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
		// An app that isn't running yet (first sync after install) must still be launched.
		if (
			!liveSyncInfo.useHotModuleReload ||
			!this.isAppRunning(projectData.projectName)
		) {
			return false;
		}
		// Vite HMR: the app pulls every change from the dev server over its WebSocket
		// (HTTP ES modules), so a synced file never needs a restart.
		if (projectData.bundler === "vite") {
			return true;
		}
		// Webpack HMR: the hot-update files are already in bin\app; tell the app to apply them.
		const appId =
			projectData.projectIdentifiers?.["windows"] ?? projectData.projectId;
		return (
			this.device.applicationManager as WindowsApplicationManager
		).signalLiveSync(appId);
	}

	private isAppRunning(processName: string): boolean {
		const result = spawnSync(
			"tasklist",
			["/FI", `IMAGENAME eq ${processName}.exe`, "/NH", "/FO", "CSV"],
			{ encoding: "utf8", windowsHide: true },
		);
		return (result.stdout || "").toLowerCase().includes(`"${processName.toLowerCase()}.exe"`);
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
