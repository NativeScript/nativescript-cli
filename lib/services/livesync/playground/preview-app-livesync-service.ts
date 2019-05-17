import { APP_RESOURCES_FOLDER_NAME } from "../../../constants";
import { EventEmitter } from "events";
import { performanceLog } from "../../../common/decorators";
import { PreviewAppEmitter } from "../../../emitters/preview-app-emitter";

export class PreviewAppLiveSyncService extends EventEmitter implements IPreviewAppLiveSyncService {

	constructor(
		private $logger: ILogger,
		private $previewAppEmitter: PreviewAppEmitter,
		private $previewAppFilesService: IPreviewAppFilesService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $previewDevicesService: IPreviewDevicesService,
		private $previewSdkService: IPreviewSdkService,
	) { super(); }

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

	public async syncFilesForPlatformSafe(data: IPreviewAppLiveSyncData, filesData: IPreviewAppFilesData, platform: string, deviceId?: string): Promise<void> {
		try {
			const payloads = this.$previewAppFilesService.getFilesPayload(data, filesData, platform);
			if (payloads && payloads.files && payloads.files.length) {
				this.$logger.info(`Start syncing changes for platform ${platform}.`);
				await this.$previewSdkService.applyChanges(payloads);
				this.$logger.info(`Successfully synced ${payloads.files.map(filePayload => filePayload.file.yellow)} for platform ${platform}.`);
			}
		} catch (error) {
			this.$logger.warn(`Unable to apply changes for platform ${platform}. Error is: ${error}, ${JSON.stringify(error, null, 2)}.`);
			this.$previewAppEmitter.emitPreviewAppLiveSyncError(data, deviceId, error);
		}
	}

	private showWarningsForNativeFiles(files: string[]): void {
		_.filter(files, file => file.indexOf(APP_RESOURCES_FOLDER_NAME) > -1)
			.forEach(file => this.$logger.warn(`Unable to apply changes from ${APP_RESOURCES_FOLDER_NAME} folder. You need to build your application in order to make changes in ${APP_RESOURCES_FOLDER_NAME} folder.`));
	}
}
$injector.register("previewAppLiveSyncService", PreviewAppLiveSyncService);
