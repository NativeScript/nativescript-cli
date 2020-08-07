import { AndroidDeviceLiveSyncServiceBase } from "./android-device-livesync-service-base";
import { performanceLog } from "../../common/decorators";
import * as helpers from "../../common/helpers";
import { LiveSyncPaths } from "../../common/constants";
import { ANDROID_DEVICE_APP_ROOT_TEMPLATE } from "../../constants";
import * as util from "util";
import * as path from "path";
import * as net from "net";
import { IInjector } from "../../common/definitions/yok";
import { IProjectData } from "../../definitions/project";
import { IPlatformsDataService } from "../../definitions/platform";
import { IFilesHashService } from "../../definitions/files-hash-service";
import * as _ from "lodash";

export class AndroidDeviceLiveSyncService extends AndroidDeviceLiveSyncServiceBase implements IAndroidNativeScriptDeviceLiveSyncService, INativeScriptDeviceLiveSyncService {
	private port: number;

	constructor(private $mobileHelper: Mobile.IMobileHelper,
		private $devicePathProvider: IDevicePathProvider,
		$injector: IInjector,
		private $androidProcessService: Mobile.IAndroidProcessService,
		protected platformsDataService: IPlatformsDataService,
		protected device: Mobile.IAndroidDevice,
		$filesHashService: IFilesHashService,
		$logger: ILogger) {
		super($injector, platformsDataService, $filesHashService, $logger, device);
	}

	public async transferFilesOnDevice(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		await this.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
	}

	public async transferDirectoryOnDevice(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<void> {
		await this.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
	}

	public async restartApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		const devicePathRoot = util.format(ANDROID_DEVICE_APP_ROOT_TEMPLATE, liveSyncInfo.deviceAppData.appIdentifier);
		const devicePath = this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb");
		await this.device.adb.executeShellCommand(["rm", "-rf", devicePath]);
		await this.device.applicationManager.restartApplication({
			appId: liveSyncInfo.deviceAppData.appIdentifier,
			projectName: projectData.projectName,
			waitForDebugger: liveSyncInfo.waitForDebugger,
			projectDir: projectData.projectDir
		});
	}

	public async shouldRestart(projectData: IProjectData, liveSyncInfo: IAndroidLiveSyncResultInfo): Promise<boolean> {
		let shouldRestart = false;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;
		const canExecuteFastSync = !liveSyncInfo.isFullSync && !_.some(localToDevicePaths,
			(localToDevicePath: Mobile.ILocalToDevicePathData) => !this.canExecuteFastSync(liveSyncInfo, localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));

		if (!canExecuteFastSync || liveSyncInfo.waitForDebugger) {
			shouldRestart = true;
		}

		return shouldRestart;
	}

	public async tryRefreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<boolean> {
		let didRefresh = true;
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

		didRefresh = await this.reloadApplicationFiles(deviceAppData, localToDevicePaths);

		return didRefresh;
	}

	private async cleanLivesyncDirectories(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});

		await this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.FULLSYNC_DIR_NAME),
			this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.SYNC_DIR_NAME),
			this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.REMOVEDSYNC_DIR_NAME)]);
	}

	@performanceLog()
	public async beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
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

	private async reloadApplicationFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<boolean> {
		if (!this.port) {
			this.port = await this.$androidProcessService.forwardFreeTcpToAbstractPort({
				deviceIdentifier: deviceAppData.device.deviceInfo.identifier,
				appIdentifier: deviceAppData.appIdentifier,
				abstractPort: `localabstract:${deviceAppData.appIdentifier}-livesync`
			});
		}

		if (await this.awaitRuntimeReloadSuccessMessage()) {
			await this.cleanLivesyncDirectories(deviceAppData);
		} else {
			return false;
		}
		return true;
	}

	@performanceLog()
	public async removeFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		const deviceRootPath = await this.$devicePathProvider.getDeviceProjectRootPath(deviceAppData.device, {
			appIdentifier: deviceAppData.appIdentifier,
			getDirname: true
		});

		for (const localToDevicePathData of localToDevicePaths) {
			const relativeUnixPath = _.trimStart(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
			const deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, LiveSyncPaths.REMOVEDSYNC_DIR_NAME, relativeUnixPath);
			await this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), " && ", "touch", deviceFilePath]);
		}

		const deviceHashService = this.device.fileSystem.getDeviceHashService(deviceAppData.appIdentifier);
		await deviceHashService.removeHashes(localToDevicePaths);
	}

	private async awaitRuntimeReloadSuccessMessage(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let isResolved = false;
			const socket = new net.Socket();

			socket.connect(this.port, '127.0.0.1', () => {
				socket.write(Buffer.from([0, 0, 0, 1, 1]));
			});
			socket.on("data", (data: any) => {
				isResolved = true;
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
