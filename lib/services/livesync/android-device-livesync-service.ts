import { DeviceAndroidDebugBridge } from "../../common/mobile/android/device-android-debug-bridge";
import { AndroidDeviceHashService } from "../../common/mobile/android/android-device-hash-service";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import * as helpers from "../../common/helpers";
import { LiveSyncPaths } from "../../constants";
import { cache } from "../../common/decorators";
import * as path from "path";
import * as net from "net";

export class AndroidDeviceLiveSyncService extends DeviceLiveSyncServiceBase implements IAndroidNativeScriptDeviceLiveSyncService, INativeScriptDeviceLiveSyncService {
	private static BACKEND_PORT = 18182;
	private device: Mobile.IAndroidDevice;

	constructor(_device: Mobile.IDevice,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicePathProvider: IDevicePathProvider,
		private $injector: IInjector,
		protected $platformsData: IPlatformsData) {
		super($platformsData);
		this.device = <Mobile.IAndroidDevice>(_device);
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		const deviceAppData = liveSyncInfo.deviceAppData;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;
		const deviceProjectRootDirname = await this.$devicePathProvider.getDeviceProjectRootPath(liveSyncInfo.deviceAppData.device, {
			appIdentifier: liveSyncInfo.deviceAppData.appIdentifier,
			getDirname: true
		});

		await this.device.adb.executeShellCommand(
			["chmod",
				"777",
				path.dirname(deviceProjectRootDirname),
				deviceProjectRootDirname,
				`${deviceProjectRootDirname}/sync`]
		);

		const reloadedSuccessfully = await this.reloadApplicationFiles(deviceAppData, localToDevicePaths);

		const canExecuteFastSync = reloadedSuccessfully && !liveSyncInfo.isFullSync && !_.some(localToDevicePaths,
			(localToDevicePath: Mobile.ILocalToDevicePathData) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));

		if (!canExecuteFastSync) {
			return this.restartApplication(deviceAppData, projectData.projectName);
		}
	}

	private async cleanLivesyncDirectories(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});

		await this.device.adb.executeShellCommand(["rm", "-rf", await this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.FULLSYNC_DIR_NAME),
			this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.SYNC_DIR_NAME),
			await this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.REMOVEDSYNC_DIR_NAME)]);
	}

	private async restartApplication(deviceAppData: Mobile.IDeviceAppData, projectName: string): Promise<void> {
		const devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
		const devicePath = this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb");
		await this.device.adb.executeShellCommand(["rm", "-rf", devicePath]);

		await this.device.applicationManager.restartApplication({ appId: deviceAppData.appIdentifier, projectName });
	}

	public async beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});
		const deviceRootDir = path.dirname(deviceRootPath);
		const deviceRootBasename = path.basename(deviceRootPath);
		const listResult = await this.device.adb.executeShellCommand(["ls", "-l", deviceRootDir]);
		const regex = new RegExp(`^-.*${deviceRootBasename}$`, "m");
		const matchingFile = (listResult || "").match(regex);

		// Check if there is already a file with deviceRootBasename. If so, delete it as it breaks LiveSyncing.
		if (matchingFile && matchingFile[0] && _.startsWith(matchingFile[0], '-')) {
			await this.device.adb.executeShellCommand(["rm", "-f", deviceRootPath]);
		}

		await this.cleanLivesyncDirectories(deviceAppData);
	}

	private async reloadApplicationFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<boolean> {
		await this.device.adb.executeCommand(["forward", `tcp:${AndroidDeviceLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]);

		if (await this.awaitRuntimeReloadSuccessMessage()) {
			await this.cleanLivesyncDirectories(deviceAppData);
		} else {
			return false;
		}
		return true;
	}

	public async removeFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});

		for (const localToDevicePathData of localToDevicePaths) {
			const relativeUnixPath = _.trimStart(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
			const deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.REMOVEDSYNC_DIR_NAME, relativeUnixPath);
			await this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), " && ", "touch", deviceFilePath]);
		}

		await this.getDeviceHashService(deviceAppData.appIdentifier).removeHashes(localToDevicePaths);
	}

	@cache()
	public getDeviceHashService(appIdentifier: string): Mobile.IAndroidDeviceHashService {
		const adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
		return this.$injector.resolve(AndroidDeviceHashService, { adb, appIdentifier });
	}

	private async awaitRuntimeReloadSuccessMessage(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let isResolved = false;
			const socket = new net.Socket();

			socket.connect(AndroidDeviceLiveSyncService.BACKEND_PORT, '127.0.0.1', () => {
				socket.write(new Buffer([0, 0, 0, 1, 1]));
			});
			socket.on("data", (data: any) => {
				socket.destroy();
				resolve(true);
			});
			socket.on("error", () => {
				if (!isResolved) {
					isResolved = true;
					resolve(false);
				}
			});
			socket.on("close", () => {
				if (!isResolved) {
					isResolved = true;
					resolve(false);
				}
			});
		});
	}
}
