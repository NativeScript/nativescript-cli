import { DeviceAndroidDebugBridge } from "../../common/mobile/android/device-android-debug-bridge";
import { AndroidDeviceHashService } from "../../common/mobile/android/android-device-hash-service";
import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import { APP_FOLDER_NAME } from "../../constants";
import * as path from "path";

const LivesyncTool = require("nativescript-android-livesync-lib");

export class AndroidDeviceSocketsLiveSyncService extends DeviceLiveSyncServiceBase implements IAndroidNativeScriptDeviceLiveSyncService, INativeScriptDeviceLiveSyncService {
	private port: number;
	private livesyncTool: any;

	constructor(
		private data: IProjectData,
		private $injector: IInjector,
		protected $platformsData: IPlatformsData,
		protected $staticConfig: Config.IStaticConfig,
		protected device: Mobile.IAndroidDevice,
		private $options: ICommonOptions) {
		super($platformsData, device);
		this.livesyncTool = new LivesyncTool();
	}

	public async beforeLiveSyncAction(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		const platformData = this.$platformsData.getPlatformData(deviceAppData.platform, this.data);
		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
		await this.device.applicationManager.startApplication({ appId: deviceAppData.appIdentifier, projectName: this.data.projectName });
		await this.connectLivesyncTool(projectFilesPath, this.data.projectId);
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		const canExecuteFastSync = !liveSyncInfo.isFullSync && !_.some(liveSyncInfo.modifiedFilesData,
			(localToDevicePath: Mobile.ILocalToDevicePathData) => !this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));

		if(liveSyncInfo.modifiedFilesData.length) {
			await this.livesyncTool.sendDoSyncOperation();

			if(!canExecuteFastSync){
				await this.device.applicationManager.restartApplication({ appId: liveSyncInfo.deviceAppData.appIdentifier, projectName: projectData.projectName });
			}
		}

		this.livesyncTool.end();
	}

	public async removeFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<void> {
		await this.livesyncTool.removeFilesArray(_.map(localToDevicePaths, (element: any) => { return element.filePath }));
	}

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<Mobile.ILocalToDevicePathData[]> {
		let transferredFiles;

		if (isFullSync) {
			transferredFiles = await this._transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			transferredFiles = await this._transferFiles(deviceAppData, localToDevicePaths, projectFilesPath);
		}

		return transferredFiles;
	}

	private async _transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<Mobile.ILocalToDevicePathData[]> {
		await this.livesyncTool.sendFilesArray(localToDevicePaths.map(localToDevicePathData => localToDevicePathData.getLocalPath()));

		return localToDevicePaths;
	}

	private async _transferDirectory(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string): Promise<Mobile.ILocalToDevicePathData[]> {
		let transferedFiles: Mobile.ILocalToDevicePathData[];
		const deviceHashService = this.getDeviceHashService(deviceAppData.appIdentifier);
		const currentShasums: IStringDictionary = await deviceHashService.generateHashesFromLocalToDevicePaths(localToDevicePaths);
		const oldShasums = await deviceHashService.getShasumsFromDevice();

		if(this.$options.force || !oldShasums) {
			await this.livesyncTool.sendDirectory(projectFilesPath);
			await deviceHashService.uploadHashFileToDevice(currentShasums);
			transferedFiles = localToDevicePaths;
		} else {
			const changedShasums = deviceHashService.getChnagedShasums(oldShasums, currentShasums);
			const changedFiles = _.map(changedShasums, (hash: string, pathToFile: string) => pathToFile);
			if(changedFiles.length){
				await this.livesyncTool.sendFilesArray(changedFiles);
				await deviceHashService.uploadHashFileToDevice(currentShasums);
				transferedFiles = localToDevicePaths.filter(localToDevicePathData => {
					if(changedFiles.indexOf(localToDevicePathData.getLocalPath()) >= 0){
						return true;
					}
				});
			} else {
				transferedFiles = [];
			}
		}

		return transferedFiles;
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

	public getDeviceHashService(appIdentifier: string): Mobile.IAndroidDeviceHashService {
		const adb = this.$injector.resolve(DeviceAndroidDebugBridge, { identifier: this.device.deviceInfo.identifier });
		return this.$injector.resolve(AndroidDeviceHashService, { adb, appIdentifier });
	}
}
