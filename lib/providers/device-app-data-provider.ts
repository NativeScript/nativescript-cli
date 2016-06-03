import * as deviceAppDataBaseLib from "../common/mobile/device-app-data/device-app-data-base";
import Future = require("fibers/future");
import * as path from "path";
import {AndroidDeviceHashService} from "../common/mobile/android/android-device-hash-service";
import {DeviceAndroidDebugBridge} from "../common/mobile/android/device-android-debug-bridge";

const SYNC_DIR_NAME = "sync";
const FULLSYNC_DIR_NAME = "fullsync";

export class IOSAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements Mobile.IDeviceAppData  {
	private static DEVICE_PROJECT_ROOT_PATH = "Library/Application Support/LiveSync/app";
	private _deviceProjectRootPath: string = null;

	constructor(_appIdentifier: string,
		public device: Mobile.IDevice,
		public platform: string,
		private $iOSSimResolver: Mobile.IiOSSimResolver) {
		super(_appIdentifier);
	}

	public get deviceProjectRootPath(): string {
		if (!this._deviceProjectRootPath) {
			if (this.device.isEmulator) {
				let applicationPath = this.$iOSSimResolver.iOSSim.getApplicationPath(this.device.deviceInfo.identifier, this.appIdentifier);
				this._deviceProjectRootPath = path.join(applicationPath, "app");
			} else {
				this._deviceProjectRootPath = IOSAppIdentifier.DEVICE_PROJECT_ROOT_PATH;
			}
		}

		return this.getDeviceProjectRootPath(this._deviceProjectRootPath);
	}

	public isLiveSyncSupported(): IFuture<boolean> {
		return Future.fromResult(true);
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

	public get deviceProjectRootPath(): string {
		if(!this._deviceProjectRootPath) {
			let syncFolderName = this.getSyncFolderName().wait();
			this._deviceProjectRootPath = `/data/local/tmp/${this.appIdentifier}/${syncFolderName}`;
		}

		return this._deviceProjectRootPath;
	}

	public isLiveSyncSupported(): IFuture<boolean> {
		return Future.fromResult(true);
	}

	private getSyncFolderName(): IFuture<string> {
		return ((): string =>{
			let adb =  this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
			let deviceHashService = this.$injector.resolve(AndroidDeviceHashService, {adb: adb, appIdentifier: this.appIdentifier});
			let hashFile = this.$options.force ? null : deviceHashService.doesShasumFileExistsOnDevice().wait();
			return this.$options.watch || hashFile ? SYNC_DIR_NAME : FULLSYNC_DIR_NAME;
		}).future<string>()();
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
