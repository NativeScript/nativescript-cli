import * as path from "path";
import { Device, FilesPayload } from "nativescript-preview-sdk";
import { APP_RESOURCES_FOLDER_NAME, APP_FOLDER_NAME, TrackActionNames } from "../../../constants";
import { PreviewAppLiveSyncEvents } from "./preview-app-constants";
import { HmrConstants } from "../../../common/constants";
import { stringify } from "../../../common/helpers";
import { EventEmitter } from "events";
import { performanceLog } from "../../../common/decorators";

export class PreviewAppLiveSyncService extends EventEmitter implements IPreviewAppLiveSyncService {

	private deviceInitializationPromise: IDictionary<Promise<FilesPayload>> = {};

	constructor(
		private $analyticsService: IAnalyticsService,
		private $errors: IErrors,
		private $hooksService: IHooksService,
		private $logger: ILogger,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $previewSdkService: IPreviewSdkService,
		private $previewAppFilesService: IPreviewAppFilesService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $previewDevicesService: IPreviewDevicesService,
		private $hmrStatusService: IHmrStatusService) {
			super();
		}

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

				this.deviceInitializationPromise[device.id] = this.getInitialFilesForDevice(data, device);
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

	private async getInitialFilesForDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<FilesPayload> {
		const hookArgs = this.getHookArgs(data, device);
		await this.$hooksService.executeBeforeHooks("preview-sync", { hookArgs });
		await this.$previewAppPluginsService.comparePluginsOnDevice(data, device);
		const payloads = await this.getInitialFilesForPlatformSafe(data, device.platform);
		return payloads;
	}

	private getHookArgs(data: IPreviewAppLiveSyncData, device: Device) {
		const filesToSyncMap: IDictionary<string[]> = {};
		const hmrData: IDictionary<IPlatformHmrData> = {};
		const promise = Promise.resolve();
		const result = {
			projectData: this.$projectDataService.getProjectData(data.projectDir),
			hmrData,
			config: {
				env: data.env,
				platform: device.platform,
				appFilesUpdaterOptions: {
					bundle: data.bundle,
					useHotModuleReload: data.useHotModuleReload,
					release: false
				},
			},
			externals: this.$previewAppPluginsService.getExternalPlugins(device),
			filesToSyncMap,
			startSyncFilesTimeout: async (platform: string) => await this.onWebpackCompilationComplete(data, hmrData, filesToSyncMap, promise, platform)
		};

		return result;
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
	private async onWebpackCompilationComplete(data: IPreviewAppLiveSyncData, hmrData: IDictionary<IPlatformHmrData>, filesToSyncMap: IDictionary<string[]>, promise: Promise<void>, platform: string) {
		await promise
			.then(async () => {
				const currentHmrData = _.cloneDeep(hmrData);
				const platformHmrData = currentHmrData[platform] || <any>{};
				const projectData = this.$projectDataService.getProjectData(data.projectDir);
				const platformData = this.$platformsData.getPlatformData(platform, projectData);
				const clonedFiles = _.cloneDeep(filesToSyncMap[platform]);
				const filesToSync = _.map(clonedFiles, fileToSync => {
					const result = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME, path.relative(projectData.getAppDirectoryPath(), fileToSync));
					return result;
				});

				promise = this.syncFilesForPlatformSafe(data, { filesToSync }, platform);
				await promise;

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
		filesToSyncMap[platform] = [];
	}

	private showWarningsForNativeFiles(files: string[]): void {
		_.filter(files, file => file.indexOf(APP_RESOURCES_FOLDER_NAME) > -1)
			.forEach(file => this.$logger.warn(`Unable to apply changes from ${APP_RESOURCES_FOLDER_NAME} folder. You need to build your application in order to make changes in ${APP_RESOURCES_FOLDER_NAME} folder.`));
	}
}
$injector.register("previewAppLiveSyncService", PreviewAppLiveSyncService);
