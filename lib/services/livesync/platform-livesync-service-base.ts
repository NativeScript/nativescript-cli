import syncBatchLib = require("../../common/services/livesync/sync-batch");
import * as shell from "shelljs";
import * as path from "path";
import * as temp from "temp";
import * as minimatch from "minimatch";
import * as constants from "../../common/constants";
import * as util from "util";

export abstract class PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	private showFullLiveSyncInformation: boolean = false;
	private fileHashes: IDictionary<string>;
	private batch: IDictionary<ISyncBatch> = Object.create(null);
	private livesyncData: IDictionary<ILiveSyncData> = Object.create(null);

	protected liveSyncData: ILiveSyncData;

	constructor(_liveSyncData: ILiveSyncData,
		protected $devicesService: Mobile.IDevicesService,
		protected $mobileHelper: Mobile.IMobileHelper,
		protected $logger: ILogger,
		protected $options: ICommonOptions,
		protected $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		protected $fs: IFileSystem,
		protected $injector: IInjector,
		protected $projectFilesManager: IProjectFilesManager,
		protected $projectFilesProvider: IProjectFilesProvider,
		protected $liveSyncProvider: ILiveSyncProvider) {
		this.liveSyncData = _liveSyncData;
		this.fileHashes = Object.create(null);
	}

	public abstract fullSync(postAction?: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): IFuture<void>;

	public partialSync(event: string, filePath: string, dispatcher: IFutureDispatcher, afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): void {
		if (filePath.indexOf(constants.APP_RESOURCES_FOLDER_NAME) !== -1) {
			this.$logger.warn(`Skipping livesync for changed file ${filePath}. This change requires a full build to update your application. `.yellow.bold);
			return;
		}

		let fileHash = this.$fs.exists(filePath).wait() && this.$fs.getFsStats(filePath).wait().isFile() ? this.$fs.getFileShasum(filePath).wait() : "";
		if (fileHash === this.fileHashes[filePath]) {
			this.$logger.trace(`Skipping livesync for ${filePath} file with ${fileHash} hash.`);
			return;
		}

		this.$logger.trace(`Adding ${filePath} file with ${fileHash} hash.`);
		this.fileHashes[filePath] = fileHash;

		if (this.isFileExcluded(filePath, this.liveSyncData.excludedProjectDirsAndFiles)) {
			this.$logger.trace(`Skipping livesync for changed file ${filePath} as it is excluded in the patterns: ${this.liveSyncData.excludedProjectDirsAndFiles.join(", ")}`);
			return;
		}
		let mappedFilePath = this.$projectFilesProvider.mapFilePath(filePath, this.liveSyncData.platform);
		this.$logger.trace(`Syncing filePath ${filePath}, mappedFilePath is ${mappedFilePath}`);
		if (!mappedFilePath) {
			this.$logger.warn(`Unable to sync ${filePath}.`);
			return;
		}

		if (event === "added" || event === "changed" || event === "renamed") {
			this.batchSync(mappedFilePath, dispatcher, afterFileSyncAction);
		} else if (event === "deleted") {
			this.fileHashes = <any>(_.omit(this.fileHashes, filePath));
			this.syncRemovedFile(mappedFilePath, afterFileSyncAction).wait();
		}
	}

	protected getCanExecuteAction(platform: string, appIdentifier: string): (dev: Mobile.IDevice) => boolean {
		let isTheSamePlatformAction = ((device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (this.$options.device) {
			return (device: Mobile.IDevice): boolean => isTheSamePlatformAction(device) && device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
		}
		return isTheSamePlatformAction;
	}

	protected tryInstallApplication(device: Mobile.IDevice, deviceAppData: Mobile.IDeviceAppData): IFuture<boolean> {
		return (() => {
			device.applicationManager.checkForApplicationUpdates().wait();

			let appIdentifier = this.liveSyncData.appIdentifier;
			if (!device.applicationManager.isApplicationInstalled(appIdentifier).wait()) {
				this.$logger.warn(`The application with id "${appIdentifier}" is not installed on device with identifier ${device.deviceInfo.identifier}.`);

				let packageFilePath = this.$liveSyncProvider.buildForDevice(device).wait();
				device.applicationManager.installApplication(packageFilePath).wait();

				return true;
			}

			return false;
		}).future<boolean>()();
	}

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			let deviceLiveSyncService = this.resolveDeviceSpecificLiveSyncService(deviceAppData.device.deviceInfo.platform, deviceAppData.device);
			this.$logger.info("Applying changes...");
			deviceLiveSyncService.refreshApplication(deviceAppData, localToDevicePaths, this.liveSyncData.forceExecuteFullSync).wait();
		}).future<void>()();
	}

	protected finishLivesync(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			// This message is important because it signals Visual Studio Code that livesync has finished and debugger can be attached.
			this.$logger.info(`Successfully synced application ${deviceAppData.appIdentifier} on device ${deviceAppData.device.deviceInfo.identifier}.`);
		}).future<void>()();
	}

	protected transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): IFuture<void> {
		return (() => {
			this.$logger.info("Transferring project files...");
			this.logFilesSyncInformation(localToDevicePaths, "Transferring %s.", this.$logger.trace);

			let canTransferDirectory = isFullSync && (this.$devicesService.isAndroidDevice(deviceAppData.device) || this.$devicesService.isiOSSimulator(deviceAppData.device));
			if (canTransferDirectory) {
				let tempDir = temp.mkdirSync("tempDir");
				shell.cp("-Rf", path.join(projectFilesPath, "*"), tempDir);
				this.$projectFilesManager.processPlatformSpecificFiles(tempDir, deviceAppData.platform).wait();
				deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, tempDir).wait();
			} else {
				this.$liveSyncProvider.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, isFullSync).wait();
			}

			this.logFilesSyncInformation(localToDevicePaths, "Successfully transferred %s.", this.$logger.info);
		}).future<void>()();
	}

	protected resolveDeviceSpecificLiveSyncService(platform: string, device: Mobile.IDevice): IDeviceLiveSyncService {
		return this.$injector.resolve(this.$liveSyncProvider.deviceSpecificLiveSyncServices[platform.toLowerCase()], { _device: device });
	}

	private isFileExcluded(filePath: string, excludedPatterns: string[]): boolean {
		let isFileExcluded = false;
		_.each(excludedPatterns, pattern => {
			if (minimatch(filePath, pattern, { nocase: true })) {
				isFileExcluded = true;
				return false;
			}
		});

		return isFileExcluded;
	}

	private batchSync(filePath: string, dispatcher: IFutureDispatcher, afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): void {
		let platformBatch: ISyncBatch = this.batch[this.liveSyncData.platform];
		if (!platformBatch || !platformBatch.syncPending) {
			let done = () => {
				return (() => {
					dispatcher.dispatch(() => (() => {
						try {
							for (let platformName in this.batch) {
								let batch = this.batch[platformName];
								batch.syncFiles(((filesToSync:string[]) => {
									this.$liveSyncProvider.preparePlatformForSync(platformName).wait();

									let canExecute = this.getCanExecuteAction(this.liveSyncData.platform, this.liveSyncData.appIdentifier);
									let deviceFileAction = (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, !filePath);
									let action = this.getSyncAction(filesToSync, deviceFileAction, afterFileSyncAction);
									this.$devicesService.execute(action, canExecute);
								}).future<void>()).wait();
							}
						} catch (err) {
						 	this.$logger.warn(`Unable to sync files. Error is:`, err.message);
						}
					}).future<void>()());
				}).future<void>()();
			};
			this.batch[this.liveSyncData.platform] = this.$injector.resolve(syncBatchLib.SyncBatch, { done: done });
			this.livesyncData[this.liveSyncData.platform] = this.liveSyncData;
		}

		this.batch[this.liveSyncData.platform].addFile(filePath);
	}

	private syncRemovedFile(filePath: string, afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): IFuture<void> {
		return (() => {
			let deviceFilesAction = (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => {
				let deviceLiveSyncService = this.resolveDeviceSpecificLiveSyncService(this.liveSyncData.platform, deviceAppData.device);
				return deviceLiveSyncService.removeFiles(this.liveSyncData.appIdentifier, localToDevicePaths);
			};
			let canExecute = this.getCanExecuteAction(this.liveSyncData.platform, this.liveSyncData.appIdentifier);
			let action = this.getSyncAction([filePath], deviceFilesAction, afterFileSyncAction);
			this.$devicesService.execute(action, canExecute).wait();
		}).future<void>()();
	}

	private getSyncAction(filesToSync: string[],
		fileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>,
		afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): (device: Mobile.IDevice) => IFuture<void> {
		let action = (device: Mobile.IDevice): IFuture<void> => {
			return (() => {
				let deviceAppData = this.$deviceAppDataFactory.create(this.liveSyncData.appIdentifier, this.$mobileHelper.normalizePlatformName(this.liveSyncData.platform), device);
				let localToDevicePaths = this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, this.liveSyncData.projectFilesPath, filesToSync, this.liveSyncData.excludedProjectDirsAndFiles);

				fileSyncAction(deviceAppData, localToDevicePaths).wait();
				if (!afterFileSyncAction) {
					this.refreshApplication(deviceAppData, localToDevicePaths).wait();
				}
				this.finishLivesync(deviceAppData).wait();
				if (afterFileSyncAction) {
					afterFileSyncAction(deviceAppData, localToDevicePaths).wait();
				}
			}).future<void>()();
		};

		return action;
	}

	private logFilesSyncInformation(localToDevicePaths: Mobile.ILocalToDevicePathData[], message: string, action: Function): void {
		if (this.showFullLiveSyncInformation) {
			_.each(localToDevicePaths, (file: Mobile.ILocalToDevicePathData) => {
				action.call(this.$logger, util.format(message, path.basename(file.getLocalPath()).yellow));
			});
		} else {
			action.call(this.$logger, util.format(message, "all files"));
		}
	}
}
