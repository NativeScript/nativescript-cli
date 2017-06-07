import { fromWindowsRelativePathToUnix } from "./common/helpers";
import { IOS_DEVICE_SYNC_ZIP_PATH, IOS_DEVICE_PROJECT_ROOT_PATH, SYNC_DIR_NAME, FULLSYNC_DIR_NAME } from "./constants";
import { AndroidDeviceLiveSyncService } from "./services/livesync/android-device-livesync-service";
import * as path from "path";

export class DevicePathProvider implements IDevicePathProvider {
	constructor(private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector,
		private $iOSSimResolver: Mobile.IiOSSimResolver) {
	}

	public async getDeviceBuildInfoDirname(device: Mobile.IDevice, appIdentifier: string): Promise<string> {
		let result = "";
		if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
			result = path.dirname(await this.getDeviceProjectRootPath(device, { appIdentifier }));
		} else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			result = `/data/local/tmp/${appIdentifier}`;
		}

		return result;
	}

	public async getDeviceProjectRootPath(device: Mobile.IDevice, options: IDeviceProjectRootOptions): Promise<string> {
		let projectRoot = "";
		if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
			if (device.isEmulator) {
				let applicationPath = this.$iOSSimResolver.iOSSim.getApplicationPath(device.deviceInfo.identifier, options.appIdentifier);
				projectRoot = path.join(applicationPath, "app");
			} else {
				projectRoot = IOS_DEVICE_PROJECT_ROOT_PATH;
			}
		} else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			const deviceLiveSyncService = this.$injector.resolve<AndroidDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { _device: device });
			const hashService = deviceLiveSyncService.getDeviceHashService(options.appIdentifier);
			const hashFile = options.syncAllFiles ? null : await hashService.doesShasumFileExistsOnDevice();
			const syncFolderName = options.watch || hashFile ? SYNC_DIR_NAME : FULLSYNC_DIR_NAME;
			projectRoot = `/data/local/tmp/${options.appIdentifier}/${syncFolderName}`;
		}

		return fromWindowsRelativePathToUnix(projectRoot);
	}

	public getDeviceSyncZipPath(device: Mobile.IDevice): string {
		return this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) && !device.isEmulator ? IOS_DEVICE_SYNC_ZIP_PATH : undefined;
	}
}

$injector.register("devicePathProvider", DevicePathProvider);
