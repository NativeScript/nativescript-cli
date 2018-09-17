import { FilePayload, Device } from "nativescript-preview-sdk";

declare global {
	interface IPreviewAppLiveSyncService {
		initialize(): void;
		initialSync(data: IPreviewAppLiveSyncData): Promise<void>;
		syncFiles(data: IPreviewAppLiveSyncData, filesToSync: string[]): Promise<void>;
		stopLiveSync(): Promise<void>;
	}

	interface IPreviewAppLiveSyncData extends IProjectDir, IAppFilesUpdaterOptionsComposition, IEnvOptions { }

	interface IPreviewSdkService extends NodeJS.EventEmitter {
		qrCodeUrl: string;
		connectedDevices: Device[];
		initialize(): void;
		applyChanges(files: FilePayload[], platform: string): Promise<void>;
		stop(): void;
	}

	interface IPreviewAppPluginsService {
		comparePluginsOnDevice(device: Device): Promise<void>;
		getExternalPlugins(device: Device): string[];
	}

	interface IPreviewCommandHelper {
		run(): void;
	}

	interface IPlaygroundQrCodeGenerator {
		generateQrCodeForiOS(): Promise<void>;
		generateQrCodeForAndroid(): Promise<void>;
		generateQrCodeForCurrentApp(): Promise<void>;
	}
}