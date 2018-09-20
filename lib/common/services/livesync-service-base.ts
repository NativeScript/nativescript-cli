import syncBatchLib = require("./livesync/sync-batch");
import * as shell from "shelljs";
import * as path from "path";
import * as temp from "temp";
import * as minimatch from "minimatch";
import * as constants from "../constants";
import * as util from "util";

const gaze = require("gaze");

class LiveSyncServiceBase implements ILiveSyncServiceBase {
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
		private $dispatcher: IFutureDispatcher,
		private $processService: IProcessService) {
		this.fileHashes = Object.create(null);
	}

	public async sync(data: ILiveSyncData[], projectId: string, projectFilesConfig: IProjectFilesConfig, filePaths?: string[]): Promise<void> {
		await this.syncCore(data, filePaths);
		if (this.$options.watch) {
			await this.$hooksService.executeBeforeHooks('watch');
			this.partialSync(data, data[0].syncWorkingDirectory, projectId, projectFilesConfig);
		}
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

	private partialSync(data: ILiveSyncData[], syncWorkingDirectory: string, projectId: string, projectFilesConfig: IProjectFilesConfig): void {
		const that = this;
		this.showFullLiveSyncInformation = true;
		const gazeInstance = gaze(["**/*", "!node_modules/**/*", "!platforms/**/*"], { cwd: syncWorkingDirectory }, function (err: any, watcher: any) {
			this.on('all', (event: string, filePath: string) => {
				that.$logger.trace(`Received event  ${event} for filePath: ${filePath}. Add it to queue.`);

				that.$dispatcher.dispatch(async () => {
					try {
						if (filePath.indexOf(constants.APP_RESOURCES_FOLDER_NAME) !== -1) {
							that.$logger.warn(`Skipping livesync for changed file ${filePath}. This change requires a full build to update your application. `.yellow.bold);
							return;
						}

						const fileHash = that.$fs.exists(filePath) && that.$fs.getFsStats(filePath).isFile() ? await that.$fs.getFileShasum(filePath) : "";
						if (fileHash === that.fileHashes[filePath]) {
							that.$logger.trace(`Skipping livesync for ${filePath} file with ${fileHash} hash.`);
							return;
						}

						that.$logger.trace(`Adding ${filePath} file with ${fileHash} hash.`);
						that.fileHashes[filePath] = <string>fileHash;

						for (const dataItem of data) {
							if (that.isFileExcluded(filePath, dataItem.excludedProjectDirsAndFiles)) {
								that.$logger.trace(`Skipping livesync for changed file ${filePath} as it is excluded in the patterns: ${dataItem.excludedProjectDirsAndFiles.join(", ")}`);
								continue;
							}
							const mappedFilePath = that.$projectFilesProvider.mapFilePath(filePath, dataItem.platform, projectId, projectFilesConfig);
							that.$logger.trace(`Syncing filePath ${filePath}, mappedFilePath is ${mappedFilePath}`);
							if (!mappedFilePath) {
								that.$logger.warn(`Unable to sync ${filePath}.`);
								continue;
							}

							if (event === "added" || event === "changed" || event === "renamed") {
								that.batchSync(dataItem, mappedFilePath, projectId);
							} else if (event === "deleted") {
								that.fileHashes = <any>(_.omit(that.fileHashes, filePath));
								await that.syncRemovedFile(dataItem, mappedFilePath);
							}
						}
					} catch (err) {
						that.$logger.info(`Unable to sync file ${filePath}. Error is:${err.message}`.red.bold);
						that.$logger.info("Try saving it again or restart the livesync operation.");
					}
				});
			});
		});

		this.$processService.attachToProcessExitSignals(this, () => gazeInstance.close());
		this.$dispatcher.run();
	}

	private batch: IDictionary<ISyncBatch> = Object.create(null);
	private livesyncData: IDictionary<ILiveSyncData> = Object.create(null);

	private batchSync(data: ILiveSyncData, filePath: string, projectId: string): void {
		const platformBatch: ISyncBatch = this.batch[data.platform];
		if (!platformBatch || !platformBatch.syncPending) {
			const done = () => {
				setTimeout(() => {
					this.$dispatcher.dispatch(async () => {
						try {
							for (const platformName in this.batch) {
								const batch = this.batch[platformName];
								const livesyncData = this.livesyncData[platformName];
								await batch.syncFiles(async (filesToSync: string[]) => {
									await this.$liveSyncProvider.preparePlatformForSync(platformName, projectId);
									await this.syncCore([livesyncData], filesToSync);
								});
							}
						} catch (err) {
							this.$logger.warn(`Unable to sync files. Error is:`, err.message);
						}
					});

				}, syncBatchLib.SYNC_WAIT_THRESHOLD);
			};
			this.batch[data.platform] = this.$injector.resolve(syncBatchLib.SyncBatch, { done: done });
			this.livesyncData[data.platform] = data;
		}

		this.batch[data.platform].addFile(filePath);
	}

	private async syncRemovedFile(data: ILiveSyncData, filePath: string): Promise<void> {
		const filePathArray = [filePath],
			deviceFilesAction = this.getSyncRemovedFilesAction(data);

		await this.syncCore([data], filePathArray, deviceFilesAction);
	}

	public getSyncRemovedFilesAction(data: ILiveSyncData): (deviceAppData: Mobile.IDeviceAppData, device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void> {
		return (deviceAppData: Mobile.IDeviceAppData, device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => {
			const platformLiveSyncService = this.resolveDeviceLiveSyncService(data.platform, device);
			return platformLiveSyncService.removeFiles(deviceAppData.appIdentifier, localToDevicePaths);
		};
	}

	public getSyncAction(data: ILiveSyncData, filesToSync: string[], deviceFilesAction: (deviceAppData: Mobile.IDeviceAppData, device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>, liveSyncOptions: ILiveSyncOptions): (device: Mobile.IDevice) => Promise<void> {
		const appIdentifier = data.appIdentifier;
		const platform = data.platform;
		const projectFilesPath = data.projectFilesPath;

		let packageFilePath: string = null;

		return async (device: Mobile.IDevice): Promise<void> => {
			let shouldRefreshApplication = true;
			const deviceAppData = this.$deviceAppDataFactory.create(appIdentifier, this.$mobileHelper.normalizePlatformName(platform), device, liveSyncOptions);
			if (await deviceAppData.isLiveSyncSupported()) {
				const platformLiveSyncService = this.resolveDeviceLiveSyncService(platform, device);

				if (platformLiveSyncService.beforeLiveSyncAction) {
					await platformLiveSyncService.beforeLiveSyncAction(deviceAppData);
				}

				// Not installed application
				await device.applicationManager.checkForApplicationUpdates();

				let wasInstalled = true;
				if (! await device.applicationManager.isApplicationInstalled(appIdentifier) && !this.$options.companion) {
					this.$logger.warn(`The application with id "${appIdentifier}" is not installed on device with identifier ${device.deviceInfo.identifier}.`);
					if (!packageFilePath) {
						packageFilePath = await this.$liveSyncProvider.buildForDevice(device);
					}
					await device.applicationManager.installApplication(packageFilePath);

					if (platformLiveSyncService.afterInstallApplicationAction) {
						const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, filesToSync, data.excludedProjectDirsAndFiles, liveSyncOptions);
						shouldRefreshApplication = await platformLiveSyncService.afterInstallApplicationAction(deviceAppData, localToDevicePaths);
					} else {
						shouldRefreshApplication = false;
					}

					if (!shouldRefreshApplication) {
						await device.applicationManager.startApplication({ appId: appIdentifier, projectName: "" });
					}
					wasInstalled = false;
				}

				// Restart application or reload page
				if (shouldRefreshApplication) {
					// Transfer or remove files on device
					const localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, filesToSync, data.excludedProjectDirsAndFiles, liveSyncOptions);
					if (deviceFilesAction) {
						await deviceFilesAction(deviceAppData, device, localToDevicePaths);
					} else {
						await this.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, !filesToSync);
					}

					this.$logger.info("Applying changes...");
					await platformLiveSyncService.refreshApplication(deviceAppData, localToDevicePaths, data.forceExecuteFullSync || !wasInstalled);
					this.$logger.info(`Successfully synced application ${data.appIdentifier} on device ${device.deviceInfo.identifier}.`);
				}
			} else {
				this.$logger.warn(`LiveSync is not supported for application: ${deviceAppData.appIdentifier} on device with identifier ${device.deviceInfo.identifier}.`);
			}
		};
	}

	private async syncCore(data: ILiveSyncData[], filesToSync: string[], deviceFilesAction?: (deviceAppData: Mobile.IDeviceAppData, device: Mobile.IDevice, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>): Promise<void> {
		for (const dataItem of data) {
			const appIdentifier = dataItem.appIdentifier;
			const platform = dataItem.platform;
			const canExecute = await this.getCanExecuteAction(platform, appIdentifier, dataItem.canExecute);
			const action = this.getSyncAction(dataItem, filesToSync, deviceFilesAction, { isForCompanionApp: this.$options.companion, additionalConfigurations: dataItem.additionalConfigurations, configuration: dataItem.configuration, isForDeletedFiles: false });
			await this.$devicesService.execute(action, canExecute);
		}
	}

	private async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<void> {
		this.$logger.info("Transferring project files...");
		this.logFilesSyncInformation(localToDevicePaths, "Transferring %s.", this.$logger.trace);

		const canTransferDirectory = isFullSync && (this.$devicesService.isAndroidDevice(deviceAppData.device) || this.$devicesService.isiOSSimulator(deviceAppData.device));
		if (canTransferDirectory) {
			const tempDir = temp.mkdirSync("tempDir");
			_.each(localToDevicePaths, localToDevicePath => {
				const fileDirname = path.join(tempDir, path.dirname(localToDevicePath.getRelativeToProjectBasePath()));
				shell.mkdir("-p", fileDirname);
				if (!this.$fs.getFsStats(localToDevicePath.getLocalPath()).isDirectory()) {
					shell.cp("-f", localToDevicePath.getLocalPath(), path.join(fileDirname, path.basename(localToDevicePath.getDevicePath())));
				}
			});
			await deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, tempDir);
		} else {
			await this.$liveSyncProvider.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, isFullSync);
		}

		this.logFilesSyncInformation(localToDevicePaths, "Successfully transferred %s.", this.$logger.info);
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

	private resolveDeviceLiveSyncService(platform: string, device: Mobile.IDevice): IDeviceLiveSyncService {
		return this.$injector.resolve(this.$liveSyncProvider.deviceSpecificLiveSyncServices[platform.toLowerCase()], { _device: device });
	}

	public async getCanExecuteAction(platform: string, appIdentifier: string, canExecute: (dev: Mobile.IDevice) => boolean): Promise<(dev: Mobile.IDevice) => boolean> {
		canExecute = canExecute || ((dev: Mobile.IDevice) => dev.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		let finalCanExecute = canExecute;
		if (this.$options.device) {
			return (device: Mobile.IDevice): boolean => canExecute(device) && device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
		}

		if (this.$mobileHelper.isiOSPlatform(platform)) {
			if (this.$options.emulator) {
				finalCanExecute = (device: Mobile.IDevice): boolean => canExecute(device) && this.$devicesService.isiOSSimulator(device);
			} else {
				const devices = this.$devicesService.getDevicesForPlatform(platform);
				const simulator = _.find(devices, d => this.$devicesService.isiOSSimulator(d));
				if (simulator) {
					const iOSDevices = _.filter(devices, d => d.deviceInfo.identifier !== simulator.deviceInfo.identifier);
					if (iOSDevices && iOSDevices.length) {
						const isApplicationInstalledOnSimulator = await simulator.applicationManager.isApplicationInstalled(appIdentifier);
						const isInstalledPromises = await Promise.all(iOSDevices.map(device => device.applicationManager.isApplicationInstalled(appIdentifier)));
						const isApplicationInstalledOnAllDevices = _.intersection.apply(null, isInstalledPromises);
						// In case the application is not installed on both device and simulator, syncs only on device.
						if (!isApplicationInstalledOnSimulator && !isApplicationInstalledOnAllDevices) {
							finalCanExecute = (device: Mobile.IDevice): boolean => canExecute(device) && this.$devicesService.isiOSDevice(device);
						}
					}
				}
			}
		}

		return finalCanExecute;
	}
}
$injector.register('liveSyncServiceBase', LiveSyncServiceBase);
