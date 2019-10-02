import { Device, FilesPayload } from "nativescript-preview-sdk";
import { TrackActionNames, PREPARE_READY_EVENT_NAME } from "../constants";
import { PrepareController } from "./prepare-controller";
import { performanceLog } from "../common/decorators";
import { stringify } from "../common/helpers";
import { HmrConstants } from "../common/constants";
import { EventEmitter } from "events";
import { PrepareDataService } from "../services/prepare-data-service";
import { PreviewAppLiveSyncEvents } from "../services/livesync/playground/preview-app-constants";

export class PreviewAppController extends EventEmitter implements IPreviewAppController {
	private prepareReadyEventHandler: any = null;
	private deviceInitializationPromise: IDictionary<boolean> = {};
	private promise = Promise.resolve();

	constructor(
		private $analyticsService: IAnalyticsService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $errors: IErrors,
		private $hmrStatusService: IHmrStatusService,
		private $logger: ILogger,
		public $hooksService: IHooksService,
		private $pluginsService: IPluginsService,
		private $prepareController: PrepareController,
		private $previewAppFilesService: IPreviewAppFilesService,
		private $previewAppPluginsService: IPreviewAppPluginsService,
		private $previewDevicesService: IPreviewDevicesService,
		private $previewQrCodeService: IPreviewQrCodeService,
		private $previewSdkService: IPreviewSdkService,
		private $prepareDataService: PrepareDataService,
		private $projectDataService: IProjectDataService,
		private $markingModeService: IMarkingModeService
	) { super(); }

	public async startPreview(data: IPreviewAppLiveSyncData): Promise<IQrCodeImageData> {
		await this.previewCore(data);

		const url = this.$previewSdkService.getQrCodeUrl({ projectDir: data.projectDir, useHotModuleReload: data.useHotModuleReload });
		const result = await this.$previewQrCodeService.getLiveSyncQrCode(url);

		return result;
	}

	public async stopPreview(data: IProjectDir): Promise<void> {
		this.$previewSdkService.stop();
		this.$previewDevicesService.updateConnectedDevices([]);

		await this.$prepareController.stopWatchers(data.projectDir, this.$devicePlatformsConstants.Android);
		await this.$prepareController.stopWatchers(data.projectDir, this.$devicePlatformsConstants.iOS);

		if (this.prepareReadyEventHandler) {
			this.$prepareController.removeListener(PREPARE_READY_EVENT_NAME, this.prepareReadyEventHandler);
			this.prepareReadyEventHandler = null;
		}
	}

	private async previewCore(data: IPreviewAppLiveSyncData): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(data.projectDir);
		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		await this.$previewSdkService.initialize(data.projectDir, async (device: Device) => {
			await this.$markingModeService.handleMarkingModeFullDeprecation({ projectDir: projectData.projectDir });
			try {
				if (!device) {
					this.$errors.fail("Sending initial preview files without a specified device is not supported.");
				}

				if (this.deviceInitializationPromise[device.id]) {
					// In some cases devices are reported several times during initialization.
					// In case we are already preparing the sending of initial files, disregard consecutive requests for initial files
					// until we send the files we are currently preparing.
					return null;
				}

				this.deviceInitializationPromise[device.id] = true;

				if (device.uniqueId) {
					await this.$analyticsService.trackEventActionInGoogleAnalytics({
						action: TrackActionNames.PreviewAppData,
						platform: device.platform,
						additionalData: device.uniqueId
					});
				}

				await this.$hooksService.executeBeforeHooks("preview-sync", { hookArgs: { ...data, platform: device.platform, projectData } });

				if (data.useHotModuleReload) {
					this.$hmrStatusService.attachToHmrStatusEvent();
				}

				await this.$previewAppPluginsService.comparePluginsOnDevice(data, device);

				if (!this.prepareReadyEventHandler) {
					const handler = async (currentPrepareData: IFilesChangeEventData) => {
						await this.handlePrepareReadyEvent(data, currentPrepareData);
					};

					this.prepareReadyEventHandler = handler.bind(this);
					this.$prepareController.on(PREPARE_READY_EVENT_NAME, this.prepareReadyEventHandler);
				}

				data.env = data.env || {};
				data.env.externals = this.$previewAppPluginsService.getExternalPlugins(device);

				const prepareData = this.$prepareDataService.getPrepareData(data.projectDir, device.platform.toLowerCase(), { ...data, nativePrepare: { skipNativePrepare: true }, watch: true, watchNative: false });
				await this.$prepareController.prepare(prepareData);

				try {
					const payloads = await this.getInitialFilesForPlatformSafe(data, device.platform);
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
		return null;
	}

	@performanceLog()
	private async handlePrepareReadyEvent(data: IPreviewAppLiveSyncData, currentPrepareData: IFilesChangeEventData) {
		await this.promise
			.then(async () => {
				const { hmrData, files, platform } = currentPrepareData;
				const platformHmrData = _.cloneDeep(hmrData);

				this.promise = this.syncFilesForPlatformSafe(data, { filesToSync: files }, platform);
				await this.promise;

				if (data.useHotModuleReload && platformHmrData.hash) {
					const devices = this.$previewDevicesService.getDevicesForPlatform(platform);

					await Promise.all(_.map(devices, async (previewDevice: Device) => {
						const status = await this.$hmrStatusService.getHmrStatus(previewDevice.id, platformHmrData.hash);
						if (status === HmrConstants.HMR_ERROR_STATUS) {
							const originalUseHotModuleReload = data.useHotModuleReload;
							data.useHotModuleReload = false;
							await this.syncFilesForPlatformSafe(data, { filesToSync: platformHmrData.fallbackFiles }, platform, previewDevice.id);
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
				deviceId
			});
		}
	}
}
$injector.register("previewAppController", PreviewAppController);
