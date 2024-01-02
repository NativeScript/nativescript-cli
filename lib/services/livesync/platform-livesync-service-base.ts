import * as path from "path";
import * as util from "util";
import * as _ from "lodash";
import { APP_FOLDER_NAME } from "../../constants";
import { getHash } from "../../common/helpers";
import { performanceLog } from "../../common/decorators";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import {
	IFileSystem,
	IDictionary,
	IProjectFilesManager,
} from "../../common/declarations";
import { color } from "../../color";
import { IOptions } from "../../declarations";

export abstract class PlatformLiveSyncServiceBase {
	private _deviceLiveSyncServicesCache: IDictionary<INativeScriptDeviceLiveSyncService> =
		{};

	constructor(
		protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $platformsDataService: IPlatformsDataService,
		protected $projectFilesManager: IProjectFilesManager,
		private $devicePathProvider: IDevicePathProvider,
		private $options: IOptions
	) {}

	public getDeviceLiveSyncService(
		device: Mobile.IDevice,
		projectData: IProjectData
	): INativeScriptDeviceLiveSyncService {
		const platform = device.deviceInfo.platform.toLowerCase();
		const platformData = this.$platformsDataService.getPlatformData(
			device.deviceInfo.platform,
			projectData
		);
		const frameworkVersion =
			platformData.platformProjectService.getFrameworkVersion(projectData);
		const key = getHash(
			`${device.deviceInfo.identifier}${projectData.projectIdentifiers[platform]}${projectData.projectDir}${frameworkVersion}`
		);
		if (!this._deviceLiveSyncServicesCache[key]) {
			this._deviceLiveSyncServicesCache[key] = this._getDeviceLiveSyncService(
				device,
				projectData,
				frameworkVersion
			);
		}

		return this._deviceLiveSyncServicesCache[key];
	}

	protected abstract _getDeviceLiveSyncService(
		device: Mobile.IDevice,
		data: IProjectData,
		frameworkVersion: string
	): INativeScriptDeviceLiveSyncService;

	public async shouldRestart(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo
	): Promise<boolean> {
		const deviceLiveSyncService = this.getDeviceLiveSyncService(
			liveSyncInfo.deviceAppData.device,
			projectData
		);
		const shouldRestart = await deviceLiveSyncService.shouldRestart(
			projectData,
			liveSyncInfo
		);
		return shouldRestart;
	}

	public async syncAfterInstall(
		device: Mobile.IDevice,
		liveSyncInfo: ILiveSyncWatchInfo
	): Promise<void> {
		/* intentionally left blank */
	}

	public async restartApplication(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo
	): Promise<void> {
		const deviceLiveSyncService = this.getDeviceLiveSyncService(
			liveSyncInfo.deviceAppData.device,
			projectData
		);
		this.$logger.info(
			`Restarting application on device ${liveSyncInfo.deviceAppData.device.deviceInfo.identifier}...`
		);
		await deviceLiveSyncService.restartApplication(projectData, liveSyncInfo);
	}

	public async tryRefreshApplication(
		projectData: IProjectData,
		liveSyncInfo: ILiveSyncResultInfo
	): Promise<boolean> {
		let didRefresh = true;
		if (liveSyncInfo.isFullSync || liveSyncInfo.modifiedFilesData.length) {
			const deviceLiveSyncService = this.getDeviceLiveSyncService(
				liveSyncInfo.deviceAppData.device,
				projectData
			);
			this.$logger.info(
				`Refreshing application on device ${liveSyncInfo.deviceAppData.device.deviceInfo.identifier}...`
			);
			didRefresh = await deviceLiveSyncService.tryRefreshApplication(
				projectData,
				liveSyncInfo
			);
		}

		return didRefresh;
	}

	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const projectData = syncInfo.projectData;
		const device = syncInfo.device;
		const deviceLiveSyncService = this.getDeviceLiveSyncService(
			device,
			syncInfo.projectData
		);
		const platformData = this.$platformsDataService.getPlatformData(
			device.deviceInfo.platform,
			projectData
		);
		const deviceAppData = await this.getAppData(syncInfo);

		if (deviceLiveSyncService.beforeLiveSyncAction) {
			await deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);
		}

		const projectFilesPath = path.join(
			platformData.appDestinationDirectoryPath,
			this.$options.androidHostModule
		);
		const localToDevicePaths =
			await this.$projectFilesManager.createLocalToDevicePaths(
				deviceAppData,
				projectFilesPath,
				null,
				[]
			);
		const modifiedFilesData = await this.transferFiles(
			deviceAppData,
			localToDevicePaths,
			projectFilesPath,
			projectData,
			syncInfo.liveSyncDeviceData,
			{ isFullSync: true, force: syncInfo.force }
		);

		return {
			modifiedFilesData,
			isFullSync: true,
			deviceAppData,
			useHotModuleReload: syncInfo.useHotModuleReload,
		};
	}

	@performanceLog()
	public async liveSyncWatchAction(
		device: Mobile.IDevice,
		liveSyncInfo: ILiveSyncWatchInfo
	): Promise<ILiveSyncResultInfo> {
		const projectData = liveSyncInfo.projectData;
		const deviceLiveSyncService = this.getDeviceLiveSyncService(
			device,
			projectData
		);
		const syncInfo = _.merge({ device, watch: true }, liveSyncInfo);
		const deviceAppData = await this.getAppData(syncInfo);

		if (deviceLiveSyncService.beforeLiveSyncAction) {
			await deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);
		}

		let modifiedLocalToDevicePaths: Mobile.ILocalToDevicePathData[] = [];
		if (liveSyncInfo.filesToSync.length) {
			const filesToSync = liveSyncInfo.filesToSync;
			// const mappedFiles = _.map(filesToSync, filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData));

			// Some plugins modify platforms dir on afterPrepare (check nativescript-dev-sass) - we want to sync only existing file.
			const existingFiles = filesToSync.filter((m) => m && this.$fs.exists(m));
			this.$logger.trace("Will execute livesync for files: ", existingFiles);
			const skippedFiles = _.difference(filesToSync, existingFiles);
			if (skippedFiles.length) {
				this.$logger.trace(
					"The following files will not be synced as they do not exist:",
					skippedFiles
				);
			}

			if (existingFiles.length) {
				const platformData = this.$platformsDataService.getPlatformData(
					device.deviceInfo.platform,
					projectData
				);
				const projectFilesPath = path.join(
					platformData.appDestinationDirectoryPath,
					this.$options.androidHostModule
				);
				const localToDevicePaths =
					await this.$projectFilesManager.createLocalToDevicePaths(
						deviceAppData,
						projectFilesPath,
						existingFiles,
						[]
					);
				modifiedLocalToDevicePaths.push(...localToDevicePaths);
				modifiedLocalToDevicePaths = await this.transferFiles(
					deviceAppData,
					localToDevicePaths,
					projectFilesPath,
					projectData,
					liveSyncInfo.liveSyncDeviceData,
					{ isFullSync: false, force: liveSyncInfo.force }
				);
			}
		}

		if (liveSyncInfo.filesToRemove.length) {
			const filePaths = liveSyncInfo.filesToRemove;
			const platformData = this.$platformsDataService.getPlatformData(
				device.deviceInfo.platform,
				projectData
			);

			const mappedFiles = _(filePaths)
				// .map(filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData))
				.filter((filePath) => !!filePath)
				.value();
			const projectFilesPath = path.join(
				platformData.appDestinationDirectoryPath,
				APP_FOLDER_NAME
			);
			const localToDevicePaths =
				await this.$projectFilesManager.createLocalToDevicePaths(
					deviceAppData,
					projectFilesPath,
					mappedFiles,
					[]
				);
			modifiedLocalToDevicePaths.push(...localToDevicePaths);

			await deviceLiveSyncService.removeFiles(
				deviceAppData,
				localToDevicePaths,
				projectFilesPath
			);
		}

		return {
			modifiedFilesData: modifiedLocalToDevicePaths,
			isFullSync: false,
			deviceAppData,
			useHotModuleReload: liveSyncInfo.useHotModuleReload,
		};
	}

	private async transferFiles(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		projectFilesPath: string,
		projectData: IProjectData,
		liveSyncDeviceData: ILiveSyncDeviceDescriptor,
		options: ITransferFilesOptions
	): Promise<Mobile.ILocalToDevicePathData[]> {
		let transferredFiles: Mobile.ILocalToDevicePathData[] = [];
		const deviceLiveSyncService = this.getDeviceLiveSyncService(
			deviceAppData.device,
			projectData
		);

		transferredFiles = await deviceLiveSyncService.transferFiles(
			deviceAppData,
			localToDevicePaths,
			projectFilesPath,
			projectData,
			liveSyncDeviceData,
			options
		);

		await deviceAppData.device.applicationManager.setTransferredAppFiles(
			localToDevicePaths.map((l) => l.getLocalPath())
		);

		this.logFilesSyncInformation(
			transferredFiles,
			"Successfully transferred %s on device %s.",
			this.$logger.info,
			deviceAppData.device.deviceInfo.identifier
		);

		return transferredFiles;
	}

	public async getAppData(
		syncInfo: IFullSyncInfo
	): Promise<Mobile.IDeviceAppData> {
		const platform = syncInfo.device.deviceInfo.platform.toLowerCase();
		const appIdentifier = syncInfo.projectData.projectIdentifiers[platform];
		const deviceProjectRootOptions: IDeviceProjectRootOptions = _.assign(
			{ appIdentifier },
			syncInfo
		);
		return {
			appIdentifier,
			device: syncInfo.device,
			platform: syncInfo.device.deviceInfo.platform,
			getDeviceProjectRootPath: () =>
				this.$devicePathProvider.getDeviceProjectRootPath(
					syncInfo.device,
					deviceProjectRootOptions
				),
			deviceSyncZipPath: this.$devicePathProvider.getDeviceSyncZipPath(
				syncInfo.device
			),
			connectTimeout: syncInfo.connectTimeout,
			projectDir: syncInfo.projectData.projectDir,
		};
	}

	private logFilesSyncInformation(
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		message: string,
		action: Function,
		deviceIdentifier: string
	): void {
		if (localToDevicePaths && localToDevicePaths.length < 10) {
			_.each(localToDevicePaths, (file: Mobile.ILocalToDevicePathData) => {
				action.call(
					this.$logger,
					util.format(
						message,
						color.yellow(path.basename(file.getLocalPath()))
					),
					deviceIdentifier
				);
			});
		} else {
			action.call(
				this.$logger,
				util.format(message, "all files", deviceIdentifier)
			);
		}
	}
}
