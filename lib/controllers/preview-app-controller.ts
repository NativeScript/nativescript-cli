import { Device, FilesPayload } from "nativescript-preview-sdk";
import { TrackActionNames, PREPARE_READY_EVENT_NAME } from "../constants";
import { PrepareController } from "./prepare-controller";
import { performanceLog } from "../common/decorators";
import { stringify } from "../common/helpers";
import { HmrConstants } from "../common/constants";
import { EventEmitter } from "events";
import { PreviewAppEmitter } from "../emitters/preview-app-emitter";
import { PrepareDataService } from "../services/prepare-data-service";

export class PreviewAppController extends EventEmitter {
	private deviceInitializationPromise: IDictionary<Promise<FilesPayload>> = {};
	private promise = Promise.resolve();

	constructor(
		private $analyticsService: IAnalyticsService,
		private $errors: IErrors,
		private $hmrStatusService: IHmrStatusService,
		private $logger: ILogger,
		private $prepareController: PrepareController,
		private $previewAppEmitter: PreviewAppEmitter,
		private $previewAppFilesService: IPreviewAppFilesService,
		private $previewAppLiveSyncService: IPreviewAppLiveSyncService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $previewDevicesService: IPreviewDevicesService,
		private $previewSdkService: IPreviewSdkService,
		private $prepareDataService: PrepareDataService
	) { super(); }

	public async preview(data: IPreviewAppLiveSyncData): Promise<void> {
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

				if (data.useHotModuleReload) {
					this.$hmrStatusService.attachToHmrStatusEvent();
				}

				await this.$previewAppPluginsService.comparePluginsOnDevice(data, device);

				this.$prepareController.on(PREPARE_READY_EVENT_NAME, async currentPrepareData => {
					await this.handlePrepareReadyEvent(data, currentPrepareData.hmrData, currentPrepareData.files, device.platform);
				});

				if (!data.env) { data.env = { }; }
				data.env.externals = this.$previewAppPluginsService.getExternalPlugins(device);

				const prepareData = this.$prepareDataService.getPrepareData(data.projectDir, device.platform.toLowerCase(),  { ...data, skipNativePrepare: true } );
				await this.$prepareController.prepare(prepareData);

				this.deviceInitializationPromise[device.id] = this.getInitialFilesForPlatformSafe(data, device.platform);

				try {
					const payloads = await this.deviceInitializationPromise[device.id];
					return payloads;
				} finally {
					this.deviceInitializationPromise[device.id] = null;
				}
			} catch (error) {
				this.$logger.trace(`Error while sending files on device ${device && device.id}. Error is`, error);
				this.$previewAppEmitter.emitPreviewAppLiveSyncError(data, device.id, error, device.platform);
			}
		});
		return null;
	}

	public async stopPreview(): Promise<void> {
		this.$previewSdkService.stop();
		this.$previewDevicesService.updateConnectedDevices([]);
	}

	@performanceLog()
	private async handlePrepareReadyEvent(data: IPreviewAppLiveSyncData, hmrData: IPlatformHmrData, files: string[], platform: string) {
		await this.promise
			.then(async () => {
				const platformHmrData = _.cloneDeep(hmrData);

				this.promise = this.$previewAppLiveSyncService.syncFilesForPlatformSafe(data, { filesToSync: files }, platform);
				await this.promise;

				if (data.useHotModuleReload && platformHmrData.hash) {
					const devices = this.$previewDevicesService.getDevicesForPlatform(platform);

					await Promise.all(_.map(devices, async (previewDevice: Device) => {
						const status = await this.$hmrStatusService.getHmrStatus(previewDevice.id, platformHmrData.hash);
						if (status === HmrConstants.HMR_ERROR_STATUS) {
							const originalUseHotModuleReload = data.useHotModuleReload;
							data.useHotModuleReload = false;
							await this.$previewAppLiveSyncService.syncFilesForPlatformSafe(data, { filesToSync: platformHmrData.fallbackFiles }, platform, previewDevice.id );
							data.useHotModuleReload = originalUseHotModuleReload;
						}
					}));
				}
			});
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
}
$injector.register("previewAppController", PreviewAppController);
