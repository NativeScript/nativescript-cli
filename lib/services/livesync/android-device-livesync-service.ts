import { DeviceAndroidDebugBridge } from "../../common/mobile/android/device-android-debug-bridge";
import { AndroidDeviceHashService } from "../../common/mobile/android/android-device-hash-service";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import * as helpers from "../../common/helpers";
import { LiveSyncPaths, APP_FOLDER_NAME } from "../../constants";
import { cache } from "../../common/decorators";
import * as path from "path";
import * as net from "net";
let liveSyncTool = require("livesync-tool");

export class AndroidDeviceLiveSyncService extends DeviceLiveSyncServiceBase implements IAndroidNativeScriptDeviceLiveSyncService, INativeScriptDeviceLiveSyncService {
	private static BACKEND_PORT = 18182;
	private device: Mobile.IAndroidDevice;
	private static newLiveSyncConnected: boolean = false;
	private liveSyncTool: any;
	private static appDestinationDirectoryPath: string;
	private static appIdentifier: string;

	constructor(_device: Mobile.IDevice,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicePathProvider: IDevicePathProvider,
		private $injector: IInjector,
		protected $platformsData: IPlatformsData) {
		super($platformsData);
		this.liveSyncTool = liveSyncTool;
		this.device = <Mobile.IAndroidDevice>(_device);
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		const deviceAppData = liveSyncInfo.deviceAppData;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;
		const deviceProjectRootDirname = await this.$devicePathProvider.getDeviceProjectRootPath(liveSyncInfo.deviceAppData.device, {
			appIdentifier: liveSyncInfo.deviceAppData.appIdentifier,
			getDirname: true
		});

		await this.device.adb.executeShellCommand(
			["chmod",
				"777",
				path.dirname(deviceProjectRootDirname),
				deviceProjectRootDirname,
				`${deviceProjectRootDirname}/sync`]
		);

		const reloadedSuccessfully = AndroidDeviceLiveSyncService.newLiveSyncConnected ? true : await this.reloadApplicationFiles(deviceAppData, localToDevicePaths);

		const canExecuteFastSync = reloadedSuccessfully && !liveSyncInfo.isFullSync && !_.some(localToDevicePaths,
			(localToDevicePath: Mobile.ILocalToDevicePathData) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));

		if (!canExecuteFastSync) {
			return this.restartApplication(deviceAppData);
		}
	}

	public async sendFiles(filesToSend: Mobile.ILocalToDevicePathData[]): Promise<void> {
		await this.initTool();

		if (AndroidDeviceLiveSyncService.newLiveSyncConnected) {
			await this.liveSyncTool.sendFilesArray(filesToSend);
			await this.liveSyncTool.sendDoSyncOperation();
		}
	}

	private async cleanLivesyncDirectories(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});

		await this.device.adb.executeShellCommand(["rm", "-rf", await this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.FULLSYNC_DIR_NAME),
			this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.SYNC_DIR_NAME),
			await this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.REMOVEDSYNC_DIR_NAME)]);
	}

	private async restartApplication(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		const devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files"`;
		const devicePath = this.$mobileHelper.buildDevicePath(path.resolve(devicePathRoot, "..", "code_cache", "secondary-dexes", "proxyThumb"));
		await this.device.adb.executeShellCommand(["rm", "-rf", devicePath]);

		await this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
	}

	public async beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData, platformData: IPlatformData): Promise<void> {

		while (true) {
			let res = await this.device.adb.executeShellCommand(["ps", "|", "grep", deviceAppData.appIdentifier]);
			if (!!res) {
				break;
			} else {
				await this.restartApplication(deviceAppData);
			}
		}

		AndroidDeviceLiveSyncService.appIdentifier = deviceAppData.appIdentifier;
		AndroidDeviceLiveSyncService.appDestinationDirectoryPath = platformData.appDestinationDirectoryPath;
		await this.initTool();

		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});
		const deviceRootDir = path.dirname(deviceRootPath);
		const deviceRootBasename = path.basename(deviceRootPath);
		const listResult = await this.device.adb.executeShellCommand(["ls", "-l", deviceRootDir]);
		const regex = new RegExp(`^-.*${deviceRootBasename}$`, "m");
		const matchingFile = (listResult || "").match(regex);

		// Check if there is already a file with deviceRootBasename. If so, delete it as it breaks LiveSyncing.
		if (matchingFile && matchingFile[0] && _.startsWith(matchingFile[0], '-')) {
			await this.device.adb.executeShellCommand(["rm", "-f", deviceRootPath]);
		}

		await this.cleanLivesyncDirectories(deviceAppData);
	}

	private async initTool(): Promise<void> {
		try {
			function myErrorHandler() {
				//TODO: plamen5kov: implement later if needed
			}
			let configurations = {
				fullApplicationName: AndroidDeviceLiveSyncService.appIdentifier,//deviceAppData.appIdentifier,
				port: AndroidDeviceLiveSyncService.BACKEND_PORT,
				errorHandler: myErrorHandler,
				// deviceIdentifier: "emulator-5556",
				baseDir: path.join(AndroidDeviceLiveSyncService.appDestinationDirectoryPath, APP_FOLDER_NAME) //path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME)
			}
			AndroidDeviceLiveSyncService.newLiveSyncConnected = await liveSyncTool.init(configurations);
		} catch (e) {
			AndroidDeviceLiveSyncService.newLiveSyncConnected = false;
		}
	}

	private async reloadApplicationFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<boolean> {
		await this.device.adb.executeCommand(["forward", `tcp:${AndroidDeviceLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]);

		if (await this.awaitRuntimeReloadSuccessMessage()) {
			await this.cleanLivesyncDirectories(deviceAppData);
		} else {
			return false;
		}
		return true;
	}

	public async removeFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});

		// remove files if  this.newLiveSyncConnected...
		for (const localToDevicePathData of localToDevicePaths) {
			const relativeUnixPath = _.trimStart(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
			const deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.REMOVEDSYNC_DIR_NAME, relativeUnixPath);
			await this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), " && ", "touch", deviceFilePath]);
		}

		await this.getDeviceHashService(deviceAppData.appIdentifier).removeHashes(localToDevicePaths);
	}

	@cache()
	public getDeviceHashService(appIdentifier: string): Mobile.IAndroidDeviceHashService {
		const adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
		return this.$injector.resolve(AndroidDeviceHashService, { adb, appIdentifier });
	}

	private async awaitRuntimeReloadSuccessMessage(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let isResolved = false;
			const socket = new net.Socket();

			socket.connect(AndroidDeviceLiveSyncService.BACKEND_PORT, '127.0.0.1', () => {
				socket.write(new Buffer([0, 0, 0, 1, 1]));
			});
			socket.on("data", (data: any) => {
				socket.destroy();
				resolve(true);
			});
			socket.on("error", () => {
				if (!isResolved) {
					isResolved = true;
					resolve(false);
				}
			});
			socket.on("close", () => {
				if (!isResolved) {
					isResolved = true;
					resolve(false);
				}
			});
		});
	}
}
