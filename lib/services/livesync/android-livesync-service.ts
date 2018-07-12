import { AndroidDeviceLiveSyncService } from "./android-device-livesync-service";
import { AndroidDeviceSocketsLiveSyncService } from "./android-device-livesync-sockets-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import * as semver from "semver";

export class AndroidLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	private static MIN_SOCKETS_LIVESYNC_RUNTIME_VERSION = "4.2.0";
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
		if (semver.gte(frameworkVersion, AndroidLiveSyncService.MIN_SOCKETS_LIVESYNC_RUNTIME_VERSION)) {
			return this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceSocketsLiveSyncService, { device, data });
		}

		return this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { device, data });
	}

	public async prepareForLiveSync(device: Mobile.IDevice, data: IProjectDir): Promise<void> { /* */ }
}
$injector.register("androidLiveSyncService", AndroidLiveSyncService);
