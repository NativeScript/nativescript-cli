import * as path from "path";
import { APP_FOLDER_NAME } from "../../constants";

export abstract class PlatformLiveSyncServiceBase {
	constructor(protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $platformsData: IPlatformsData,
		protected $projectFilesManager: IProjectFilesManager,
		private $devicePathProvider: IDevicePathProvider,
		private $projectFilesProvider: IProjectFilesProvider) { }

	public abstract getDeviceLiveSyncService(device: Mobile.IDevice): INativeScriptDeviceLiveSyncService;

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		if (liveSyncInfo.isFullSync || liveSyncInfo.modifiedFilesData.length) {
			const deviceLiveSyncService = this.getDeviceLiveSyncService(liveSyncInfo.deviceAppData.device);
			this.$logger.info("Refreshing application...");
			await deviceLiveSyncService.refreshApplication(projectData, liveSyncInfo);
		}
	}

	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const projectData = syncInfo.projectData;
		const device = syncInfo.device;
		const deviceLiveSyncService = this.getDeviceLiveSyncService(device);
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const deviceAppData = await this.getAppData(syncInfo);

		if (deviceLiveSyncService.beforeLiveSyncAction) {
			await deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);
		}

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

			const deviceLiveSyncService = this.getDeviceLiveSyncService(device);
			deviceLiveSyncService.removeFiles(projectData.projectId, localToDevicePaths, projectData.projectId);
		}

		return {
			modifiedFilesData: modifiedLocalToDevicePaths,
			isFullSync: liveSyncInfo.isRebuilt,
			deviceAppData
		};
	}

	protected async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<void> {
		if (isFullSync) {
			await deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			await deviceAppData.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
		}
	}

	protected async getAppData(syncInfo: IFullSyncInfo): Promise<Mobile.IDeviceAppData> {
		const deviceProjectRootOptions: IDeviceProjectRootOptions = _.assign({ appIdentifier: syncInfo.projectData.projectId }, syncInfo);
		return {
			appIdentifier: syncInfo.projectData.projectId,
			device: syncInfo.device,
			platform: syncInfo.device.deviceInfo.platform,
			getDeviceProjectRootPath: () => this.$devicePathProvider.getDeviceProjectRootPath(syncInfo.device, deviceProjectRootOptions),
			isLiveSyncSupported: async () => true
		};
	}
}
