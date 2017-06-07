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
		private $injector: IInjector,
		private $projectFilesManager: IProjectFilesManager,
		private $projectFilesProvider: IProjectFilesProvider,
		private $platformService: IPlatformService,
		private $projectChangesService: IProjectChangesService,
		private $liveSyncProvider: ILiveSyncProvider,
		private $fs: IFileSystem) {
		this.liveSyncData = _liveSyncData;
	}

	public async fullSync(projectData: IProjectData, postAction?: (deviceAppData: Mobile.IDeviceAppData) => Promise<void>): Promise<void> {
		let appIdentifier = this.liveSyncData.appIdentifier;
		let platform = this.liveSyncData.platform;
		let projectFilesPath = this.liveSyncData.projectFilesPath;
		let canExecute = this.getCanExecuteAction(platform, appIdentifier);
		let action = async (device: Mobile.IDevice): Promise<void> => {
			await this.$platformService.trackActionForPlatform({ action: "LiveSync", platform, isForDevice: !device.isEmulator, deviceOsVersion: device.deviceInfo.version });

			let deviceAppData = this.$deviceAppDataFactory.create(appIdentifier, this.$mobileHelper.normalizePlatformName(platform), device);
			let localToDevicePaths: Mobile.ILocalToDevicePathData[] = null;
			if (await this.shouldTransferAllFiles(platform, deviceAppData, projectData)) {
				localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, projectFilesPath, null, this.liveSyncData.excludedProjectDirsAndFiles);
				await this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, true);
				await device.fileSystem.putFile(this.$projectChangesService.getPrepareInfoFilePath(platform, projectData), await this.getLiveSyncInfoFilePath(deviceAppData), appIdentifier);
			}

			if (postAction) {
				await this.finishLivesync(deviceAppData);
				await postAction(deviceAppData);
				return;
			}

			await this.refreshApplication(deviceAppData, localToDevicePaths, true, projectData);
			await this.finishLivesync(deviceAppData);
		};
		await this.$devicesService.execute(action, canExecute);
	}

	public async partialSync(event: string, filePath: string, dispatcher: IFutureDispatcher, afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>, projectData: IProjectData): Promise<void> {
		if (this.isFileExcluded(filePath, this.liveSyncData.excludedProjectDirsAndFiles)) {
			this.$logger.trace(`Skipping livesync for changed file ${filePath} as it is excluded in the patterns: ${this.liveSyncData.excludedProjectDirsAndFiles.join(", ")}`);
			return;
		}

		if (event === "add" || event === "addDir" || event === "change") {
			this.batchSync(filePath, dispatcher, afterFileSyncAction, projectData);
		} else if (event === "unlink" || event === "unlinkDir") {
			await this.syncRemovedFile(filePath, afterFileSyncAction, projectData);
		}
	}

	protected getCanExecuteAction(platform: string, appIdentifier: string): (dev: Mobile.IDevice) => boolean {
		let isTheSamePlatformAction = ((device: Mobile.IDevice) => device.deviceInfo.platform.toLowerCase() === platform.toLowerCase());
		if (this.$options.device) {
			return (device: Mobile.IDevice): boolean => isTheSamePlatformAction(device) && device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
		}
		return isTheSamePlatformAction;
	}

	public async refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], isFullSync: boolean, projectData: IProjectData): Promise<void> {
		let deviceLiveSyncService = this.resolveDeviceSpecificLiveSyncService(deviceAppData.device.deviceInfo.platform, deviceAppData.device);
		this.$logger.info("Refreshing application...");
		await deviceLiveSyncService.refreshApplication(deviceAppData, localToDevicePaths, isFullSync, projectData);
	}

	protected async finishLivesync(deviceAppData: Mobile.IDeviceAppData): Promise<void> {
		// This message is important because it signals Visual Studio Code that livesync has finished and debugger can be attached.
		this.$logger.info(`Successfully synced application ${deviceAppData.appIdentifier} on device ${deviceAppData.device.deviceInfo.identifier}.\n`);
	}

	protected async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<void> {
		this.$logger.info("Transferring project files...");
		let canTransferDirectory = isFullSync && (this.$devicesService.isAndroidDevice(deviceAppData.device) || this.$devicesService.isiOSSimulator(deviceAppData.device));
		if (canTransferDirectory) {
			await deviceAppData.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			await this.$liveSyncProvider.transferFiles(deviceAppData, localToDevicePaths, projectFilesPath, isFullSync);
		}
		this.logFilesSyncInformation(localToDevicePaths, "Successfully transferred %s.", this.$logger.info);
	}

	protected resolveDeviceSpecificLiveSyncService(platform: string, device: Mobile.IDevice): INativeScriptDeviceLiveSyncService {
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

		// skip hidden files, to prevent reload of the app for hidden files
		// created temporarily by the IDEs
		if (this.isUnixHiddenPath(filePath)) {
			isFileExcluded = true;
		}

		return isFileExcluded;
	}

	private isUnixHiddenPath(filePath: string): boolean {
		return (/(^|\/)\.[^\/\.]/g).test(filePath);
	}

	private batchSync(filePath: string, dispatcher: IFutureDispatcher, afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>, projectData: IProjectData): void {
		let platformBatch: ISyncBatch = this.batch[this.liveSyncData.platform];
		if (!platformBatch || !platformBatch.syncPending) {
			let done = async () => {
				dispatcher.dispatch(async () => {
					try {
						for (let platform in this.batch) {
							let batch = this.batch[platform];
							await batch.syncFiles(async (filesToSync: string[]) => {
								const appFilesUpdaterOptions: IAppFilesUpdaterOptions = { bundle: this.$options.bundle, release: this.$options.release };
								await this.$platformService.preparePlatform(this.liveSyncData.platform, appFilesUpdaterOptions, this.$options.platformTemplate, projectData, this.$options, filesToSync);
								let canExecute = this.getCanExecuteAction(this.liveSyncData.platform, this.liveSyncData.appIdentifier);
								let deviceFileAction = (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => this.transferFiles(deviceAppData, localToDevicePaths, this.liveSyncData.projectFilesPath, !filePath);
								let action = this.getSyncAction(filesToSync, deviceFileAction, afterFileSyncAction, projectData);
								await this.$devicesService.execute(action, canExecute);
							});
						}
					} catch (err) {
						this.$logger.warn(`Unable to sync files. Error is:`, err.message);
					}
				});
			};

			this.batch[this.liveSyncData.platform] = this.$injector.resolve(syncBatchLib.SyncBatch, { done: done });
			this.livesyncData[this.liveSyncData.platform] = this.liveSyncData;
		}

		this.batch[this.liveSyncData.platform].addFile(filePath);
	}

	private async syncRemovedFile(filePath: string,
		afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>, projectData: IProjectData): Promise<void> {
		let deviceFilesAction = (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => {
			let deviceLiveSyncService = this.resolveDeviceSpecificLiveSyncService(this.liveSyncData.platform, deviceAppData.device);
			return deviceLiveSyncService.removeFiles(this.liveSyncData.appIdentifier, localToDevicePaths, projectData.projectId);
		};
		let canExecute = this.getCanExecuteAction(this.liveSyncData.platform, this.liveSyncData.appIdentifier);
		let action = this.getSyncAction([filePath], deviceFilesAction, afterFileSyncAction, projectData);
		await this.$devicesService.execute(action, canExecute);
	}

	private getSyncAction(
		filesToSync: string[],
		fileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>,
		afterFileSyncAction: (deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Promise<void>,
		projectData: IProjectData): (device: Mobile.IDevice) => Promise<void> {
		let action = async (device: Mobile.IDevice): Promise<void> => {
			let deviceAppData: Mobile.IDeviceAppData = null;
			let localToDevicePaths: Mobile.ILocalToDevicePathData[] = null;
			let isFullSync = false;

			const buildOptions = { bundle: this.$options.bundle, release: this.$options.release, provision: this.$options.provision };

			if (this.$projectChangesService.checkForChanges(device.deviceInfo.platform, projectData, buildOptions).changesRequireBuild) {
				let buildConfig: IBuildConfig = {
					buildForDevice: !device.isEmulator,
					projectDir: this.$options.path,
					release: this.$options.release,
					teamId: this.$options.teamId,
					device: this.$options.device,
					provision: this.$options.provision,
				};
				let platform = device.deviceInfo.platform;
				if (this.$platformService.shouldBuild(platform, projectData, buildOptions, buildConfig)) {
					await this.$platformService.buildPlatform(platform, buildConfig, projectData);
				}

				await this.$platformService.installApplication(device, buildConfig, projectData);
				deviceAppData = this.$deviceAppDataFactory.create(this.liveSyncData.appIdentifier, this.$mobileHelper.normalizePlatformName(this.liveSyncData.platform), device);
				isFullSync = true;
			} else {
				deviceAppData = this.$deviceAppDataFactory.create(this.liveSyncData.appIdentifier, this.$mobileHelper.normalizePlatformName(this.liveSyncData.platform), device);
				const mappedFiles = filesToSync.map((file: string) => this.$projectFilesProvider.mapFilePath(file, device.deviceInfo.platform, projectData));

				// Some plugins modify platforms dir on afterPrepare (check nativescript-dev-sass) - we want to sync only existing file.
				const existingFiles = mappedFiles.filter(m => this.$fs.exists(m));

				this.$logger.trace("Will execute livesync for files: ", existingFiles);

				const skippedFiles = _.difference(mappedFiles, existingFiles);

				if (skippedFiles.length) {
					this.$logger.trace("The following files will not be synced as they do not exist:", skippedFiles);
				}

				localToDevicePaths = await this.$projectFilesManager.createLocalToDevicePaths(deviceAppData, this.liveSyncData.projectFilesPath, mappedFiles, this.liveSyncData.excludedProjectDirsAndFiles);

				await fileSyncAction(deviceAppData, localToDevicePaths);
			}

			if (!afterFileSyncAction) {
				await this.refreshApplication(deviceAppData, localToDevicePaths, isFullSync, projectData);
			}

			await device.fileSystem.putFile(this.$projectChangesService.getPrepareInfoFilePath(device.deviceInfo.platform, projectData), await this.getLiveSyncInfoFilePath(deviceAppData), this.liveSyncData.appIdentifier);

			await this.finishLivesync(deviceAppData);

			if (afterFileSyncAction) {
				await afterFileSyncAction(deviceAppData, localToDevicePaths);
			}
		};

		return action;
	}

	private async shouldTransferAllFiles(platform: string, deviceAppData: Mobile.IDeviceAppData, projectData: IProjectData): Promise<boolean> {
		try {
			if (this.$options.clean) {
				return false;
			}
			let fileText = await this.$platformService.readFile(deviceAppData.device, await this.getLiveSyncInfoFilePath(deviceAppData), projectData);
			let remoteLivesyncInfo: IPrepareInfo = JSON.parse(fileText);
			let localPrepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
			return remoteLivesyncInfo.time !== localPrepareInfo.time;
		} catch (e) {
			return true;
		}
	}

	private async getLiveSyncInfoFilePath(deviceAppData: Mobile.IDeviceAppData): Promise<string> {
		let deviceRootPath = path.dirname(await deviceAppData.getDeviceProjectRootPath());
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
