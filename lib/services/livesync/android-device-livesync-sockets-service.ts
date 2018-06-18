import { DeviceAndroidDebugBridge } from "../../common/mobile/android/device-android-debug-bridge";
import { AndroidDeviceHashService } from "../../common/mobile/android/android-device-hash-service";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import { cache } from "../../common/decorators";
const LivesyncTool = require("nativescript-android-livesync-lib");

export class AndroidDeviceSocketsLiveSyncService extends DeviceLiveSyncServiceBase implements IAndroidNativeScriptDeviceLiveSyncService, INativeScriptDeviceLiveSyncService {
	private port: number;
	private livesyncTool: any;

	constructor(
		private data: IProjectData,
		private $injector: IInjector,
		protected $platformsData: IPlatformsData,
		protected $staticConfig: Config.IStaticConfig,
		protected device: Mobile.IAndroidDevice) {
		super($platformsData, device);
		this.livesyncTool = new LivesyncTool();
	}

	public async beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		await this.device.applicationManager.startApplication({ appId: deviceAppData.appIdentifier, projectName: this.data.projectName });
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		//await this.connectLivesyncTool("", projectData.projectId);
		await this.livesyncTool.sendDoSyncOperation()
	}

	public async removeFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<void> {
		await this.connectLivesyncTool(projectFilesPath, deviceAppData.appIdentifier);
		await this.livesyncTool.removeFilesArray(_.map(localToDevicePaths, (element: any) => { return element.filePath }));
	}

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<Mobile.ILocalToDevicePathData[]> {
		await this.connectLivesyncTool(projectFilesPath, deviceAppData.appIdentifier);
		await this.livesyncTool.sendFilesArray(localToDevicePaths.map(localToDevicePathData => localToDevicePathData.getLocalPath()));

		return localToDevicePaths;
	}

	private async connectLivesyncTool(projectFilesPath: string, appIdentifier: string) {
		const adbPath = await this.$staticConfig.getAdbFilePath();
		await this.livesyncTool.connect({
			fullApplicationName: appIdentifier,
			port: this.port,
			deviceIdentifier: this.device.deviceInfo.identifier,
			baseDir: projectFilesPath,
			adbPath: adbPath
		});
	}


	@cache()
	public getDeviceHashService(appIdentifier: string): Mobile.IAndroidDeviceHashService {
		const adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
		return this.$injector.resolve(AndroidDeviceHashService, { adb, appIdentifier });
	}
}
