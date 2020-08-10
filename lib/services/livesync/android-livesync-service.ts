import { AndroidDeviceLiveSyncService } from "./android-device-livesync-service";
import { AndroidDeviceSocketsLiveSyncService } from "./android-device-livesync-sockets-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import { performanceLog } from "../../common/decorators";
import * as semver from "semver";
import * as _ from 'lodash';
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import { IProjectFilesManager, IFileSystem, IProjectDir } from "../../common/declarations";
import { IInjector, $injector } from "../../common/definitions/yok";

export class AndroidLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	private static MIN_SOCKETS_LIVESYNC_RUNTIME_VERSION = "4.2.0-2018-07-20-02";
	constructor(protected $platformsDataService: IPlatformsDataService,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		$devicePathProvider: IDevicePathProvider,
		$fs: IFileSystem,
		$logger: ILogger) {
		super($fs, $logger, $platformsDataService, $projectFilesManager, $devicePathProvider);
	}

	protected _getDeviceLiveSyncService(device: Mobile.IDevice, data: IProjectDir, frameworkVersion: string): INativeScriptDeviceLiveSyncService {
		if (semver.gt(frameworkVersion, AndroidLiveSyncService.MIN_SOCKETS_LIVESYNC_RUNTIME_VERSION)) {
			return this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceSocketsLiveSyncService, { device, data });
		}

		return this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { device, data });
	}

	@performanceLog()
	public async liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<IAndroidLiveSyncResultInfo> {
		const liveSyncResult = await super.liveSyncWatchAction(device, liveSyncInfo);
		const result = await this.finalizeSync(device, liveSyncInfo.projectData, liveSyncResult);

		return result;
	}

	@performanceLog()
	public async fullSync(syncInfo: IFullSyncInfo): Promise<IAndroidLiveSyncResultInfo> {
		const liveSyncResult = await super.fullSync(syncInfo);
		const result = await this.finalizeSync(syncInfo.device, syncInfo.projectData, liveSyncResult);
		return result;
	}

	private async finalizeSync(device: Mobile.IDevice, projectData: IProjectData, liveSyncResult: ILiveSyncResultInfo): Promise<IAndroidLiveSyncResultInfo> {
		const liveSyncService = <IAndroidNativeScriptDeviceLiveSyncService>this.getDeviceLiveSyncService(device, projectData);
		const finalizeResult = await liveSyncService.finalizeSync(liveSyncResult, projectData);
		const result = _.extend(liveSyncResult, finalizeResult);
		return result;
	}
}
$injector.register("androidLiveSyncService", AndroidLiveSyncService);
