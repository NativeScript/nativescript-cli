import { fromWindowsRelativePathToUnix } from "./common/helpers";
import { APP_FOLDER_NAME, LiveSyncPaths } from "./constants";
import { AndroidDeviceLiveSyncService } from "./services/livesync/android-device-livesync-service";
import * as path from "path";

export class DevicePathProvider implements IDevicePathProvider {
	constructor(private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $errors: IErrors) {
	}

	public async getDeviceProjectRootPath(device: Mobile.IDevice, options: IDeviceProjectRootOptions): Promise<string> {
		let projectRoot = "";
		if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
			projectRoot = device.isEmulator ? await this.$iOSSimResolver.iOSSim.getApplicationPath(device.deviceInfo.identifier, options.appIdentifier) : LiveSyncPaths.IOS_DEVICE_PROJECT_ROOT_PATH;

			if (!projectRoot) {
				this.$errors.failWithoutHelp("Unable to get application path on device.");
			}

			if (!options.getDirname) {
				projectRoot = path.join(projectRoot, APP_FOLDER_NAME);
			}
		} else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			projectRoot = `/data/local/tmp/${options.appIdentifier}`;
			if (!options.getDirname) {
				const deviceLiveSyncService = this.$injector.resolve<AndroidDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { _device: device });
				const hashService = deviceLiveSyncService.getDeviceHashService(options.appIdentifier);
				const hashFile = options.syncAllFiles ? null : await hashService.doesShasumFileExistsOnDevice();
				const syncFolderName = options.watch || hashFile ? LiveSyncPaths.SYNC_DIR_NAME : LiveSyncPaths.FULLSYNC_DIR_NAME;
				projectRoot = path.join(projectRoot, syncFolderName);
			}
		}

		return fromWindowsRelativePathToUnix(projectRoot);
	}

	public getDeviceSyncZipPath(device: Mobile.IDevice): string {
		return this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform) && !device.isEmulator ? LiveSyncPaths.IOS_DEVICE_SYNC_ZIP_PATH : undefined;
	}
}

$injector.register("devicePathProvider", DevicePathProvider);
