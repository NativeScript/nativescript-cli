import * as deviceAppDataBaseLib from "../common/mobile/device-app-data/device-app-data-base";
import * as path from "path";

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

export class DeviceAppDataProvider implements Mobile.IDeviceAppDataProvider {
	public createFactoryRules(): IDictionary<Mobile.IDeviceAppDataFactoryRule> {
		return {
			iOS: {
				vanilla: IOSAppIdentifier
			}
		};
	}
}
$injector.register("deviceAppDataProvider", DeviceAppDataProvider);
