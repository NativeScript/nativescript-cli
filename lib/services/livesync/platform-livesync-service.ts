import syncBatchLib = require("../../common/services/livesync/sync-batch");
import * as path from "path";
import * as minimatch from "minimatch";
import * as util from "util";
import * as helpers from "../../common/helpers";

const livesyncInfoFileName = ".nslivesyncinfo";

export abstract class PlatformLiveSyncServiceBase implements IPlatformLiveSyncService {
	private batch: IDictionary<ISyncBatch> = Object.create(null);
	private livesyncData: IDictionary<ILiveSyncData> = Object.create(null);

	protected liveSyncData: ILiveSyncData;

	constructor(_liveSyncData: ILiveSyncData,
		private $devicesService: Mobile.IDevicesService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $logger: ILogger,
		private $options: IOptions,
		private $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $projectFilesManager: IProjectFilesManager,
		private $projectFilesProvider: IProjectFilesProvider,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectData: IProjectData,
		private $projectChangesService: IProjectChangesService,
		private $liveSyncProvider: ILiveSyncProvider) {
		this.liveSyncData = _liveSyncData;
	}

	public fullSync(postAction?: (deviceAppData: Mobile.IDeviceAppData) => IFuture<void>): IFuture<void> {
		return (() => {
			let appIdentifier = this.liveSyncData.appIdentifier;
			let platform = this.liveSyncData.platform;
			let projectFilesPath = this.liveSyncData.projectFilesPath;
			let canExecute = this.getCanExecuteAction(platform, appIdentifier);
			let action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					let deviceAppData = this.$deviceAppDataFactory.create(appIdentifier, this.$mobileHelper.normalizePlatformName(platform), device);
					let localToDevicePaths: Mobile.ILocalToDevicePathData[] = null;
					if (this.shouldTransferAllFiles(platform, deviceAppData)) {
						localToDevicePaths = this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, this.liveSyncData.excludedProjectDirsAndFiles);
						this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, true).wait();
						device.fileSystem.putFile(this.$projectChangesService.getPrepareInfoFilePath(platform), this.getLiveSyncInfoFilePath(deviceAppData), appIdentifier).wait();
					}

					if (postAction) {
						this.finishLivesync(deviceAppData).wait();
						return postAction(deviceAppData).wait();
					}

					this.refreshApplication(deviceAppData, localToDevicePaths, true).wait();
					this.finishLivesync(deviceAppData).wait();
				}).future<void>()();
			};
			this.$devicesService.execute(action, canExecute).wait();
		}).future<void>()();
	}

	public partialSync(event: string, filePath: string, dispatcher: IFutureDispatcher, afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): void {
		if (this.isFileExcluded(filePath, this.liveSyncData.excludedProjectDirsAndFiles)) {
			this.$logger.trace(`Skipping livesync for changed file ${filePath} as it is excluded in the patterns: ${this.liveSyncData.excludedProjectDirsAndFiles.join(", ")}`);
			return;
		}

		if (event === "add" || event === "addDir" || event === "change") {
			this.batchSync(filePath, dispatcher, afterFileSyncAction);
		} else if (event === "unlink" || event === "unlinkDir") {
			this.syncRemovedFile(filePath, afterFileSyncAction).wait();
		}
	}

	protected getCanExecuteAction(platform: string, appIdentifier: string): (dev: Mobile.IDevice) => boolean {
		let isTheSamePlatformAction = ((device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (this.$options.device) {
			return (device: Mobile.IDevice): boolean => isTheSamePlatformAction(device) && device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
		}
		return isTheSamePlatformAction;
	}

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], isFullSync: boolean): IFuture<void> {
		return (() => {
			let deviceLiveSyncService = this.resolveDeviceSpecificLiveSyncService(deviceAppData.device.deviceInfo.platform, deviceAppData.device);
			this.$logger.info("Refreshing application...");
			deviceLiveSyncService.refreshApplication(deviceAppData, localToDevicePaths, isFullSync).wait();
		}).future<void>()();
	}

	protected finishLivesync(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			// This message is important because it signals Visual Studio Code that livesync has finished and debugger can be attached.
			this.$logger.info(`Successfully synced application ${deviceAppData.appIdentifier} on device ${deviceAppData.device.deviceInfo.identifier}.\n`);
		}).future<void>()();
	}

	protected transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): IFuture<void> {
		return (() => {
			this.$logger.info("Transferring project files...");
			let canTransferDirectory = isFullSync && (this.$devicesService.isAndroidDevice(deviceAppData.device) || this.$devicesService.isiOSSimulator(deviceAppData.device));
			if (canTransferDirectory) {
				deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath).wait();
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
							for (let platform in this.batch) {
								let batch = this.batch[platform];
								batch.syncFiles(((filesToSync: string[]) => {
									this.$platformService.preparePlatform(this.liveSyncData.platform).wait();
									let canExecute = this.getCanExecuteAction(this.liveSyncData.platform, this.liveSyncData.appIdentifier);
									let deviceFileAction = (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, !filePath);
									let action = this.getSyncAction(filesToSync, deviceFileAction, afterFileSyncAction);
									this.$devicesService.execute(action, canExecute).wait();
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

	private syncRemovedFile(filePath: string,
		afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): IFuture<void> {
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

	private getSyncAction(
		filesToSync: string[],
		fileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>,
		afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): (device: Mobile.IDevice) => IFuture<void> {
		let action = (device: Mobile.IDevice): IFuture<void> => {
			return (() => {
				let deviceAppData: Mobile.IDeviceAppData = null;
				let localToDevicePaths: Mobile.ILocalToDevicePathData[] = null;
				let isFullSync = false;
				if (this.$options.clean || this.$projectChangesService.currentChanges.changesRequireBuild) {
					let buildConfig: IBuildConfig = { buildForDevice: !device.isEmulator };
					let platform = device.deviceInfo.platform;
					if (this.$platformService.shouldBuild(platform, buildConfig)) {
						this.$platformService.buildPlatform(platform, buildConfig).wait();
					}
					this.$platformService.installApplication(device).wait();
					deviceAppData = this.$deviceAppDataFactory.create(this.liveSyncData.appIdentifier, this.$mobileHelper.normalizePlatformName(this.liveSyncData.platform), device);
					isFullSync = true;
				} else {
					deviceAppData = this.$deviceAppDataFactory.create(this.liveSyncData.appIdentifier, this.$mobileHelper.normalizePlatformName(this.liveSyncData.platform), device);

					const mappedFiles = filesToSync.map((file: string) => this.$projectFilesProvider.mapFilePath(file, device.deviceInfo.platform));

					// Some plugins modify platforms dir on afterPrepare (check nativescript-dev-sass) - we want to sync only existing file.
					const existingFiles = mappedFiles.filter(m => this.$fs.exists(m));

					this.$logger.trace("Will execute livesync for files: ", existingFiles);

					const skippedFiles = _.difference(mappedFiles, existingFiles);

					if (skippedFiles.length) {
						this.$logger.trace("The following files will not be synced as they do not exist:", skippedFiles);
					}

					localToDevicePaths = this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, this.liveSyncData.projectFilesPath, existingFiles, this.liveSyncData.excludedProjectDirsAndFiles);

					fileSyncAction(deviceAppData, localToDevicePaths).wait();
				}

				if (!afterFileSyncAction) {
					this.refreshApplication(deviceAppData, localToDevicePaths, isFullSync).wait();
				}

				device.fileSystem.putFile(this.$projectChangesService.getPrepareInfoFilePath(device.deviceInfo.platform), this.getLiveSyncInfoFilePath(deviceAppData), this.liveSyncData.appIdentifier).wait();
				this.finishLivesync(deviceAppData).wait();
				if (afterFileSyncAction) {
					afterFileSyncAction(deviceAppData, localToDevicePaths).wait();
				}
			}).future<void>()();
		};
		return action;
	}

	private shouldTransferAllFiles(platform: string, deviceAppData: Mobile.IDeviceAppData) {
		try {
			if (this.$options.clean) {
				return false;
			}
			let fileText = this.$platformService.readFile(deviceAppData.device, this.getLiveSyncInfoFilePath(deviceAppData)).wait();
			let remoteLivesyncInfo: IPrepareInfo = JSON.parse(fileText);
			let localPrepareInfo = this.$projectChangesService.getPrepareInfo(platform);
			return remoteLivesyncInfo.time !== localPrepareInfo.time;
		} catch (e) {
			return true;
		}
	}

	private getLiveSyncInfoFilePath(deviceAppData: Mobile.IDeviceAppData) {
		let deviceRootPath = path.dirname(deviceAppData.deviceProjectRootPath);
		let deviceFilePath = helpers.fromWindowsRelativePathToUnix(path.join(deviceRootPath, livesyncInfoFileName));
		return deviceFilePath;
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
$injector.register("platformLiveSyncService", PlatformLiveSyncServiceBase);
