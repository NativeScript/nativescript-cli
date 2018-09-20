import * as path from "path";
import * as util from "util";
import { APP_FOLDER_NAME } from "../../constants";
import { getHash } from "../../common/helpers";

export abstract class PlatformLiveSyncServiceBase {
	private _deviceLiveSyncServicesCache: IDictionary<INativeScriptDeviceLiveSyncService> = {};

	constructor(protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $platformsData: IPlatformsData,
		protected $projectFilesManager: IProjectFilesManager,
		private $devicePathProvider: IDevicePathProvider,
		private $projectFilesProvider: IProjectFilesProvider) { }

	public getDeviceLiveSyncService(device: Mobile.IDevice, projectData: IProjectData): INativeScriptDeviceLiveSyncService {
		const platform = device.deviceInfo.platform.toLowerCase();
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const frameworkVersion = platformData.platformProjectService.getFrameworkVersion(projectData);
		const key = getHash(`${device.deviceInfo.identifier}${projectData.projectIdentifiers[platform]}${projectData.projectDir}${frameworkVersion}`);
		if (!this._deviceLiveSyncServicesCache[key]) {
			this._deviceLiveSyncServicesCache[key] = this._getDeviceLiveSyncService(device, projectData, frameworkVersion);
		}

		return this._deviceLiveSyncServicesCache[key];
	}

	protected abstract _getDeviceLiveSyncService(device: Mobile.IDevice, data: IProjectData, frameworkVersion: string): INativeScriptDeviceLiveSyncService;

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		if (liveSyncInfo.isFullSync || liveSyncInfo.modifiedFilesData.length) {
			const deviceLiveSyncService = this.getDeviceLiveSyncService(liveSyncInfo.deviceAppData.device, projectData);
			this.$logger.info("Refreshing application...");
			await deviceLiveSyncService.refreshApplication(projectData, liveSyncInfo);
		}
	}

	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const projectData = syncInfo.projectData;
		const device = syncInfo.device;
		const deviceLiveSyncService = this.getDeviceLiveSyncService(device, syncInfo.projectData);
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const deviceAppData = await this.getAppData(syncInfo);

		if (deviceLiveSyncService.beforeLiveSyncAction) {
			await deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);
		}

		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
		const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, []);
		const modifiedFilesData = await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, projectData, syncInfo.liveSyncDeviceInfo, { isFullSync: true, force: syncInfo.force });

		return {
			modifiedFilesData,
			isFullSync: true,
			deviceAppData,
			useHotModuleReload: syncInfo.useHotModuleReload
		};
	}

	public async liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<ILiveSyncResultInfo> {
		const projectData = liveSyncInfo.projectData;
		const deviceLiveSyncService = this.getDeviceLiveSyncService(device, projectData);
		const syncInfo = _.merge<IFullSyncInfo>({ device, watch: true }, liveSyncInfo);
		const deviceAppData = await this.getAppData(syncInfo);

		if (deviceLiveSyncService.beforeLiveSyncAction) {
			await deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);
		}

		let modifiedLocalToDevicePaths: Mobile.ILocalToDevicePathData[] = [];
		if (liveSyncInfo.filesToSync.length) {
			const filesToSync = liveSyncInfo.filesToSync;
			const mappedFiles = _.map(filesToSync, filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData));

			// Some plugins modify platforms dir on afterPrepare (check nativescript-dev-sass) - we want to sync only existing file.
			const existingFiles = mappedFiles.filter(m => m && this.$fs.exists(m));
			this.$logger.trace("Will execute livesync for files: ", existingFiles);
			const skippedFiles = _.difference(mappedFiles, existingFiles);
			if (skippedFiles.length) {
				this.$logger.trace("The following files will not be synced as they do not exist:", skippedFiles);
			}

			if (existingFiles.length) {
				const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
				const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
				const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData,
					projectFilesPath, existingFiles, []);
				modifiedLocalToDevicePaths.push(...localToDevicePaths);
				modifiedLocalToDevicePaths = await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, projectData, liveSyncInfo.liveSyncDeviceInfo, { isFullSync: false, force: liveSyncInfo.force});
			}
		}

		if (liveSyncInfo.filesToRemove.length) {
			const filePaths = liveSyncInfo.filesToRemove;
			const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);

			const mappedFiles = _(filePaths)
				.map(filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData))
				.filter(filePath => !!filePath)
				.value();
			const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
			const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, mappedFiles, []);
			modifiedLocalToDevicePaths.push(...localToDevicePaths);

			await deviceLiveSyncService.removeFiles(deviceAppData, localToDevicePaths, projectFilesPath);
		}

		return {
			modifiedFilesData: modifiedLocalToDevicePaths,
			isFullSync: liveSyncInfo.isReinstalled,
			deviceAppData,
			useHotModuleReload: liveSyncInfo.useHotModuleReload
		};
	}

	protected async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, projectData: IProjectData, liveSyncDeviceInfo: ILiveSyncDeviceInfo, options: ITransferFilesOptions): Promise<Mobile.ILocalToDevicePathData[]> {
		let transferredFiles: Mobile.ILocalToDevicePathData[] = [];
		const deviceLiveSyncService = this.getDeviceLiveSyncService(deviceAppData.device, projectData);

		transferredFiles = await deviceLiveSyncService.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, projectData, liveSyncDeviceInfo, options);

		this.logFilesSyncInformation(transferredFiles, "Successfully transferred %s.", this.$logger.info);

		return transferredFiles;
	}

	protected async getAppData(syncInfo: IFullSyncInfo): Promise<Mobile.IDeviceAppData> {
		const platform = syncInfo.device.deviceInfo.platform.toLowerCase();
		const appIdentifier = syncInfo.projectData.projectIdentifiers[platform];
		const deviceProjectRootOptions: IDeviceProjectRootOptions = _.assign({ appIdentifier }, syncInfo);
		return {
			appIdentifier,
			device: syncInfo.device,
			platform: syncInfo.device.deviceInfo.platform,
			getDeviceProjectRootPath: () => this.$devicePathProvider.getDeviceProjectRootPath(syncInfo.device, deviceProjectRootOptions),
			deviceSyncZipPath: this.$devicePathProvider.getDeviceSyncZipPath(syncInfo.device),
			isLiveSyncSupported: async () => true
		};
	}

	private logFilesSyncInformation(localToDevicePaths: Mobile.ILocalToDevicePathData[], message: string, action: Function): void {
		if (localToDevicePaths && localToDevicePaths.length < 10) {
			_.each(localToDevicePaths, (file: Mobile.ILocalToDevicePathData) => {
				action.call(this.$logger, util.format(message, path.basename(file.getLocalPath()).yellow));
			});
		} else {
			action.call(this.$logger, util.format(message, "all files"));
		}
	}
}
