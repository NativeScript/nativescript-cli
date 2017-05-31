import * as deviceAppDataIdentifiers from "../../providers/device-app-data-provider";
import * as path from "path";
import * as iosdls from "./ios-device-livesync-service";
import * as temp from "temp";
// import * as uuid from "uuid";

export class IOSLiveSyncService {
	constructor(
		private $devicesService: Mobile.IDevicesService,
		private $options: IOptions,
		private $projectFilesManager: IProjectFilesManager,
		private $platformsData: IPlatformsData,
		private $logger: ILogger,
		private $projectFilesProvider: IProjectFilesProvider,
		private $fs: IFileSystem,
		private $injector: IInjector) {
	}

	public async fullSync(projectData: IProjectData, device: Mobile.IDevice): Promise<void> {
		const platformData = this.$platformsData.getPlatformData(device.deviceInfo.platform, projectData);
		const deviceAppData = this.$injector.resolve(deviceAppDataIdentifiers.IOSAppIdentifier,
			{ _appIdentifier: projectData.projectId, device, platform: device.deviceInfo.platform });
		const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, "app");

		if (device.isEmulator) {
			const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, []);
			await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, true);
		} else {
			temp.track();
			let tempZip = temp.path({ prefix: "sync", suffix: ".zip" });
			let tempApp = temp.mkdirSync("app");
			this.$logger.trace("Creating zip file: " + tempZip);
			this.$fs.copyFile(path.join(path.dirname(projectFilesPath), "app/*"), tempApp);

			if (!this.$options.syncAllFiles) {
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
		}
	}

	public async liveSyncWatchAction(device: Mobile.IDevice, liveSyncInfo: { projectData: IProjectData, filesToRemove: string[], filesToSync: string[], isRebuilt: boolean }): Promise<void> {
		const projectData = liveSyncInfo.projectData;
		const deviceAppData = this.$injector.resolve(deviceAppDataIdentifiers.IOSAppIdentifier,
			{ _appIdentifier: projectData.projectId, device, platform: device.deviceInfo.platform });
		let modifiedLocalToDevicePaths: Mobile.ILocalToDevicePathData[] = [];

		if (liveSyncInfo.isRebuilt) {
			// In this case we should execute fullsync:
			await this.fullSync(projectData, device);
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

				const deviceLiveSyncService = this.$injector.resolve(iosdls.IOSLiveSyncService, { _device: device });
				deviceLiveSyncService.removeFiles(projectData.projectId, localToDevicePaths, projectData.projectId);
			}
		}

		if (liveSyncInfo.isRebuilt) {
			// WHAT if we are in debug session?
			// After application is rebuilt, we should just start it
			await device.applicationManager.restartApplication(liveSyncInfo.projectData.projectId, liveSyncInfo.projectData.projectName);
		} else if (modifiedLocalToDevicePaths) {
			await this.refreshApplication(deviceAppData, modifiedLocalToDevicePaths, false, projectData);
		}
	}

	public async refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], isFullSync: boolean, projectData: IProjectData): Promise<void> {
		let deviceLiveSyncService = this.$injector.resolve(iosdls.IOSLiveSyncService, { _device: deviceAppData.device });
		this.$logger.info("Refreshing application...");
		await deviceLiveSyncService.refreshApplication(deviceAppData, localToDevicePaths, isFullSync, projectData);
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
