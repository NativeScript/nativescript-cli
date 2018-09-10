import { FilePayload, MessagingService, Config, Device, DeviceConnectedMessage, SdkCallbacks, ConnectedDevices } from "nativescript-preview-sdk";
import { EventEmitter } from "events";
import { PreviewSdkEventNames, PubnubKeys } from "./preview-app-constants";
const pako = require("pako");

export class PreviewSdkService extends EventEmitter implements IPreviewSdkService {
	private messagingService: MessagingService = null;
	private instanceId: string = null;
	public connectedDevices: Device[] = [];

	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		private $config: IConfiguration) {
		super();
	}

	public get qrCodeUrl(): string {
		return `nsplay://boot?instanceId=${this.instanceId}&pKey=${PubnubKeys.PUBLISH_KEY}&sKey=${PubnubKeys.SUBSCRIBE_KEY}&template=play-ng`;
	}

	public initialize(): void {
		const initConfig = this.getInitConfig();
		this.messagingService = new MessagingService();
		this.instanceId = this.messagingService.initialize(initConfig);
	}

	public applyChanges(files: FilePayload[], deviceId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.messagingService.applyChanges(this.instanceId, files, deviceId, err => {
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

	private getInitConfig(): Config {
		return {
			pubnubPublishKey: PubnubKeys.PUBLISH_KEY,
			pubnubSubscribeKey: PubnubKeys.SUBSCRIBE_KEY,
			callbacks: this.getCallbacks(),
			getInitialFiles: async () => []
		};
	}

	private getCallbacks(): SdkCallbacks {
		return {
			onLogSdkMessage: (log: string) => {
				this.$logger.trace("Received onLogSdkMessage message: ", log);
			},
			onConnectedDevicesChange: (connectedDevices: ConnectedDevices) => ({ }),
			onLogMessage: (log: string, deviceName: string) => {
				this.$logger.info(`LOG from device ${deviceName}: ${log}`);
			},
			onRestartMessage: () => {
				this.$logger.trace("Received onRestartMessage event.");
			},
			onUncaughtErrorMessage: () => {
				this.$errors.failWithoutHelp("Error while communicating with preview app.");
			},
			onDeviceConnectedMessage: (deviceConnectedMessage: DeviceConnectedMessage) => ({ }),
			onDeviceConnected: (device: Device) => {
				this.emit(PreviewSdkEventNames.DEVICE_CONNECTED, device);
				if (!_.includes(this.connectedDevices, device)) {
					this.connectedDevices.push(device);
				}
			},
			onDevicesPresence: (devices: Device[]) => ({ }),
			onSendingChange: (sending: boolean) => ({ }),
			onBiggerFilesUpload: async (filesContent, callback) => {
				const gzippedContent = new Buffer(pako.gzip(filesContent));
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
