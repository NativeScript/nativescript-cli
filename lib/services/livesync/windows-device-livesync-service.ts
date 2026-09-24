import * as fs from "fs";
import { spawnSync } from "child_process";
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
		return !liveSyncInfo.useHotModuleReload || !!liveSyncInfo.waitForDebugger;
	}

	public async tryRefreshApplication(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo,
	): Promise<boolean> {
		// Vite HMR: a running app pulls every change from the dev server over its WebSocket
		// (HTTP ES modules), so a synced file never needs a restart. But an app that isn't
		// running yet (first sync after install) must still be launched. Webpack HMR isn't
		// implemented for Windows: signal a restart.
		return (
			projectData.bundler === "vite" &&
			!!liveSyncInfo.useHotModuleReload &&
			this.isAppRunning(projectData.projectName)
		);
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
