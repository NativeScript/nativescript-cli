///<reference path="../.d.ts"/>
"use strict";
import * as deviceAppDataBaseLib from "../common/mobile/device-app-data/device-app-data-base";
import Future = require("fibers/future");
import * as path from "path";

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
		private $options: IOptions) {
		super(_appIdentifier);
	}

	public get deviceProjectRootPath(): string {
		let syncFolderName = this.$options.watch ? "sync" : "fullsync";
		return `/data/local/tmp/${this.appIdentifier}/${syncFolderName}`;
	}

	public isLiveSyncSupported(): IFuture<boolean> {
		return Future.fromResult(true);
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
