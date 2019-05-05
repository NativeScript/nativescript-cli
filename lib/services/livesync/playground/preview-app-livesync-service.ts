import * as path from "path";
import { Device, FilesPayload } from "nativescript-preview-sdk";
import { APP_RESOURCES_FOLDER_NAME, APP_FOLDER_NAME, TrackActionNames, FILES_CHANGE_EVENT_NAME } from "../../../constants";
import { PreviewAppLiveSyncEvents } from "./preview-app-constants";
import { HmrConstants } from "../../../common/constants";
import { stringify } from "../../../common/helpers";
import { EventEmitter } from "events";
import { performanceLog } from "../../../common/decorators";
import { WorkflowDataService } from "../../workflow/workflow-data-service";
import { PlatformWatcherService } from "../../platform/platform-watcher-service";

export class PreviewAppLiveSyncService extends EventEmitter implements IPreviewAppLiveSyncService {

	private deviceInitializationPromise: IDictionary<Promise<FilesPayload>> = {};
	private promise = Promise.resolve();

	constructor(
		private $analyticsService: IAnalyticsService,
		private $errors: IErrors,
		private $hmrStatusService: IHmrStatusService,
		private $logger: ILogger,
		private $platformsData: IPlatformsData,
		private $platformWatcherService: PlatformWatcherService,
		private $projectDataService: IProjectDataService,
		private $previewSdkService: IPreviewSdkService,
		private $previewAppFilesService: IPreviewAppFilesService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $previewDevicesService: IPreviewDevicesService,
		private $workflowDataService: WorkflowDataService
	) { super(); }

	@performanceLog()
	public async initialize(data: IPreviewAppLiveSyncData): Promise<void> {
		await this.$previewSdkService.initialize(data.projectDir, async (device: Device) => {
			try {
				if (!device) {
					this.$errors.failWithoutHelp("Sending initial preview files without a specified device is not supported.");
				}

				if (this.deviceInitializationPromise[device.id]) {
					return this.deviceInitializationPromise[device.id];
				}

				if (device.uniqueId) {
					await this.$analyticsService.trackEventActionInGoogleAnalytics({
						action: TrackActionNames.PreviewAppData,
						platform: device.platform,
						additionalData: device.uniqueId
					});
				}

				this.deviceInitializationPromise[device.id] = this.getInitialFilesForPlatformSafe(data, device.platform);

				this.$platformWatcherService.on(FILES_CHANGE_EVENT_NAME, async (filesChangeData: IFilesChangeEventData) => {
					await this.onWebpackCompilationComplete(data, filesChangeData.hmrData, filesChangeData.files, device.platform);
				});

				const { nativePlatformData, projectData, preparePlatformData } = this.$workflowDataService.createWorkflowData(device.platform.toLowerCase(), data.projectDir, data);
				await this.$platformWatcherService.startWatchers(nativePlatformData, projectData, preparePlatformData);

				try {
					const payloads = await this.deviceInitializationPromise[device.id];
					return payloads;
				} finally {
					this.deviceInitializationPromise[device.id] = null;
				}
			} catch (error) {
				this.$logger.trace(`Error while sending files on device ${device && device.id}. Error is`, error);
				this.emit(PreviewAppLiveSyncEvents.PREVIEW_APP_LIVE_SYNC_ERROR, {
					error,
					data,
					platform: device.platform,
					deviceId: device.id
				});
			}
		});
	}

	@performanceLog()
	public async syncFiles(data: IPreviewAppLiveSyncData, filesToSync: string[], filesToRemove: string[]): Promise<void> {
		this.showWarningsForNativeFiles(filesToSync);

		const connectedDevices = this.$previewDevicesService.getConnectedDevices();
		for (const device of connectedDevices) {
			await this.$previewAppPluginsService.comparePluginsOnDevice(data, device);
		}

		const platforms = _(connectedDevices)
			.map(device => device.platform)
			.uniq()
			.value();

		for (const platform of platforms) {
			await this.syncFilesForPlatformSafe(data, { filesToSync, filesToRemove }, platform);
		}
	}

	public async stopLiveSync(): Promise<void> {
		this.$previewSdkService.stop();
		this.$previewDevicesService.updateConnectedDevices([]);
	}

	private async getInitialFilesForPlatformSafe(data: IPreviewAppLiveSyncData, platform: string): Promise<FilesPayload> {
		this.$logger.info(`Start sending initial files for platform ${platform}.`);

		try {
			const payloads = this.$previewAppFilesService.getInitialFilesPayload(data, platform);
			this.$logger.info(`Successfully sent initial files for platform ${platform}.`);
			return payloads;
		} catch (err) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${err}, ${stringify(err)}`);
		}
	}

	private async syncFilesForPlatformSafe(data: IPreviewAppLiveSyncData, filesData: IPreviewAppFilesData, platform: string, deviceId?: string): Promise<void> {
		try {
			const payloads = this.$previewAppFilesService.getFilesPayload(data, filesData, platform);
			if (payloads && payloads.files && payloads.files.length) {
				this.$logger.info(`Start syncing changes for platform ${platform}.`);
				await this.$previewSdkService.applyChanges(payloads);
				this.$logger.info(`Successfully synced ${payloads.files.map(filePayload => filePayload.file.yellow)} for platform ${platform}.`);
			}
		} catch (error) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${error}, ${JSON.stringify(error, null, 2)}.`);
			this.emit(PreviewAppLiveSyncEvents.PREVIEW_APP_LIVE_SYNC_ERROR, {
				error,
				data,
				platform,
				deviceId
			});
		}
	}

	@performanceLog()
	private async onWebpackCompilationComplete(data: IPreviewAppLiveSyncData, hmrData: IPlatformHmrData, files: string[], platform: string) {
		await this.promise
			.then(async () => {
				const platformHmrData = _.cloneDeep(hmrData);
				const projectData = this.$projectDataService.getProjectData(data.projectDir);
				const platformData = this.$platformsData.getPlatformData(platform, projectData);
				const clonedFiles = _.cloneDeep(files);
				const filesToSync = _.map(clonedFiles, fileToSync => {
					const result = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME, path.relative(projectData.getAppDirectoryPath(), fileToSync));
					return result;
				});

				this.promise = this.syncFilesForPlatformSafe(data, { filesToSync }, platform);
				await this.promise;

				if (data.useHotModuleReload && platformHmrData.hash) {
					const devices = this.$previewDevicesService.getDevicesForPlatform(platform);

					await Promise.all(_.map(devices, async (previewDevice: Device) => {
						const status = await this.$hmrStatusService.getHmrStatus(previewDevice.id, platformHmrData.hash);
						if (status === HmrConstants.HMR_ERROR_STATUS) {
							const originalUseHotModuleReload = data.useHotModuleReload;
							data.useHotModuleReload = false;
							await this.syncFilesForPlatformSafe(data, { filesToSync: platformHmrData.fallbackFiles }, platform, previewDevice.id );
							data.useHotModuleReload = originalUseHotModuleReload;
						}
					}));
				}
			});
	}

	private showWarningsForNativeFiles(files: string[]): void {
		_.filter(files, file => file.indexOf(APP_RESOURCES_FOLDER_NAME) > -1)
			.forEach(file => this.$logger.warn(`Unable to apply changes from ${APP_RESOURCES_FOLDER_NAME} folder. You need to build your application in order to make changes in ${APP_RESOURCES_FOLDER_NAME} folder.`));
	}
}
$injector.register("previewAppLiveSyncService", PreviewAppLiveSyncService);
