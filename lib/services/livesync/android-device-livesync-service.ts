import { DeviceAndroidDebugBridge } from "../../common/mobile/android/device-android-debug-bridge";
import { AndroidDeviceHashService } from "../../common/mobile/android/android-device-hash-service";
import * as helpers from "../../common/helpers";
import { cache } from "../../common/decorators";
import * as path from "path";
import * as net from "net";
import { EOL } from "os";

export class AndroidLiveSyncService implements INativeScriptDeviceLiveSyncService {
		private static FAST_SYNC_FILE_EXTENSIONS = [".css", ".xml", ".html"];

	private static BACKEND_PORT = 18182;
	private device: Mobile.IAndroidDevice;

	constructor(_device: Mobile.IDevice,
		private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector,
		private $logger: ILogger,
		private $androidDebugService: IPlatformDebugService,
		private $platformsData: IPlatformsData) {
		this.device = <Mobile.IAndroidDevice>(_device);
	}

	public get debugService(): IPlatformDebugService {
		return this.$androidDebugService;
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		const deviceAppData = liveSyncInfo.deviceAppData;
		const localToDevicePaths = liveSyncInfo.modifiedFilesData;

		await this.device.adb.executeShellCommand(
			["chmod",
				"777",
				"/data/local/tmp/",
				`/data/local/tmp/${deviceAppData.appIdentifier}`,
				`/data/local/tmp/${deviceAppData.appIdentifier}/sync`]
		);

		let canExecuteFastSync = ! liveSyncInfo.isFullSync && !_.some(localToDevicePaths,
			(localToDevicePath: Mobile.ILocalToDevicePathData) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));

		if (canExecuteFastSync) {
			return this.reloadPage(deviceAppData, localToDevicePaths);
		}

		return this.restartApplication(deviceAppData);
	}

	@cache()
	private getFastLiveSyncFileExtensions(platform: string, projectData: IProjectData): string[] {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const fastSyncFileExtensions = AndroidLiveSyncService.FAST_SYNC_FILE_EXTENSIONS.concat(platformData.fastLivesyncFileExtensions);
		return fastSyncFileExtensions;
	}

	public canExecuteFastSync(filePath: string, projectData: IProjectData, platform: string): boolean {
		console.log("called canExecuteFastSync for file: ", filePath);
		const fastSyncFileExtensions = this.getFastLiveSyncFileExtensions(platform, projectData);
		return _.includes(fastSyncFileExtensions, path.extname(filePath));
	}

	protected printDebugInformation(information: string[]): void {
		_.each(information, i => {
			this.$logger.info(`To start debugging, open the following URL in Chrome:${EOL}${i}${EOL}`.cyan);
		});
	}

	private async restartApplication(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		let devicePathRoot = `/data/data/${deviceAppData.appIdentifier}/files`;
		let devicePath = this.$mobileHelper.buildDevicePath(devicePathRoot, "code_cache", "secondary_dexes", "proxyThumb");
		await this.device.adb.executeShellCommand(["rm", "-rf", devicePath]);

		await this.device.applicationManager.restartApplication(deviceAppData.appIdentifier);
	}

	public async beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		let deviceRootPath = this.getDeviceRootPath(deviceAppData.appIdentifier),
			deviceRootDir = path.dirname(deviceRootPath),
			deviceRootBasename = path.basename(deviceRootPath),
			listResult = await this.device.adb.executeShellCommand(["ls", "-l", deviceRootDir]),
			regex = new RegExp(`^-.*${deviceRootBasename}$`, "m"),
			matchingFile = (listResult || "").match(regex);

		// Check if there is already a file with deviceRootBasename. If so, delete it as it breaks LiveSyncing.
		if (matchingFile && matchingFile[0] && _.startsWith(matchingFile[0], '-')) {
			await this.device.adb.executeShellCommand(["rm", "-f", deviceRootPath]);
		}

		this.device.adb.executeShellCommand(["rm", "-rf", this.$mobileHelper.buildDevicePath(deviceRootPath, "fullsync"),
			this.$mobileHelper.buildDevicePath(deviceRootPath, "sync"),
			await this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync")]);
	}

	private async reloadPage(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): Promise<void> {
		await this.device.adb.executeCommand(["forward", `tcp:${AndroidLiveSyncService.BACKEND_PORT.toString()}`, `localabstract:${deviceAppData.appIdentifier}-livesync`]);
		if (!await this.sendPageReloadMessage()) {
			await this.restartApplication(deviceAppData);
		}
	}

	public async removeFiles(appIdentifier: string, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectId: string): Promise<void> {
		let deviceRootPath = this.getDeviceRootPath(appIdentifier);

		for (let localToDevicePathData of localToDevicePaths) {
			let relativeUnixPath = _.trimStart(helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath()), "/");
			let deviceFilePath = this.$mobileHelper.buildDevicePath(deviceRootPath, "removedsync", relativeUnixPath);
			await this.device.adb.executeShellCommand(["mkdir", "-p", path.dirname(deviceFilePath), " && ", "touch", deviceFilePath]);
		}

		await this.getDeviceHashService(projectId).removeHashes(localToDevicePaths);
	}

	private getDeviceRootPath(appIdentifier: string): string {
		return `/data/local/tmp/${appIdentifier}`;
	}

	private async sendPageReloadMessage(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let isResolved = false;
			let socket = new net.Socket();

			socket.connect(AndroidLiveSyncService.BACKEND_PORT, '127.0.0.1', () => {
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

	private _deviceHashService: Mobile.IAndroidDeviceHashService;
	private getDeviceHashService(projectId: string): Mobile.IAndroidDeviceHashService {
		if (!this._deviceHashService) {
			let adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
			this._deviceHashService = this.$injector.resolve(AndroidDeviceHashService, { adb: adb, appIdentifier: projectId });
		}

		return this._deviceHashService;
	}
}
$injector.register("androidLiveSyncServiceLocator", { factory: AndroidLiveSyncService });
