import * as path from "path";

import { IOSDeviceLiveSyncService } from "./ios-device-livesync-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import { APP_FOLDER_NAME } from "../../constants";
import { performanceLog } from "../../common/decorators";
import { IPlatformsDataService } from "../../definitions/platform";
import { IFileSystem, IProjectFilesManager, IProjectDir } from "../../common/declarations";
import { IInjector } from "../../common/definitions/yok";
import { injector } from "../../common/yok";

export class IOSLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	constructor(protected $fs: IFileSystem,
		protected $platformsDataService: IPlatformsDataService,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		private $tempService: ITempService,
		$devicePathProvider: IDevicePathProvider,
		$logger: ILogger) {
		super($fs, $logger, $platformsDataService, $projectFilesManager, $devicePathProvider);
	}

	@performanceLog()
	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const device = syncInfo.device;

		if (device.isEmulator) {
			return super.fullSync(syncInfo);
		}
		const projectData = syncInfo.projectData;
		const platformData = this.$platformsDataService.getPlatformData(device.deviceInfo.platform, projectData);
		const deviceAppData = await this.getAppData(syncInfo);
		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);

		const tempZip = await this.$tempService.path({ prefix: "sync", suffix: ".zip" });
		this.$logger.trace("Creating zip file: " + tempZip);

		const filesToTransfer = this.$fs.enumerateFilesInDirectorySync(projectFilesPath);

		await this.$fs.zipFiles(tempZip, filesToTransfer, (res) => {
			return path.join(APP_FOLDER_NAME, path.relative(projectFilesPath, res));
		});

		await device.fileSystem.transferFiles(deviceAppData, [{
			getLocalPath: () => tempZip,
			getDevicePath: () => deviceAppData.deviceSyncZipPath,
			getRelativeToProjectBasePath: () => "../sync.zip",
			deviceProjectRootPath: await deviceAppData.getDeviceProjectRootPath()
		}]);

		await deviceAppData.device.applicationManager.setTransferredAppFiles(filesToTransfer);

		return {
			deviceAppData,
			isFullSync: true,
			modifiedFilesData: [],
			useHotModuleReload: syncInfo.useHotModuleReload
		};
	}

	public async syncAfterInstall(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<void> {
		if (!device.isEmulator) {
			// In this case we should execute fullsync because iOS Runtime requires the full content of app dir to be extracted in the root of sync dir.
			await this.fullSync({
				projectData: liveSyncInfo.projectData,
				device,
				liveSyncDeviceData: liveSyncInfo.liveSyncDeviceData,
				watch: true,
				useHotModuleReload: liveSyncInfo.useHotModuleReload
			});
		}
	}

	protected _getDeviceLiveSyncService(device: Mobile.IDevice, data: IProjectDir): INativeScriptDeviceLiveSyncService {
		const service = this.$injector.resolve<INativeScriptDeviceLiveSyncService>(IOSDeviceLiveSyncService, { device, data });
		return service;
	}
}
injector.register("iOSLiveSyncService", IOSLiveSyncService);
