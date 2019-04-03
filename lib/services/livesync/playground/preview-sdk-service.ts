import { MessagingService, Config, Device, DeviceConnectedMessage, SdkCallbacks, ConnectedDevices, FilesPayload } from "nativescript-preview-sdk";
import { EventEmitter } from "events";
const pako = require("pako");

export class PreviewSdkService extends EventEmitter implements IPreviewSdkService {
	private static MAX_FILES_UPLOAD_BYTE_LENGTH = 15 * 1024 * 1024; // In MBs
	private messagingService: MessagingService = null;
	private instanceId: string = null;

	constructor(private $config: IConfiguration,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $previewDevicesService: IPreviewDevicesService,
		private $previewAppLogProvider: IPreviewAppLogProvider,
		private $previewSchemaService: IPreviewSchemaService) {
			super();
	}

	public getQrCodeUrl(options: IGetQrCodeUrlOptions): string {
		const { projectDir, useHotModuleReload } = options;
		const schema = this.$previewSchemaService.getSchemaData(projectDir);
		const hmrValue = useHotModuleReload ? "1" : "0";
		const result = `${schema.name}://boot?instanceId=${this.instanceId}&pKey=${schema.publishKey}&sKey=${schema.subscribeKey}&template=play-ng&hmr=${hmrValue}`;
		return result;
	}

	public async initialize(projectDir: string, getInitialFiles: (device: Device) => Promise<FilesPayload>): Promise<void> {
		const initConfig = this.getInitConfig(projectDir, getInitialFiles);
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

	private getInitConfig(projectDir: string, getInitialFiles: (device: Device) => Promise<FilesPayload>): Config {
		const schema = this.$previewSchemaService.getSchemaData(projectDir);

		return {
			pubnubPublishKey: schema.publishKey,
			pubnubSubscribeKey: schema.subscribeKey,
			msvKey: schema.msvKey,
			msvEnv: this.$config.PREVIEW_APP_ENVIRONMENT,
			callbacks: this.getCallbacks(),
			getInitialFiles,
			previewAppStoreId: schema.previewAppStoreId,
			previewAppGooglePlayId: schema.previewAppId
		};
	}

	private getCallbacks(): SdkCallbacks {
		return {
			onLogSdkMessage: (log: string) => {
				this.$logger.trace("Received onLogSdkMessage message: ", log);
			},
			onLogMessage: (log: string, deviceName: string, deviceId: string) => {
				this.$previewAppLogProvider.logData(log, deviceName, deviceId);
			},
			onRestartMessage: () => {
				this.$logger.trace("Received onRestartMessage event.");
			},
			onUncaughtErrorMessage: () => {
				this.$logger.warn("The Preview app has terminated unexpectedly. Please run it again to get a detailed crash report.");
			},
			onConnectedDevicesChange: (connectedDevices: ConnectedDevices) => ({}),
			onDeviceConnectedMessage: (deviceConnectedMessage: DeviceConnectedMessage) => ({}),
			onDeviceConnected: (device: Device) => ({}),
			onDevicesPresence: (devices: Device[]) => this.$previewDevicesService.updateConnectedDevices(devices),
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
