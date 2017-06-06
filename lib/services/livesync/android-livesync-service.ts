import * as path from "path";
import { AndroidDeviceLiveSyncService } from "./android-device-livesync-service";
import { APP_FOLDER_NAME } from "../../constants";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";

export class AndroidLiveSyncService extends PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	constructor(private $projectFilesManager: IProjectFilesManager,
		private $platformsData: IPlatformsData,
		private $logger: ILogger,
		private $projectFilesProvider: IProjectFilesProvider,
		private $fs: IFileSystem,
		private $injector: IInjector,
		$devicePathProvider: IDevicePathProvider) {
		super($devicePathProvider);
	}

	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const projectData = syncInfo.projectData;
		const device = syncInfo.device;
		const deviceLiveSyncService = this.$injector.resolve<AndroidDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { _device: device });
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);

		const deviceAppData = await this.getAppData(syncInfo);
		await deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);

		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
		const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, []);
		await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, true);

		return {
			modifiedFilesData: localToDevicePaths,
			isFullSync: true,
			deviceAppData
		};
	}

	public async liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<ILiveSyncResultInfo> {
		const projectData = liveSyncInfo.projectData;
		const syncInfo = _.merge<IFullSyncInfo>({ device, watch: true }, liveSyncInfo);
		const deviceAppData = await this.getAppData(syncInfo);

		let modifiedLocalToDevicePaths: Mobile.ILocalToDevicePathData[] = [];
		if (liveSyncInfo.filesToSync.length) {
			const filesToSync = liveSyncInfo.filesToSync;
			const mappedFiles = _.map(filesToSync, filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData));

			// Some plugins modify platforms dir on afterPrepare (check nativescript-dev-sass) - we want to sync only existing file.
			const existingFiles = mappedFiles.filter(m => this.$fs.exists(m));
			this.$logger.trace("Will execute livesync for files: ", existingFiles);
			const skippedFiles = _.difference(mappedFiles, existingFiles);
			if (skippedFiles.length) {
				this.$logger.trace("The following files will not be synced as they do not exist:", skippedFiles);
			}

			if (existingFiles.length) {
				let platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
				const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
				let localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData,
					projectFilesPath, mappedFiles, []);
				modifiedLocalToDevicePaths.push(...localToDevicePaths);
				await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, false);
			}
		}

		if (liveSyncInfo.filesToRemove.length) {
			const filePaths = liveSyncInfo.filesToRemove;
			let platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);

			const mappedFiles = _.map(filePaths, filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData));
			const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
			let localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, mappedFiles, []);
			modifiedLocalToDevicePaths.push(...localToDevicePaths);

			const deviceLiveSyncService = this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { _device: device });
			deviceLiveSyncService.removeFiles(projectData.projectId, localToDevicePaths, projectData.projectId);
		}

		return {
			modifiedFilesData: modifiedLocalToDevicePaths,
			isFullSync: liveSyncInfo.isRebuilt,
			deviceAppData
		};
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		if (liveSyncInfo.isFullSync || liveSyncInfo.modifiedFilesData.length) {
			let deviceLiveSyncService = this.$injector.resolve<INativeScriptDeviceLiveSyncService>(AndroidDeviceLiveSyncService, { _device: liveSyncInfo.deviceAppData.device });
			this.$logger.info("Refreshing application...");
			await deviceLiveSyncService.refreshApplication(projectData, liveSyncInfo);
		}
	}

	protected async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, canTransferDirectory: boolean): Promise<void> {
		if (canTransferDirectory) {
			await deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			await deviceAppData.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
		}
	}
}
$injector.register("androidLiveSyncService", AndroidLiveSyncService);
