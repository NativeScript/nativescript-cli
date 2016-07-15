import * as fiberBootstrap from "../../common/fiber-bootstrap";
import syncBatchLib = require("../../common/services/livesync/sync-batch");
import * as shell from "shelljs";
import * as path from "path";
import * as temp from "temp";
import * as minimatch from "minimatch";
import * as constants from "../../common/constants";
import * as util from "util";
import { EventEmitter } from "events";

let gaze = require("gaze");

class LiveSyncServiceBase extends EventEmitter implements ILiveSyncServiceBase {
	private showFullLiveSyncInformation: boolean = false;
	private fileHashes: IDictionary<string>;

	constructor(protected $devicesService: Mobile.IDevicesService,
		protected $mobileHelper: Mobile.IMobileHelper,
		protected $logger: ILogger,
		protected $options: ICommonOptions,
		protected $deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		protected $fs: IFileSystem,
		protected $injector: IInjector,
		protected $hooksService: IHooksService,
		private $projectFilesManager: IProjectFilesManager,
		private $projectFilesProvider: IProjectFilesProvider,
		private $liveSyncProvider: ILiveSyncProvider,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $iOSDebugService: IDebugService,
		private $dispatcher: IFutureDispatcher) {
		super();
		this.fileHashes = Object.create(null);
	}

	public sync(data: ILiveSyncData[], filePaths?: string[]): IFuture<void> {
		return (() => {
			this.syncCore(data, filePaths).wait();
			if (this.$options.watch) {
				this.$hooksService.executeBeforeHooks('watch').wait();
				this.partialSync(data, data[0].syncWorkingDirectory);
			}
		}).future<void>()();
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

	private partialSync(data: ILiveSyncData[], syncWorkingDirectory: string): void {
		let that = this;
		this.showFullLiveSyncInformation = true;
		gaze("**/*", { cwd: syncWorkingDirectory }, function (err: any, watcher: any) {
			this.on('all', (event: string, filePath: string) => {
				fiberBootstrap.run(() => {
					that.$dispatcher.dispatch(() => (() => {
						try {

							if (filePath.indexOf(constants.APP_RESOURCES_FOLDER_NAME) !== -1) {
								that.$logger.warn(`Skipping livesync for changed file ${filePath}. This change requires a full build to update your application. `.yellow.bold);
								return;
							}

							let fileHash = that.$fs.exists(filePath).wait() && that.$fs.getFsStats(filePath).wait().isFile() ? that.$fs.getFileShasum(filePath).wait() : "";
							if (fileHash === that.fileHashes[filePath]) {
								that.$logger.trace(`Skipping livesync for ${filePath} file with ${fileHash} hash.`);
								return;
							}

							that.$logger.trace(`Adding ${filePath} file with ${fileHash} hash.`);
							that.fileHashes[filePath] = fileHash;

							for (let dataItem of data) {
								if (that.isFileExcluded(filePath, dataItem.excludedProjectDirsAndFiles)) {
									that.$logger.trace(`Skipping livesync for changed file ${filePath} as it is excluded in the patterns: ${dataItem.excludedProjectDirsAndFiles.join(", ")}`);
									continue;
								}
								let mappedFilePath = that.$projectFilesProvider.mapFilePath(filePath, dataItem.platform);
								that.$logger.trace(`Syncing filePath ${filePath}, mappedFilePath is ${mappedFilePath}`);
								if (!mappedFilePath) {
									that.$logger.warn(`Unable to sync ${filePath}.`);
									continue;
								}

								if (event === "added" || event === "changed" || event === "renamed") {
									that.batchSync(dataItem, mappedFilePath);
								} else if (event === "deleted") {
									that.fileHashes = <any>(_.omit(that.fileHashes, filePath));
									that.syncRemovedFile(dataItem, mappedFilePath).wait();
								}
							}
						} catch (err) {
							that.$logger.info(`Unable to sync file ${filePath}. Error is:${err.message}`.red.bold);
							that.$logger.info("Try saving it again or restart the livesync operation.");
						}
					}).future<void>()());
				});
			});
		});

		this.$dispatcher.run();
	}

	private batch: IDictionary<ISyncBatch> = Object.create(null);
	private livesyncData: IDictionary<ILiveSyncData> = Object.create(null);

	private batchSync(data: ILiveSyncData, filePath: string): void {
		let platformBatch: ISyncBatch = this.batch[data.platform];
		if (!platformBatch || !platformBatch.syncPending) {
			let done = () => {
				return (() => {
					setTimeout(() => {
						fiberBootstrap.run(() => {
							this.$dispatcher.dispatch(() => (() => {
								try {
									for (let platformName in this.batch) {
									    let batch = this.batch[platformName];
										let livesyncData = this.livesyncData[platformName];
										batch.syncFiles(((filesToSync:string[]) => {
											this.$liveSyncProvider.preparePlatformForSync(platformName).wait();
										 	this.syncCore([livesyncData], filesToSync);
										}).future<void>()).wait();
									}
								} catch (err) {
								 	this.$logger.warn(`Unable to sync files. Error is:`, err.message);
								}
							}).future<void>()());

						});
					}, syncBatchLib.SYNC_WAIT_THRESHOLD);
				}).future<void>()();
			};
			this.batch[data.platform] = this.$injector.resolve(syncBatchLib.SyncBatch, { done: done });
			this.livesyncData[data.platform] = data;
		}

		this.batch[data.platform].addFile(filePath);
	}

	private syncRemovedFile(data: ILiveSyncData, filePath: string): IFuture<void> {
		return (() => {
			let filePathArray = [filePath],
				deviceFilesAction = this.getSyncRemovedFilesAction(data);

			this.syncCore([data], filePathArray, deviceFilesAction).wait();
		}).future<void>()();
	}

	public getSyncRemovedFilesAction(data: ILiveSyncData): (device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void> {
		return (device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => {
			let platformLiveSyncService = this.resolvePlatformLiveSyncService(data.platform, device);
			return platformLiveSyncService.removeFiles(data.appIdentifier, localToDevicePaths);
		};
	}

	public getSyncAction(data: ILiveSyncData, filesToSync: string[], deviceFilesAction: (device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>, liveSyncOptions: ILiveSyncOptions): (device: Mobile.IDevice) => IFuture<void> {
		let appIdentifier = data.appIdentifier;
		let platform = data.platform;
		let projectFilesPath = data.projectFilesPath;

		let packageFilePath: string = null;

		let action = (device: Mobile.IDevice): IFuture<void> => {
			return (() => {
				let shouldRefreshApplication = true;
				let deviceAppData = this.$deviceAppDataFactory.create(appIdentifier, this.$mobileHelper.normalizePlatformName(platform), device, liveSyncOptions);
				let platformLiveSyncService = this.resolvePlatformLiveSyncService(platform, device);

				if (platformLiveSyncService.beforeLiveSyncAction) {
					platformLiveSyncService.beforeLiveSyncAction(deviceAppData).wait();
				}

				// Not installed application
				device.applicationManager.checkForApplicationUpdates().wait();

				let wasInstalled = true;
				if (!device.applicationManager.isApplicationInstalled(appIdentifier).wait()) {
					this.$logger.warn(`The application with id "${appIdentifier}" is not installed on device with identifier ${device.deviceInfo.identifier}.`);
					if (!packageFilePath) {
						packageFilePath = this.$liveSyncProvider.buildForDevice(device).wait();
					}
					device.applicationManager.installApplication(packageFilePath).wait();

					let localToDevicePaths = this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, filesToSync, data.excludedProjectDirsAndFiles, liveSyncOptions);
					shouldRefreshApplication = platformLiveSyncService.afterInstallApplicationAction(deviceAppData, localToDevicePaths).wait();

					if (device.applicationManager.canStartApplication() && !shouldRefreshApplication) {
						if (!this.emit("syncAfterInstall", device, data)) {
							device.applicationManager.startApplication(appIdentifier).wait();
						}
					}
					wasInstalled = false;
				}

				// Restart application or reload page
				if (shouldRefreshApplication) {
					// Transfer or remove files on device
					let localToDevicePaths = this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, filesToSync, data.excludedProjectDirsAndFiles, liveSyncOptions);
					if (deviceFilesAction) {
						deviceFilesAction(device, localToDevicePaths).wait();
					} else {
						this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, !filesToSync).wait();
					}

					this.$logger.info("Applying changes...");
					if (!this.emit("sync", device, data)) {
						platformLiveSyncService.refreshApplication(deviceAppData, localToDevicePaths, data.forceExecuteFullSync || !wasInstalled).wait();
					}
					this.$logger.info(`Successfully synced application ${data.appIdentifier} on device ${device.deviceInfo.identifier}.`);
				}

			}).future<void>()();
		};

		return action;
	}

	private syncCore(data: ILiveSyncData[], filesToSync: string[], deviceFilesAction?: (device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => IFuture<void>): IFuture<void> {
		return (() => {
			for (let dataItem of data) {
				let appIdentifier = dataItem.appIdentifier;
				let platform = dataItem.platform;
				let canExecute = this.getCanExecuteAction(platform, appIdentifier);
				let action = this.getSyncAction(dataItem, filesToSync, deviceFilesAction, { isForCompanionApp: this.$options.companion, additionalConfigurations: dataItem.additionalConfigurations, configuration: dataItem.configuration, isForDeletedFiles: false });
				this.$devicesService.execute(action, canExecute).wait();
			}
		}).future<void>()();
	}

	private transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): IFuture<void> {
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

	private logFilesSyncInformation(localToDevicePaths: Mobile.ILocalToDevicePathData[], message: string, action: Function): void {
		if (this.showFullLiveSyncInformation) {
			_.each(localToDevicePaths, (file: Mobile.ILocalToDevicePathData) => {
				action.call(this.$logger, util.format(message, path.basename(file.getLocalPath()).yellow));
			});
		} else {
			action.call(this.$logger, util.format(message, "all files"));
		}
	}

	private resolvePlatformLiveSyncService(platform: string, device: Mobile.IDevice): IPlatformLiveSyncService {
		return this.$injector.resolve(this.$liveSyncProvider.platformSpecificLiveSyncServices[platform.toLowerCase()], { _device: device });
	}

	public getCanExecuteAction(platform: string, appIdentifier: string): (dev: Mobile.IDevice) => boolean {
		let isTheSamePlatformAction = ((device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (this.$options.device) {
			return (device: Mobile.IDevice): boolean => isTheSamePlatformAction(device)
				&& device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
		}

		if (this.$mobileHelper.isiOSPlatform(platform)) {
			if (this.$options.emulator) {
				return (device: Mobile.IDevice): boolean => isTheSamePlatformAction(device) && this.$devicesService.isiOSSimulator(device);
			} else {
				let devices = this.$devicesService.getDevicesForPlatform(platform);
				let simulator = _.find(devices, d => this.$devicesService.isiOSSimulator(d));
				if (simulator) {
					let iOSDevices = _.filter(devices, d => d.deviceInfo.identifier !== simulator.deviceInfo.identifier);
					if (iOSDevices && iOSDevices.length) {
						let isApplicationInstalledOnSimulator = simulator.applicationManager.isApplicationInstalled(appIdentifier).wait();
						let isApplicationInstalledOnAllDevices = _.intersection.apply(null, iOSDevices.map(device => device.applicationManager.isApplicationInstalled(appIdentifier).wait()));
						// In case the application is not installed on both device and simulator, syncs only on device.
						if (!isApplicationInstalledOnSimulator && !isApplicationInstalledOnAllDevices) {
							return (device: Mobile.IDevice): boolean => isTheSamePlatformAction(device) && this.$devicesService.isiOSDevice(device);
						}
					}
				}
			}
		}

		return isTheSamePlatformAction;
	}
}
$injector.register('liveSyncServiceBase', LiveSyncServiceBase);
