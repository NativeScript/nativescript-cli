import { DeviceAndroidDebugBridge } from "../../common/mobile/android/device-android-debug-bridge";
import { AndroidDeviceHashService } from "../../common/mobile/android/android-device-hash-service";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import * as helpers from "../../common/helpers";
import { SYNC_DIR_NAME, FULLSYNC_DIR_NAME, REMOVEDSYNC_DIR_NAME } from "../../constants";
import { cache } from "../../common/decorators";
import * as path from "path";
import * as net from "net";

export class AndroidDeviceLiveSyncService extends DeviceLiveSyncServiceBase implements IAndroidNativeScriptDeviceLiveSyncService {
	private static BACKEND_PORT = 18182;
	private device: Mobile.IAndroidDevice;

	constructor(_device: Mobile.IDevice,
		private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector,
		protected $platformsData: IPlatformsData) {
		super($platformsData);
		this.device = <Mobile.IAndroidDevice>(_device);
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		const deviceAppData = liveSyncInfo.deviceAppData;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;

		await this.device.adb.executeShellCommand(
			["chmod",
				"777",
				"/data/local/tmp/",
				`/data/local/tmp/${deviceAppData.appIdentifier}`,
				`/data/local/tmp/${deviceAppData.appIdentifier}/sync`]
		);

		const canExecuteFastSync = !liveSyncInfo.isFullSync && !_.some(localToDevicePaths,
			(localToDevicePath: Mobile.ILocalToDevicePathData) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));

		if (canExecuteFastSync) {
			return this.reloadPage(deviceAppData, localToDevicePaths);
		}

		return this.restartApplication(deviceAppData);
	}

	private async restartApplication(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		let devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
		let devicePath = this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb");
		await this.device.adb.executeShellCommand(["rm", "-rf", devicePath]);

		await this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
	}

	public async beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		let deviceRootPath = this.getDeviceRootPath(deviceAppData.appIdentifier),
			deviceRootDir = path.dirname(deviceRootPath),
			deviceRootBasename = path.basename(deviceRootPath),
			listResult = await this.device.adb.executeShellCommand(["ls", "-l", deviceRootDir]),
			regex = new RegExp(`^-.*${deviceRootBasename}$`, "m"),
			matchingFile = (listResult || "").match(regex);

		// Check if there is already a file with deviceRootBasename. If so, delete it as it breaks LiveSyncing.
		if (matchingFile && matchingFile[0] && _.startsWith(matchingFile[0], '-')) {
			await this.device.adb.executeShellCommand(["rm", "-f", deviceRootPath]);
		}

		this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, FULLSYNC_DIR_NAME),
			this.$mobileHelper.buildDevicePath(deviceRootPath, SYNC_DIR_NAME),
			await this.$mobileHelper.buildDevicePath(deviceRootPath, REMOVEDSYNC_DIR_NAME)]);
	}

	private async reloadPage(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		await this.device.adb.executeCommand(["forward", `tcp:${AndroidDeviceLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]);
		if (!await this.sendPageReloadMessage()) {
			await this.restartApplication(deviceAppData);
		}
	}

	public async removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectId: string): Promise<void> {
		let deviceRootPath = this.getDeviceRootPath(appIdentifier);

		for (let localToDevicePathData of localToDevicePaths) {
			let relativeUnixPath = _.trimStart(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
			let deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, REMOVEDSYNC_DIR_NAME, relativeUnixPath);
			await this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), " && ", "touch", deviceFilePath]);
		}

		await this.getDeviceHashService(projectId).removeHashes(localToDevicePaths);
	}

	@cache()
	public getDeviceHashService(appIdentifier: string): Mobile.IAndroidDeviceHashService {
		let adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
		return this.$injector.resolve(AndroidDeviceHashService, { adb, appIdentifier });
	}

	private getDeviceRootPath(appIdentifier: string): string {
		return `/data/local/tmp/${appIdentifier}`;
	}

	private async sendPageReloadMessage(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let isResolved = false;
			let socket = new net.Socket();

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
