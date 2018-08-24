import { FilePayload, Device } from "nativescript-preview-sdk";

declare global {
	interface IPreviewAppLiveSyncService {
		initialSync(data: IPreviewAppLiveSyncData): Promise<void>;
		syncFiles(data: IPreviewAppLiveSyncData, filesToSync: string[]): Promise<void>;
		stopLiveSync(): Promise<void>;
	}

	interface IPreviewAppLiveSyncData extends IProjectDir, IAppFilesUpdaterOptionsComposition, IEnvOptions { }

	interface IPreviewSdkService extends NodeJS.EventEmitter {
		connectedDevices: Device[];
		initialize(): void;
		applyChanges(files: FilePayload[]): Promise<void>;
		shortenQrCodeUrl(): Promise<string>;
		stop(): void;
	}

	interface IPreviewAppPluginsService {
		comparePluginsOnDevice(device: Device): Promise<void>;
	}
}