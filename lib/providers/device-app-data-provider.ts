import * as deviceAppDataBaseLib from "../common/mobile/device-app-data/device-app-data-base";
import * as path from "path";
import { AndroidDeviceHashService } from "../common/mobile/android/android-device-hash-service";
import { DeviceAndroidDebugBridge } from "../common/mobile/android/device-android-debug-bridge";

const SYNC_DIR_NAME = "sync";
const FULLSYNC_DIR_NAME = "fullsync";

export class IOSAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements Mobile.IDeviceAppData {
	private static DEVICE_PROJECT_ROOT_PATH = "Library/Application Support/LiveSync/app";
	private _deviceProjectRootPath: string = null;

	constructor(_appIdentifier: string,
		public device: Mobile.IDevice,
		public platform: string,
		private $iOSSimResolver: Mobile.IiOSSimResolver) {
		super(_appIdentifier);
	}

	public async getDeviceProjectRootPath(): Promise<string> {
		if (!this._deviceProjectRootPath) {
			if (this.device.isEmulator) {
				let applicationPath = this.$iOSSimResolver.iOSSim.getApplicationPath(this.device.deviceInfo.identifier, this.appIdentifier);
				this._deviceProjectRootPath = path.join(applicationPath, "app");
			} else {
				this._deviceProjectRootPath = IOSAppIdentifier.DEVICE_PROJECT_ROOT_PATH;
			}
		}

		return this._getDeviceProjectRootPath(this._deviceProjectRootPath);
	}

	public get deviceSyncZipPath(): string {
		if (this.device.isEmulator) {
			return undefined;
		} else {
			return "Library/Application Support/LiveSync/sync.zip";
		}
	}

	public async isLiveSyncSupported(): Promise<boolean> {
		return true;
	}
}

export class AndroidAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements Mobile.IDeviceAppData {
	constructor(_appIdentifier: string,
		public device: Mobile.IDevice,
		public platform: string,
		private $options: IOptions,
		private $injector: IInjector) {
		super(_appIdentifier);
	}

	private _deviceProjectRootPath: string;

	public async getDeviceProjectRootPath(): Promise<string> {
		if (!this._deviceProjectRootPath) {
			let syncFolderName = await this.getSyncFolderName();
			this._deviceProjectRootPath = `/data/local/tmp/${this.appIdentifier}/${syncFolderName}`;
		}

		return this._deviceProjectRootPath;
	}

	public async isLiveSyncSupported(): Promise<boolean> {
		return true;
	}

	private async getSyncFolderName(): Promise<string> {
		let adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
		let deviceHashService: AndroidDeviceHashService = this.$injector.resolve(AndroidDeviceHashService, { adb: adb, appIdentifier: this.appIdentifier });
		let hashFile = this.$options.force ? null : await deviceHashService.doesShasumFileExistsOnDevice();
		return this.$options.watch || hashFile ? SYNC_DIR_NAME : FULLSYNC_DIR_NAME;
	}
}

export class DeviceAppDataProvider implements Mobile.IDeviceAppDataProvider {
	public createFactoryRules(): IDictionary<Mobile.IDeviceAppDataFactoryRule> {
		return {
			iOS: {
				vanilla: IOSAppIdentifier
			},
			Android: {
				vanilla: AndroidAppIdentifier
			}
		};
	}
}
$injector.register("deviceAppDataProvider", DeviceAppDataProvider);
