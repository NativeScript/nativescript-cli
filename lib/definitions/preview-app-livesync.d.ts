import { FilePayload, DeviceConnectedMessage } from "nativescript-preview-sdk";

declare global {
	interface IPreviewAppLiveSyncService {
		initialSync(data: IPreviewAppLiveSyncData): Promise<void>;
		syncFiles(data: IPreviewAppLiveSyncData, filesToSync: string[]): Promise<void>;
		stopLiveSync(): Promise<void>;
	}

	interface IPreviewAppLiveSyncData extends IProjectDataComposition, IAppFilesUpdaterOptionsComposition, IEnvOptions { }

	interface IPreviewSdkService extends NodeJS.EventEmitter {
		qrCodeUrl: string;
		connectedDevices: DeviceConnectedMessage[];
		initialize(): void;
		applyChanges(files: FilePayload[]): Promise<void>;
		stop(): void;
	}
}