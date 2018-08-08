import { AndroidDeviceLiveSyncService } from "./android-device-livesync-service";
import { AndroidDeviceSocketsLiveSyncService } from "./android-device-livesync-sockets-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import { APP_FOLDER_NAME } from "../../constants";
import * as path from "path";
import * as semver from "semver";

export class AndroidLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	private static MIN_SOCKETS_LIVESYNC_RUNTIME_VERSION = "4.2.0-2018-07-20-02";
	constructor(protected $platformsData: IPlatformsData,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		$devicePathProvider: IDevicePathProvider,
		$fs: IFileSystem,
		$logger: ILogger,
		$projectFilesProvider: IProjectFilesProvider) {
			super($fs, $logger, $platformsData, $projectFilesManager, $devicePathProvider, $projectFilesProvider);
	}

	protected _getDeviceLiveSyncService(device: Mobile.IDevice, data: IProjectDir, frameworkVersion: string): INativeScriptDeviceLiveSyncService {
		if (semver.gt(frameworkVersion, AndroidLiveSyncService.MIN_SOCKETS_LIVESYNC_RUNTIME_VERSION)) {
			return this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceSocketsLiveSyncService, { device, data });
		}

		return this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { device, data });
	}

	public async liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<IAndroidLiveSyncResultInfo> {
		const liveSyncResult = await super.liveSyncWatchAction(device, liveSyncInfo);
		const result = await this.finalizeSync(device, liveSyncInfo.projectData, liveSyncResult);
		return result;
	}

	public async fullSync(syncInfo: IFullSyncInfo): Promise<IAndroidLiveSyncResultInfo> {
		const liveSyncResult = await super.fullSync(syncInfo);
		const removedFilesData = await this.removeMissingFiles(syncInfo);
		liveSyncResult.modifiedFilesData.push(...removedFilesData);
		const result = await this.finalizeSync(syncInfo.device, syncInfo.projectData, liveSyncResult);
		return result;
	}

	private async removeMissingFiles(syncInfo: IFullSyncInfo): Promise<Mobile.ILocalToDevicePathData[]> {
		let removedLocalToDevicePaths: Mobile.ILocalToDevicePathData[] = [];
		const liveSyncService = <IAndroidNativeScriptDeviceLiveSyncService>this.getDeviceLiveSyncService(syncInfo.device, syncInfo.projectData);
		const deviceHashService = liveSyncService.getDeviceHashService(syncInfo.projectData.projectId);
		const oldShasums = await deviceHashService.getShasumsFromDevice();
		if( oldShasums) {
			const platformData = this.$platformsData.getPlatformData(syncInfo.device.deviceInfo.platform, syncInfo.projectData);
			const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
			const deviceAppData = await this.getAppData(syncInfo);
			const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, []);
			const currentShasums: IStringDictionary = await deviceHashService.generateHashesFromLocalToDevicePaths(localToDevicePaths);
			const missingShasums = deviceHashService.getMissingShasums(oldShasums, currentShasums);
			const filesToRemove = _.keys(missingShasums);

			if (filesToRemove.length) {
				removedLocalToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, filesToRemove, []);
				await liveSyncService.removeFiles(deviceAppData, removedLocalToDevicePaths, projectFilesPath);
			}
		}

		return removedLocalToDevicePaths;
	}

	public async prepareForLiveSync(device: Mobile.IDevice, data: IProjectDir): Promise<void> { /* */ }

	private async finalizeSync(device: Mobile.IDevice, projectData: IProjectData, liveSyncResult: ILiveSyncResultInfo): Promise<IAndroidLiveSyncResultInfo> {
		const liveSyncService = <IAndroidNativeScriptDeviceLiveSyncService>this.getDeviceLiveSyncService(device, projectData);
		const finalizeResult = await liveSyncService.finalizeSync(liveSyncResult, projectData);
		const result = _.extend(liveSyncResult, finalizeResult);
		return result;
	}
}
$injector.register("androidLiveSyncService", AndroidLiveSyncService);
