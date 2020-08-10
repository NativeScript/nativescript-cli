import { fromWindowsRelativePathToUnix } from "./common/helpers";
import { APP_FOLDER_NAME } from "./constants";
import { LiveSyncPaths } from "./common/constants";
import * as path from "path";
import { IErrors } from "./common/declarations";
import { injector } from "./common/yok";

export class DevicePathProvider implements IDevicePathProvider {
	constructor(private $mobileHelper: Mobile.IMobileHelper,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $errors: IErrors) {
	}

	public async getDeviceProjectRootPath(device: Mobile.IDevice, options: IDeviceProjectRootOptions): Promise<string> {
		let projectRoot = "";
		if (this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
			projectRoot = device.isEmulator ? await this.$iOSSimResolver.iOSSim.getApplicationPath(device.deviceInfo.identifier, options.appIdentifier) : LiveSyncPaths.IOS_DEVICE_PROJECT_ROOT_PATH;

			if (!projectRoot) {
				this.$errors.fail("Unable to get application path on device.");
			}

			if (!options.getDirname) {
				projectRoot = path.join(projectRoot, APP_FOLDER_NAME);
			}
		} else if (this.$mobileHelper.isAndroidPlatform(device.deviceInfo.platform)) {
			projectRoot = `${LiveSyncPaths.ANDROID_TMP_DIR_NAME}/${options.appIdentifier}`;
			if (!options.getDirname) {
				const hashService = (<Mobile.IAndroidDevice>device).fileSystem.getDeviceHashService(options.appIdentifier);
				const hashFile = await hashService.doesShasumFileExistsOnDevice();
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

injector.register("devicePathProvider", DevicePathProvider);
