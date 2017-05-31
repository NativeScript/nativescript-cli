import * as deviceAppDataIdentifiers from "../../providers/device-app-data-provider";
import * as path from "path";
import * as adls from "./android-device-livesync-service";

export class AndroidLiveSyncService {
	constructor(private $projectFilesManager: IProjectFilesManager,
		private $platformsData: IPlatformsData,
		private $logger: ILogger,
		private $projectFilesProvider: IProjectFilesProvider,
		private $fs: IFileSystem,
		private $injector: IInjector) {
	}

	public async fullSync(projectData: IProjectData, device: Mobile.IDevice): Promise<void> {
		const deviceLiveSyncService = this.$injector.resolve<adls.AndroidLiveSyncService>(adls.AndroidLiveSyncService, { _device: device });
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const deviceAppData = this.$injector.resolve(deviceAppDataIdentifiers.AndroidAppIdentifier,
			{ _appIdentifier: projectData.projectId, device, platform: device.deviceInfo.platform });

		await deviceLiveSyncService.beforeLiveSyncAction(deviceAppData);

		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, "app");
		const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, []);
		await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, true);
	}

	public async liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: { projectData: IProjectData, filesToRemove: string[], filesToSync: string[], isRebuilt: boolean }): Promise<void> {
		const projectData = liveSyncInfo.projectData;
		const deviceAppData = this.$injector.resolve(deviceAppDataIdentifiers.AndroidAppIdentifier,
				{ _appIdentifier: projectData.projectId, device, platform: device.deviceInfo.platform });

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
				const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, "app");
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
			const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, "app");
			let localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, mappedFiles, []);
			modifiedLocalToDevicePaths.push(...localToDevicePaths);

			const deviceLiveSyncService = this.$injector.resolve(adls.AndroidLiveSyncService, { _device: device });
			deviceLiveSyncService.removeFiles(projectData.projectId, localToDevicePaths, projectData.projectId);
		}

		if (liveSyncInfo.isRebuilt) {
			// After application is rebuilt, we should just start it
			await device.applicationManager.restartApplication(liveSyncInfo.projectData.projectId, liveSyncInfo.projectData.projectName);
		} else if (modifiedLocalToDevicePaths) {
			await this.refreshApplication(deviceAppData, modifiedLocalToDevicePaths, false, projectData);
		}
	}

	public async refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], isFullSync: boolean, projectData: IProjectData): Promise<void> {
		let deviceLiveSyncService = this.$injector.resolve(adls.AndroidLiveSyncService, { _device: deviceAppData.device });
		this.$logger.info("Refreshing application...");
		await deviceLiveSyncService.refreshApplication(deviceAppData, localToDevicePaths, isFullSync, projectData);
	}

	protected async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, canTransferDirectory: boolean): Promise<void> {
		if (canTransferDirectory) {
			await deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			await deviceAppData.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
		}

		console.log("TRANSFEREEDDDDDDD!!!!!!");
	}
}
