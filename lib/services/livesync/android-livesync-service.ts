import { AndroidDeviceLiveSyncService } from "./android-device-livesync-service";
import { AndroidDeviceSocketsLiveSyncService } from "./android-device-livesync-sockets-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
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
		console.time("ALS base");
		const liveSyncResult = await super.liveSyncWatchAction(device, liveSyncInfo);
		console.timeEnd("ALS base");

		console.time("ALS finalize");
		const result = await this.finalizeSync(device, liveSyncInfo.projectData, liveSyncResult);
		console.timeEnd("ALS finalize");

		return result;
	}

	public async fullSync(syncInfo: IFullSyncInfo): Promise<IAndroidLiveSyncResultInfo> {
		const liveSyncResult = await super.fullSync(syncInfo);
		const result = await this.finalizeSync(syncInfo.device, syncInfo.projectData, liveSyncResult);
		return result;
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
