import * as path from "path";
import * as temp from "temp";

import { IOSDeviceLiveSyncService } from "./ios-device-livesync-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import { APP_FOLDER_NAME, TNS_MODULES_FOLDER_NAME } from "../../constants";

export class IOSLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	constructor(protected $fs: IFileSystem,
		protected $platformsData: IPlatformsData,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		$devicePathProvider: IDevicePathProvider,
		$logger: ILogger,
		$projectFilesProvider: IProjectFilesProvider,
	) {
		super($fs, $logger, $platformsData, $projectFilesManager, $devicePathProvider, $projectFilesProvider);
	}

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
			this.$logger.info("Skipping node_modules folder! Use the syncAllFiles option to sync files from this folder.");
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
			modifiedFilesData: []
		};
	}

	public liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<ILiveSyncResultInfo> {
		if (liveSyncInfo.isRebuilt) {
			// In this case we should execute fullsync because iOS Runtime requires the full content of app dir to be extracted in the root of sync dir.
			return this.fullSync({ projectData: liveSyncInfo.projectData, device, syncAllFiles: liveSyncInfo.syncAllFiles, watch: true });
		} else {
			return super.liveSyncWatchAction(device, liveSyncInfo);
		}
	}

	public getDeviceLiveSyncService(device: Mobile.IDevice): INativeScriptDeviceLiveSyncService {
		const service = this.$injector.resolve<INativeScriptDeviceLiveSyncService>(IOSDeviceLiveSyncService, { _device: device });
		return service;
	}
}
$injector.register("iOSLiveSyncService", IOSLiveSyncService);
