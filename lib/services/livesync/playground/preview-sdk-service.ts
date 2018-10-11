import { MessagingService, Config, Device, DeviceConnectedMessage, SdkCallbacks, ConnectedDevices, FilesPayload } from "nativescript-preview-sdk";
import { PubnubKeys } from "./preview-app-constants";
import { DEVICE_LOG_EVENT_NAME } from "../../../common/constants";
import { EventEmitter } from "events";
const pako = require("pako");

export class PreviewSdkService extends EventEmitter implements IPreviewSdkService {
	private static MAX_FILES_UPLOAD_BYTE_LENGTH = 15 * 1024 * 1024; // In MBs
	private messagingService: MessagingService = null;
	private instanceId: string = null;
	public connectedDevices: Device[] = [];

	constructor(private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		private $config: IConfiguration) {
			super();
	}

	public getQrCodeUrl(options: IHasUseHotModuleReloadOption): string {
		const hmrValue = options.useHotModuleReload ? "1" : "0";
		return `nsplay://boot?instanceId=${this.instanceId}&pKey=${PubnubKeys.PUBLISH_KEY}&sKey=${PubnubKeys.SUBSCRIBE_KEY}&template=play-ng&hmr=${hmrValue}`;
	}

	public async initialize(getInitialFiles: (device: Device) => Promise<FilesPayload>): Promise<void> {
		const initConfig = this.getInitConfig(getInitialFiles);
		this.messagingService = new MessagingService();
		this.instanceId = await this.messagingService.initialize(initConfig);
	}

	public applyChanges(filesPayload: FilesPayload): Promise<void> {
		return new Promise((resolve, reject) => {
			this.messagingService.applyChanges(this.instanceId, filesPayload, err => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	public stop(): void {
		this.messagingService.stop();
	}

	private getInitConfig(getInitialFiles: (device: Device) => Promise<FilesPayload>): Config {
		return {
			pubnubPublishKey: PubnubKeys.PUBLISH_KEY,
			pubnubSubscribeKey: PubnubKeys.SUBSCRIBE_KEY,
			msvKey: "cli",
			msvEnv: this.$config.PREVIEW_APP_ENVIRONMENT,
			showLoadingPage: false,
			callbacks: this.getCallbacks(),
			getInitialFiles
		};
	}

	private getCallbacks(): SdkCallbacks {
		return {
			onLogSdkMessage: (log: string) => {
				this.$logger.trace("Received onLogSdkMessage message: ", log);
			},
			onConnectedDevicesChange: (connectedDevices: ConnectedDevices) => ({ }),
			onLogMessage: (log: string, deviceName: string, deviceId: string) => {
				const device = _.find(this.connectedDevices, { id: deviceId});
				this.emit(DEVICE_LOG_EVENT_NAME, log, deviceId, device ? device.platform : "");
				this.$logger.info(`LOG from device ${deviceName}: ${log}`);
			},
			onRestartMessage: () => {
				this.$logger.trace("Received onRestartMessage event.");
			},
			onUncaughtErrorMessage: () => {
				this.$logger.warn("The Preview app has terminated unexpectedly. Please run it again to get a detailed crash report.");
			},
			onDeviceConnectedMessage: (deviceConnectedMessage: DeviceConnectedMessage) => ({ }),
			onDeviceConnected: (device: Device) => {
				if (!_.find(this.connectedDevices, {id: device.id})) {
					this.connectedDevices.push(device);
				}
			},
			onDevicesPresence: (devices: Device[]) => ({ }),
			onSendingChange: (sending: boolean) => ({ }),
			onBiggerFilesUpload: async (filesContent, callback) => {
				const gzippedContent = Buffer.from(pako.gzip(filesContent));
				const byteLength = filesContent.length;

				if (byteLength > PreviewSdkService.MAX_FILES_UPLOAD_BYTE_LENGTH) {
					this.$logger.warn("The files to upload exceed the maximum allowed size of 15MB. Your app might not work as expected.");
				}

				const playgroundUploadResponse = await this.$httpClient.httpRequest({
					url: this.$config.UPLOAD_PLAYGROUND_FILES_ENDPOINT,
					method: "POST",
					body: gzippedContent,
					headers: {
						"Content-Encoding": "gzip",
						"Content-Type": "text/plain"
					}
				});

				const responseBody = JSON.parse(playgroundUploadResponse.body);
				const location = responseBody && responseBody.location;
				callback(location, playgroundUploadResponse.error);
			}
		};
	}
}
$injector.register("previewSdkService", PreviewSdkService);
