import * as path from "path";
import { Device, FilesPayload } from "nativescript-preview-sdk";
import { APP_RESOURCES_FOLDER_NAME, APP_FOLDER_NAME } from "../../../constants";
import { HmrConstants } from "../../../common/constants";

export class PreviewAppLiveSyncService implements IPreviewAppLiveSyncService {

	private deviceInitializationPromise: IDictionary<Promise<FilesPayload>> = {};

	constructor(
		private $errors: IErrors,
		private $hooksService: IHooksService,
		private $logger: ILogger,
		private $platformsData: IPlatformsData,
		private $projectDataService: IProjectDataService,
		private $previewSdkService: IPreviewSdkService,
		private $previewAppFilesService: IPreviewAppFilesService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $previewDevicesService: IPreviewDevicesService,
		private $hmrStatusService: IHmrStatusService,
	) { }

	public async initialize(data: IPreviewAppLiveSyncData): Promise<void> {
		await this.$previewSdkService.initialize(async (device: Device) => {
			if (!device) {
				this.$errors.failWithoutHelp("Sending initial preview files without a specified device is not supported.");
			}

			if (this.deviceInitializationPromise[device.id]) {
				return this.deviceInitializationPromise[device.id];
			}

			this.deviceInitializationPromise[device.id] = this.initializePreviewForDevice(data, device);
			try {
				const payloads = await this.deviceInitializationPromise[device.id];
				return payloads;
			} finally {
				this.deviceInitializationPromise[device.id] = null;
			}
		});
	}

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
	}

	private async initializePreviewForDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<FilesPayload> {
		const hookArgs = this.getHookArgs(data, device);
		await this.$hooksService.executeBeforeHooks("preview-sync", { hookArgs });
		await this.$previewAppPluginsService.comparePluginsOnDevice(data, device);
		const payloads = await this.syncInitialFilesForPlatformSafe(data, device.platform);
		return payloads;
	}

	private getHookArgs(data: IPreviewAppLiveSyncData, device: Device) {
		const filesToSyncMap: IDictionary<string[]> = {};
		const hmrData: IDictionary<IPlatformHmrData> = {};
		const promise = Promise.resolve<FilesPayload>(null);
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

	private async syncInitialFilesForPlatformSafe(data: IPreviewAppLiveSyncData, platform: string): Promise<FilesPayload> {
		this.$logger.info(`Start syncing changes for platform ${platform}.`);

		try {
			const payloads = this.$previewAppFilesService.getInitialFilesPayload(data, platform);
			this.$logger.info(`Successfully synced changes for platform ${platform}.`);
			return payloads;
		} catch (err) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${err}, ${JSON.stringify(err, null, 2)}.`);
		}
	}

	private async syncFilesForPlatformSafe(data: IPreviewAppLiveSyncData, filesData: IPreviewAppFilesData, platform: string, deviceId?: string): Promise<FilesPayload> {
		this.$logger.info(`Start syncing changes for platform ${platform}.`);

		try {
			const payloads = this.$previewAppFilesService.getFilesPayload(data, filesData, platform);
			await this.$previewSdkService.applyChanges(payloads);
			this.$logger.info(`Successfully synced ${payloads.files.map(filePayload => filePayload.file.yellow)} for platform ${platform}.`);
			return payloads;
		} catch (err) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${err}, ${JSON.stringify(err, null, 2)}.`);
		}
	}

	private async onWebpackCompilationComplete(data: IPreviewAppLiveSyncData, hmrData: IDictionary<IPlatformHmrData>, filesToSyncMap: IDictionary<string[]>, promise: Promise<FilesPayload>, platform: string) {
		await promise
			.then(async () => {
				const currentHmrData = _.cloneDeep(hmrData);
				const platformHmrData = currentHmrData[platform] || <any>{};
				const projectData = this.$projectDataService.getProjectData(data.projectDir);
				const platformData = this.$platformsData.getPlatformData(platform, projectData);
				const clonedFiles = _.cloneDeep(filesToSyncMap[platform]);
				const filesToSync = _.map(clonedFiles, fileToSync => {
						const result = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME, path.relative(projectData.getAppDirectoryPath(), fileToSync));
						console.log(result);
						return result;
					});

				// console.log("####### FILES TO SYNC!!!!!!! %%%%%%%% ", filesToSync, data.projectDir, platformData);
				// console.log("####### appDestinationDirectoryPath!!!! ", platformData.appDestinationDirectoryPath);
				// console.log("hjfjdjgdfjgjfgjgj !!!!! ", projectData.getAppDirectoryPath());

				// filesToSync = filesToSync.map(fileToSync => {
				// 	console.log("appDestinationDirectoryPath !!!! ", platformData.appDestinationDirectoryPath);
				// 	console.log("relative path!!!!!", path.relative(projectData.getAppDirectoryPath(), fileToSync));
				// 	return result;
				// });
				promise = this.syncFilesForPlatformSafe(data, { filesToSync }, platform);
				await promise;

				if (data.useHotModuleReload && platformHmrData.hash) {
					const devices = this.$previewDevicesService.getDevicesForPlatform(platform);

					await Promise.all(_.map(devices, async (previewDevice: Device) => {
						const status = await this.$hmrStatusService.getHmrStatus(previewDevice.id, platformHmrData.hash);
						if (status === HmrConstants.HMR_ERROR_STATUS) {
							// TODO: SET useHotModuleReload: false,
							await this.syncFilesForPlatformSafe(data, { filesToSync: platformHmrData.fallbackFiles }, platform, previewDevice.id );
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
