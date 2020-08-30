import { TrackActionNames, PREPARE_READY_EVENT_NAME } from "../constants";
import { PrepareController } from "./prepare-controller";
import { Device, FilesPayload } from "nativescript-preview-sdk";
import { performanceLog } from "../common/decorators";
import { stringify, deferPromise } from "../common/helpers";
import { HmrConstants } from "../common/constants";
import { EventEmitter } from "events";
import * as _ from "lodash";
import { PrepareDataService } from "../services/prepare-data-service";
import { PreviewAppLiveSyncEvents } from "../services/livesync/playground/preview-app-constants";
import { IProjectDataService } from "../definitions/project";
import { IPluginsService } from "../definitions/plugins";
import {
	IDictionary,
	IAnalyticsService,
	IErrors,
	IHooksService,
	IQrCodeImageData,
	IProjectDir,
} from "../common/declarations";
import { injector } from "../common/yok";

export class PreviewAppController
	extends EventEmitter
	implements IPreviewAppController {
	private prepareReadyEventHandler: any = null;
	private deviceInitializationPromise: IDictionary<boolean> = {};
	private devicesLiveSyncChain: IDictionary<Promise<void>> = {};
	private devicesCanExecuteHmr: IDictionary<boolean> = {};
	// holds HMR files per device in order to execute batch upload on fast updates
	private devicesHmrFiles: IDictionary<string[]> = {};
	// holds app files per device in order to execute batch upload on fast updates on failed HMR or --no-hmr
	private devicesAppFiles: IDictionary<string[]> = {};
	// holds the current HMR hash per device in order to watch the proper hash status on fast updates
	private devicesCurrentHmrHash: IDictionary<string> = {};

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
		private $projectDataService: IProjectDataService
	) {
		super();
	}

	public async startPreview(
		data: IPreviewAppLiveSyncData
	): Promise<IQrCodeImageData> {
		await this.previewCore(data);

		const url = this.$previewSdkService.getQrCodeUrl({
			projectDir: data.projectDir,
			useHotModuleReload: data.useHotModuleReload,
		});
		const result = await this.$previewQrCodeService.getLiveSyncQrCode(url);

		return result;
	}

	public async stopPreview(data: IProjectDir): Promise<void> {
		this.$previewSdkService.stop();
		this.$previewDevicesService.updateConnectedDevices([]);

		await this.$prepareController.stopWatchers(
			data.projectDir,
			this.$devicePlatformsConstants.Android
		);
		await this.$prepareController.stopWatchers(
			data.projectDir,
			this.$devicePlatformsConstants.iOS
		);

		if (this.prepareReadyEventHandler) {
			this.$prepareController.removeListener(
				PREPARE_READY_EVENT_NAME,
				this.prepareReadyEventHandler
			);
			this.prepareReadyEventHandler = null;
		}
	}

	private async previewCore(data: IPreviewAppLiveSyncData): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(
			data.projectDir
		);
		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);
		await this.$previewSdkService.initialize(
			data.projectDir,
			async (device: Device) => {
				try {
					if (!device) {
						this.$errors.fail(
							"Sending initial preview files without a specified device is not supported."
						);
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
							additionalData: device.uniqueId,
						});
					}

					await this.$hooksService.executeBeforeHooks("preview-sync", {
						hookArgs: { ...data, platform: device.platform, projectData },
					});

					if (data.useHotModuleReload) {
						this.$hmrStatusService.attachToHmrStatusEvent();
						this.devicesCanExecuteHmr[device.id] = true;
					}

					await this.$previewAppPluginsService.comparePluginsOnDevice(
						data,
						device
					);

					if (!this.prepareReadyEventHandler) {
						const handler = async (
							currentPrepareData: IFilesChangeEventData
						) => {
							await this.handlePrepareReadyEvent(data, currentPrepareData);
						};

						this.prepareReadyEventHandler = handler.bind(this);
						this.$prepareController.on(
							PREPARE_READY_EVENT_NAME,
							this.prepareReadyEventHandler
						);
					}

					data.env = data.env || {};
					data.env.externals = this.$previewAppPluginsService.getExternalPlugins(
						device
					);

					const prepareData = this.$prepareDataService.getPrepareData(
						data.projectDir,
						device.platform.toLowerCase(),
						{
							...data,
							nativePrepare: { skipNativePrepare: true },
							watch: true,
							watchNative: false,
						}
					);
					await this.$prepareController.prepare(prepareData);

					try {
						const payloads = await this.getInitialFilesForDeviceSafe(
							data,
							device
						);
						return payloads;
					} finally {
						this.deviceInitializationPromise[device.id] = null;
					}
				} catch (error) {
					this.$logger.trace(
						`Error while sending files on device '${
							device && device.id
						}'. Error is`,
						error
					);
					this.emit(PreviewAppLiveSyncEvents.PREVIEW_APP_LIVE_SYNC_ERROR, {
						error,
						data,
						platform: device.platform,
						deviceId: device.id,
					});
				}
			}
		);
		return null;
	}

	@performanceLog()
	private async handlePrepareReadyEvent(
		data: IPreviewAppLiveSyncData,
		currentPrepareData: IFilesChangeEventData
	) {
		const { hmrData, files, platform } = currentPrepareData;
		const platformHmrData = _.cloneDeep(hmrData) || <IPlatformHmrData>{};
		const connectedDevices = this.$previewDevicesService.getDevicesForPlatform(
			platform
		);
		if (!connectedDevices || !connectedDevices.length) {
			this.$logger.warn(
				`Unable to find any connected devices for platform '${platform}'. In order to execute livesync, open your Preview app and optionally re-scan the QR code using the Playground app.`
			);
			return;
		}

		await Promise.all(
			_.map(connectedDevices, async (device) => {
				const previousSync =
					this.devicesLiveSyncChain[device.id] || Promise.resolve();
				const currentSyncDeferPromise = deferPromise<void>();
				this.devicesLiveSyncChain[device.id] = currentSyncDeferPromise.promise;
				this.devicesCurrentHmrHash[device.id] =
					this.devicesCurrentHmrHash[device.id] || platformHmrData.hash;
				if (data.useHotModuleReload) {
					this.devicesHmrFiles[device.id] =
						this.devicesHmrFiles[device.id] || [];
					this.devicesHmrFiles[device.id].push(...files);
					this.devicesAppFiles[device.id] = platformHmrData.fallbackFiles;
				} else {
					this.devicesHmrFiles[device.id] = [];
					this.devicesAppFiles[device.id] = files;
				}

				await previousSync;

				try {
					let canExecuteHmrSync = false;
					const hmrHash = this.devicesCurrentHmrHash[device.id];
					this.devicesCurrentHmrHash[device.id] = null;
					if (data.useHotModuleReload && hmrHash) {
						if (this.devicesCanExecuteHmr[device.id]) {
							canExecuteHmrSync = true;
						}
					}

					const filesToSync = canExecuteHmrSync
						? this.devicesHmrFiles[device.id]
						: this.devicesAppFiles[device.id];
					if (!filesToSync || !filesToSync.length) {
						this.$logger.info(
							`Skipping files sync for device ${this.getDeviceDisplayName(
								device
							)}. The changes are already batch transferred in a previous sync.`
						);
						currentSyncDeferPromise.resolve();
						return;
					}

					this.devicesHmrFiles[device.id] = [];
					this.devicesAppFiles[device.id] = [];
					if (canExecuteHmrSync) {
						this.$hmrStatusService.watchHmrStatus(device.id, hmrHash);
						await this.syncFilesForPlatformSafe(
							data,
							{ filesToSync },
							platform,
							device
						);
						const status = await this.$hmrStatusService.getHmrStatus(
							device.id,
							hmrHash
						);
						if (!status) {
							this.devicesCanExecuteHmr[device.id] = false;
							this.$logger.warn(
								`Unable to get LiveSync status from the Preview app for device ${this.getDeviceDisplayName(
									device
								)}. Ensure the app is running in order to sync changes.`
							);
						} else {
							this.devicesCanExecuteHmr[device.id] =
								status === HmrConstants.HMR_SUCCESS_STATUS;
						}
					} else {
						const noHmrData = _.assign({}, data, { useHotModuleReload: false });
						await this.syncFilesForPlatformSafe(
							noHmrData,
							{ filesToSync },
							platform,
							device
						);
						this.devicesCanExecuteHmr[device.id] = true;
					}
					currentSyncDeferPromise.resolve();
				} catch (e) {
					currentSyncDeferPromise.resolve();
				}
			})
		);
	}

	private getDeviceDisplayName(device: Device) {
		return `${device.name} (${device.id})`.cyan;
	}

	private async getInitialFilesForDeviceSafe(
		data: IPreviewAppLiveSyncData,
		device: Device
	): Promise<FilesPayload> {
		const platform = device.platform;
		this.$logger.info(
			`Start sending initial files for device ${this.getDeviceDisplayName(
				device
			)}.`
		);

		try {
			const payloads = this.$previewAppFilesService.getInitialFilesPayload(
				data,
				platform
			);
			this.$logger.info(
				`Successfully sent initial files for device ${this.getDeviceDisplayName(
					device
				)}.`
			);
			return payloads;
		} catch (err) {
			this.$logger.warn(
				`Unable to apply changes for device ${this.getDeviceDisplayName(
					device
				)}. Error is: ${err}, ${stringify(err)}`
			);
		}
	}

	private async syncFilesForPlatformSafe(
		data: IPreviewAppLiveSyncData,
		filesData: IPreviewAppFilesData,
		platform: string,
		device: Device
	): Promise<void> {
		const deviceId = (device && device.id) || "";

		try {
			const payloads = this.$previewAppFilesService.getFilesPayload(
				data,
				filesData,
				platform
			);
			payloads.deviceId = deviceId;
			if (payloads && payloads.files && payloads.files.length) {
				this.$logger.info(
					`Start syncing changes for device ${this.getDeviceDisplayName(
						device
					)}.`
				);
				await this.$previewSdkService.applyChanges(payloads);
				this.$logger.info(
					`Successfully synced '${payloads.files.map(
						(filePayload) => filePayload.file.yellow
					)}' for device ${this.getDeviceDisplayName(device)}.`
				);
			}
		} catch (error) {
			this.$logger.warn(
				`Unable to apply changes for device ${this.getDeviceDisplayName(
					device
				)}. Error is: ${error}, ${JSON.stringify(error, null, 2)}.`
			);
			this.emit(PreviewAppLiveSyncEvents.PREVIEW_APP_LIVE_SYNC_ERROR, {
				error,
				data,
				deviceId,
			});
		}
	}
}
injector.register("previewAppController", PreviewAppController);
