///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import * as helpers from "../../common/helpers";
import liveSyncServiceBaseLib = require("./livesync-service-base");
import * as path from "path";
import * as net from "net";

class AndroidLiveSyncService extends liveSyncServiceBaseLib.LiveSyncServiceBase<Mobile.IAndroidDevice> implements IPlatformLiveSyncService {
	private static BACKEND_PORT = 18181;

	constructor(_device: Mobile.IDevice,
		private $fs: IFileSystem,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions) {
		super(_device);
	}

	public restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			this.device.adb.executeShellCommand(["chmod", "777", deviceAppData.deviceProjectRootPath, `/data/local/tmp/${deviceAppData.appIdentifier}`]).wait();

			let devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
			let devicePath = this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb");
			this.device.adb.executeShellCommand(["rm", "-rf", devicePath]).wait();

			this.device.applicationManager.restartApplication(deviceAppData.appIdentifier).wait();
		}).future<void>()();
	}

	public beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			let deviceRootPath = this.getDeviceRootPath(deviceAppData.appIdentifier);
			this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "fullsync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "sync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync")]).wait();
		}).future<void>()();
	}

	public reloadPage(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			this.device.adb.executeCommand(["forward", `tcp:${AndroidLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]).wait();
			this.sendPageReloadMessage().wait();
		}).future<void>()();
	}

	public removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			let deviceRootPath = this.getDeviceRootPath(appIdentifier);
			_.each(localToDevicePaths, localToDevicePathData => {
				let relativeUnixPath = _.trimLeft(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
				let deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync", relativeUnixPath);
				this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), "&&", "touch", deviceFilePath]).wait();
			});
		}).future<void>()();
	}

	private getDeviceRootPath(appIdentifier: string): string {
		return `/data/local/tmp/${appIdentifier}`;
	}

	private sendPageReloadMessage(): IFuture<void> {
		let future = new Future<void>();

		let socket = new net.Socket();
		socket.connect(AndroidLiveSyncService.BACKEND_PORT, '127.0.0.1', () => {
			try {
				socket.write(new Buffer([0, 0, 0, 1, 1]));
 				future.return();
			} catch(e) {
				future.throw(e);
			} finally {
				socket.destroy();
			}
		});

		return future;
	}
}
$injector.register("androidLiveSyncServiceLocator", {factory: AndroidLiveSyncService});
