///<reference path="../.d.ts"/>
"use strict";
import * as deviceAppDataBaseLib from "../common/mobile/device-app-data/device-app-data-base";
import Future = require("fibers/future");

export class IOSAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements Mobile.IDeviceAppData  {
	private static DEVICE_PROJECT_ROOT_PATH = "Library/Application Support/LiveSync";

	constructor(_appIdentifier: string) {
		super(_appIdentifier);
	}

	public get deviceProjectRootPath(): string {
		return this.getDeviceProjectRootPath(IOSAppIdentifier.DEVICE_PROJECT_ROOT_PATH);
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}
}

export class AndroidAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements Mobile.IDeviceAppData {
	constructor(_appIdentifier: string) {
		super(_appIdentifier);
	}

	public get deviceProjectRootPath(): string {
		let options: IOptions = $injector.resolve("options");
		let syncFolderName = options.watch ? "sync" : "fullsync";
		return `/data/local/tmp/${this.appIdentifier}/${syncFolderName}`;
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}
}

export class AndroidCompanionAppIdentifier extends deviceAppDataBaseLib.CompanionDeviceAppDataBase implements Mobile.IDeviceAppData {
	private static APP_IDENTIFIER = "com.telerik.NativeScript";

	constructor() {
		super(AndroidCompanionAppIdentifier.APP_IDENTIFIER);
	}

	public get deviceProjectRootPath(): string {
		return `/mnt/sdcard/Android/data/${this.appIdentifier}/files/12590FAA-5EDD-4B12-856D-F52A0A1599F2`;
	}
}

export class DeviceAppDataProvider implements Mobile.IDeviceAppDataProvider {
	public createFactoryRules(): IDictionary<Mobile.IDeviceAppDataFactoryRule> {
		return {
			iOS: {
				vanilla: IOSAppIdentifier
			},
			Android: {
				vanilla: AndroidAppIdentifier,
				companion: AndroidCompanionAppIdentifier
			}
		};
	}
}
$injector.register("deviceAppDataProvider", DeviceAppDataProvider);
