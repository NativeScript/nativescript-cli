import { FilePayload, Device, FilesPayload } from "nativescript-preview-sdk";
import { EventEmitter } from "events";

declare global {
	interface IPreviewAppLiveSyncService {
		initialize(data: IPreviewAppLiveSyncData): void;
		syncFiles(data: IPreviewAppLiveSyncData, filesToSync: string[], filesToRemove: string[]): Promise<void>;
		stopLiveSync(): Promise<void>;
	}

	interface IPreviewAppLiveSyncData extends IProjectDir, IAppFilesUpdaterOptionsComposition, IEnvOptions { }

	interface IPreviewSdkService extends EventEmitter {
		getQrCodeUrl(options: IHasUseHotModuleReloadOption): string;
		connectedDevices: Device[];
		initialize(getInitialFiles: (device: Device) => Promise<FilesPayload>): void;
		applyChanges(filesPayload: FilesPayload): Promise<void>;
		stop(): void;
	}

	interface IPreviewAppPluginsService {
		comparePluginsOnDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<void>;
		getExternalPlugins(device: Device): string[];
	}

	interface IPlaygroundQrCodeGenerator {
		generateQrCode(options: IGenerateQrCodeOptions): Promise<void>;
	}

	interface IGenerateQrCodeOptions extends IHasUseHotModuleReloadOption {
		/**
		 * If set to true, a link will be shown on console instead of QR code
		 * Default value is false.
		 */
		link: boolean;
	}
}