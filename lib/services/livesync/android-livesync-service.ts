import { AndroidDeviceLiveSyncService } from "./android-device-livesync-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";

export class AndroidLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {

	constructor(protected $platformsData: IPlatformsData,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		$devicePathProvider: IDevicePathProvider,
		$fs: IFileSystem,
		$logger: ILogger,
		$projectFilesProvider: IProjectFilesProvider,
	) {
		super($fs, $logger, $platformsData, $projectFilesManager, $devicePathProvider, $projectFilesProvider);
	}

	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const liveSyncResultInfo: ILiveSyncResultInfo = await super.fullSync(syncInfo);

		this._getDeviceLiveSyncService(syncInfo.device).sendFilesOverSocket(liveSyncResultInfo.modifiedFilesData);

		return liveSyncResultInfo;
	}

	protected _getDeviceLiveSyncService(device: Mobile.IDevice): INativeScriptDeviceLiveSyncService {
		const service = this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { _device: device });
		return service;
	}
}
$injector.register("androidLiveSyncService", AndroidLiveSyncService);
