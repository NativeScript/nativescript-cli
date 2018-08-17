import { FilePayload, MessagingService, Config, Device, DeviceConnectedMessage, SdkCallbacks, ConnectedDevices } from "nativescript-preview-sdk";
import { EventEmitter } from "events";
import { PreviewSdkEventNames, PubnubKeys } from "./preview-app-constants";

export class PreviewSdkService extends EventEmitter implements IPreviewSdkService {
	private messagingService: MessagingService = null;
	private instanceId: string = null;
	public connectedDevices: Device[] = [];

	constructor(private $errors: IErrors,
		private $logger: ILogger) {
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

	public applyChanges(files: FilePayload[]): Promise<void> {
		return new Promise((resolve, reject) => {
			this.messagingService.applyChanges(this.instanceId, files, err => {
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
				this.$logger.trace("onLogSdkMessage!!!", log);
			},
			onConnectedDevicesChange: (connectedDevices: ConnectedDevices) => ({ }),
			onLogMessage: (log: string, deviceName: string) => {
				this.$logger.info(`LOG from device ${deviceName}: ${log}`);
			},
			onRestartMessage: () => {
				console.log("ON RESTART MESSAGE!!!");
			},
			onUncaughtErrorMessage: () => {
				this.$errors.failWithoutHelp("UncaughtErrorMessage while preview app!!");
			},
			onDeviceConnectedMessage: (deviceConnectedMessage: DeviceConnectedMessage) => ({ }),
			onDeviceConnected: (device: Device) => {
				this.emit(PreviewSdkEventNames.DEVICE_CONNECTED, device);
				this.connectedDevices.push(device);
			},
			onDevicesPresence: (devices: Device[]) => {
			},
			onSendingChange: (sending: boolean) => ({ })
		};
	}
}
$injector.register("previewSdkService", PreviewSdkService);
