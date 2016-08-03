import {DeviceAndroidDebugBridge} from "../../common/mobile/android/device-android-debug-bridge";
import {AndroidDeviceHashService} from "../../common/mobile/android/android-device-hash-service";
import Future = require("fibers/future");
import * as helpers from "../../common/helpers";
import * as path from "path";
import * as net from "net";

class AndroidLiveSyncService implements IDeviceLiveSyncService {
	private static BACKEND_PORT = 18182;
	private device: Mobile.IAndroidDevice;

	constructor(_device: Mobile.IDevice,
		private $fs: IFileSystem,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $injector: IInjector,
		private $projectData: IProjectData,
		private $androidDebugService: IDebugService,
		private $liveSyncProvider: ILiveSyncProvider) {
		this.device = <Mobile.IAndroidDevice>(_device);
	}

	public get debugService(): IDebugService {
		return this.$androidDebugService;
	}

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], forceExecuteFullSync: boolean): IFuture<void> {
		let canExecuteFastSync = !forceExecuteFullSync && !_.some(localToDevicePaths, (localToDevicePath:any) => !this.$liveSyncProvider.canExecuteFastSync(localToDevicePath.getLocalPath(), deviceAppData.platform));

		if (canExecuteFastSync) {
			return this.reloadPage(deviceAppData, localToDevicePaths);
		}

		return this.restartApplication(deviceAppData);
	}

	private restartApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
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
			let deviceRootPath = this.getDeviceRootPath(deviceAppData.appIdentifier),
				deviceRootDir = path.dirname(deviceRootPath),
				deviceRootBasename = path.basename(deviceRootPath),
				listResult = this.device.adb.executeShellCommand(["ls", "-l", deviceRootDir]).wait(),
				regex = new RegExp(`^-.*${deviceRootBasename}$`, "m"),
				matchingFile = (listResult || "").match(regex);

			// Check if there is already a file with deviceRootBasename. If so, delete it as it breaks LiveSyncing.
			if (matchingFile && matchingFile[0] && _.startsWith(matchingFile[0], '-')) {
				this.device.adb.executeShellCommand(["rm", "-f", deviceRootPath]).wait();
			}

			this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "fullsync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "sync"),
				this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync")]).wait();
		}).future<void>()();
	}

	private reloadPage(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			this.device.adb.executeCommand(["forward", `tcp:${AndroidLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]).wait();
			this.sendPageReloadMessage().wait();
		}).future<void>()();
	}

	public removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			let deviceRootPath = this.getDeviceRootPath(appIdentifier);
			_.each(localToDevicePaths, localToDevicePathData => {
				let relativeUnixPath = _.trimStart(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
				let deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync", relativeUnixPath);
				this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), "&&", "touch", deviceFilePath]).wait();
			});

			this.deviceHashService.removeHashes(localToDevicePaths).wait();
		}).future<void>()();
	}

	public afterInstallApplicationAction(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<boolean> {
		return (() => {
			 this.deviceHashService.uploadHashFileToDevice(localToDevicePaths).wait();
			 return false;
		}).future<boolean>()();
	}

	private getDeviceRootPath(appIdentifier: string): string {
		return `/data/local/tmp/${appIdentifier}`;
	}

	private sendPageReloadMessage(): IFuture<void> {
		let future = new Future<void>();
		let socket = new net.Socket();
		socket.connect(AndroidLiveSyncService.BACKEND_PORT, '127.0.0.1', () => {
			socket.write(new Buffer([0, 0, 0, 1, 1]));
		});
		socket.on("data", (data: any) => {
			socket.destroy();
			future.return();
		});
		return future;
	}

	private _deviceHashService: Mobile.IAndroidDeviceHashService;
	private get deviceHashService(): Mobile.IAndroidDeviceHashService {
		if (!this._deviceHashService) {
			let adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
			this._deviceHashService = this.$injector.resolve(AndroidDeviceHashService, { adb: adb, appIdentifier: this.$projectData.projectId });
		}

		return this._deviceHashService;
	}
}
$injector.register("androidLiveSyncServiceLocator", { factory: AndroidLiveSyncService });
