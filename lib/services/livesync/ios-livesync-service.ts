import * as path from "path";
import * as temp from "temp";

import { IOSDeviceLiveSyncService } from "./ios-device-livesync-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import { APP_FOLDER_NAME, TNS_MODULES_FOLDER_NAME } from "../../constants";
import { performanceLog } from "../../common/decorators";

export class IOSLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	constructor(protected $fs: IFileSystem,
		protected $platformsData: IPlatformsData,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		$devicePathProvider: IDevicePathProvider,
		$logger: ILogger) {
		super($fs, $logger, $platformsData, $projectFilesManager, $devicePathProvider);
	}

	@performanceLog()
	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const device = syncInfo.device;

		if (device.isEmulator) {
			return super.fullSync(syncInfo);
		}
		const projectData = syncInfo.projectData;
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const deviceAppData = await this.getAppData(syncInfo);
		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);

		temp.track();
		const tempZip = temp.path({ prefix: "sync", suffix: ".zip" });
		const tempApp = temp.mkdirSync("app");
		this.$logger.trace("Creating zip file: " + tempZip);
		this.$fs.copyFile(path.join(path.dirname(projectFilesPath), `${APP_FOLDER_NAME}/*`), tempApp);

		if (!syncInfo.syncAllFiles) {
			this.$fs.deleteDirectory(path.join(tempApp, TNS_MODULES_FOLDER_NAME));
		}

		await this.$fs.zipFiles(tempZip, this.$fs.enumerateFilesInDirectorySync(tempApp), (res) => {
			return path.join(APP_FOLDER_NAME, path.relative(tempApp, res));
		});

		await device.fileSystem.transferFiles(deviceAppData, [{
			getLocalPath: () => tempZip,
			getDevicePath: () => deviceAppData.deviceSyncZipPath,
			getRelativeToProjectBasePath: () => "../sync.zip",
			deviceProjectRootPath: await deviceAppData.getDeviceProjectRootPath()
		}]);

		return {
			deviceAppData,
			isFullSync: true,
			modifiedFilesData: [],
			useHotModuleReload: syncInfo.useHotModuleReload
		};
	}

	@performanceLog()
	public liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<ILiveSyncResultInfo> {
		if (liveSyncInfo.isReinstalled) {
			// In this case we should execute fullsync because iOS Runtime requires the full content of app dir to be extracted in the root of sync dir.
			return this.fullSync({
				projectData: liveSyncInfo.projectData,
				device, syncAllFiles: liveSyncInfo.syncAllFiles,
				liveSyncDeviceInfo: liveSyncInfo.liveSyncDeviceInfo,
				watch: true,
				useHotModuleReload: liveSyncInfo.useHotModuleReload
			});
		} else {
			return super.liveSyncWatchAction(device, liveSyncInfo);
		}
	}

	protected _getDeviceLiveSyncService(device: Mobile.IDevice, data: IProjectDir): INativeScriptDeviceLiveSyncService {
		const service = this.$injector.resolve<INativeScriptDeviceLiveSyncService>(IOSDeviceLiveSyncService, { device, data });
		return service;
	}
}
$injector.register("iOSLiveSyncService", IOSLiveSyncService);
