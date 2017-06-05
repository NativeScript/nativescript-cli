import * as deviceAppDataIdentifiers from "../../providers/device-app-data-provider";
import * as path from "path";
import * as iosdls from "./ios-device-livesync-service";
import * as temp from "temp";
// import * as uuid from "uuid";

export class IOSLiveSyncService implements IPlatformLiveSyncService {
	constructor(
		private $devicesService: Mobile.IDevicesService,
		private $projectFilesManager: IProjectFilesManager,
		private $platformsData: IPlatformsData,
		private $logger: ILogger,
		private $projectFilesProvider: IProjectFilesProvider,
		private $fs: IFileSystem,
		private $injector: IInjector) {
	}

	/*
	fullSync(projectData: IProjectData, device: Mobile.IDevice): Promise<ILiveSyncResultInfo>;
	liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<ILiveSyncResultInfo>;
	refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void>;
	*/

	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const projectData = syncInfo.projectData;
		const device = syncInfo.device;
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const deviceAppData = this.$injector.resolve(deviceAppDataIdentifiers.IOSAppIdentifier,
			{ _appIdentifier: projectData.projectId, device, platform: device.deviceInfo.platform });
		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, "app");

		if (device.isEmulator) {
			const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, []);
			await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, true);
			return {
				deviceAppData,
				isFullSync: true,
				modifiedFilesData: localToDevicePaths
			};
		} else {
			temp.track();
			let tempZip = temp.path({ prefix: "sync", suffix: ".zip" });
			let tempApp = temp.mkdirSync("app");
			this.$logger.trace("Creating zip file: " + tempZip);
			this.$fs.copyFile(path.join(path.dirname(projectFilesPath), "app/*"), tempApp);

			if (!syncInfo.syncAllFiles) {
				this.$logger.info("Skipping node_modules folder! Use the syncAllFiles option to sync files from this folder.");
				this.$fs.deleteDirectory(path.join(tempApp, "tns_modules"));
			}

			await this.$fs.zipFiles(tempZip, this.$fs.enumerateFilesInDirectorySync(tempApp), (res) => {
				return path.join("app", path.relative(tempApp, res));
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
	}

	public async liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: ILiveSyncWatchInfo): Promise<ILiveSyncResultInfo> {
		const projectData = liveSyncInfo.projectData;
		const deviceAppData = this.$injector.resolve(deviceAppDataIdentifiers.IOSAppIdentifier,
			{ _appIdentifier: projectData.projectId, device, platform: device.deviceInfo.platform });
		let modifiedLocalToDevicePaths: Mobile.ILocalToDevicePathData[] = [];

		if (liveSyncInfo.isRebuilt) {
			// In this case we should execute fullsync:
			await this.fullSync({ projectData, device, syncAllFiles: liveSyncInfo.syncAllFiles });
		} else {
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
					const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
					const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, "app");
					let localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData,
						projectFilesPath, mappedFiles, []);
					modifiedLocalToDevicePaths.push(...localToDevicePaths);
					await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, false);
				}
			}

			if (liveSyncInfo.filesToRemove.length) {
				const filePaths = liveSyncInfo.filesToRemove;
				const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);

				const mappedFiles = _.map(filePaths, filePath => this.$projectFilesProvider.mapFilePath(filePath, device.deviceInfo.platform, projectData));
				const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, "app");
				let localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, mappedFiles, []);
				modifiedLocalToDevicePaths.push(...localToDevicePaths);

				const deviceLiveSyncService = this.$injector.resolve(iosdls.IOSDeviceLiveSyncService, { _device: device });
				deviceLiveSyncService.removeFiles(projectData.projectId, localToDevicePaths, projectData.projectId);
			}
		}

		return {
			modifiedFilesData: modifiedLocalToDevicePaths,
			isFullSync: liveSyncInfo.isRebuilt,
			deviceAppData
		};
	}

	public async refreshApplication(projectData: IProjectData, liveSyncInfo: ILiveSyncResultInfo): Promise<void> {
		let deviceLiveSyncService = this.$injector.resolve(iosdls.IOSDeviceLiveSyncService, { _device: liveSyncInfo.deviceAppData.device });
		this.$logger.info("Refreshing application...");
		await deviceLiveSyncService.refreshApplication(projectData, liveSyncInfo);
	}

	protected async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<void> {
		let canTransferDirectory = isFullSync && this.$devicesService.isiOSDevice(deviceAppData.device);
		if (canTransferDirectory) {
			await deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			await deviceAppData.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
		}

		console.log("### ios TRANSFEREEDDDDDDD!!!!!!");
	}
}
