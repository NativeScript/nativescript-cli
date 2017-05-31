import { DeviceAndroidDebugBridge } from "../../common/mobile/android/device-android-debug-bridge";
import { AndroidDeviceHashService } from "../../common/mobile/android/android-device-hash-service";
import * as helpers from "../../common/helpers";
import * as path from "path";
import * as net from "net";
import { EOL } from "os";

export class AndroidLiveSyncService implements INativeScriptDeviceLiveSyncService {
	private static BACKEND_PORT = 18182;
	private device: Mobile.IAndroidDevice;

	constructor(_device: Mobile.IDevice,
		private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector,
		private $logger: ILogger,
		private $androidDebugService: IPlatformDebugService,
		private $liveSyncProvider: ILiveSyncProvider) {
		this.device = <Mobile.IAndroidDevice>(_device);
	}

	public get debugService(): IPlatformDebugService {
		return this.$androidDebugService;
	}

	public async refreshApplication(deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		forceExecuteFullSync: boolean,
		projectData: IProjectData,
		outputFilePath?: string,
		debugData?: IDebugData,
		debugOptions?: IOptions): Promise<void> {

		if (debugData) {
			// TODO: Move this outside of here
			await this.debugService.debugStop();

			let applicationId = deviceAppData.appIdentifier;
			await deviceAppData.device.applicationManager.stopApplication(applicationId, projectData.projectName);

			debugData.pathToAppPackage = outputFilePath;
			const debugInfo = await this.debugService.debug<string[]>(debugData, debugOptions);
			this.printDebugInformation(debugInfo);

			return;
		}

		await this.device.adb.executeShellCommand(
			["chmod",
				"777",
				await deviceAppData.getDeviceProjectRootPath(),
				`/data/local/tmp/${deviceAppData.appIdentifier}`,
				`/data/local/tmp/${deviceAppData.appIdentifier}/sync`]
		);

		let canExecuteFastSync = !forceExecuteFullSync && !_.some(localToDevicePaths, (localToDevicePath: any) => !this.$liveSyncProvider.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, deviceAppData.platform));

		if (canExecuteFastSync) {
			return this.reloadPage(deviceAppData, localToDevicePaths);
		}

		return this.restartApplication(deviceAppData);
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

	public async afterInstallApplicationAction(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectId: string): Promise<boolean> {
		await this.getDeviceHashService(projectId).uploadHashFileToDevice(localToDevicePaths);
		return false;
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
