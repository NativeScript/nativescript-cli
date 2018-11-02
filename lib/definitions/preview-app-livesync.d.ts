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
		initialize(getInitialFiles: (device: Device) => Promise<FilesPayload>): void;
		applyChanges(filesPayload: FilesPayload): Promise<void>;
		stop(): void;
	}

	interface IPreviewAppPluginsService {
		comparePluginsOnDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<void>;
		getExternalPlugins(device: Device): string[];
	}

	interface IPreviewQrCodeService {
		getPlaygroundAppQrCode(options?: IPlaygroundAppQrCodeOptions): Promise<IDictionary<IQrCodeImageData>>;
		printLiveSyncQrCode(options: IGenerateQrCodeOptions): Promise<void>;
	}

	interface IPlaygroundAppQrCodeOptions {
		platform?: string;
	}

	interface IGenerateQrCodeOptions extends IHasUseHotModuleReloadOption {
		/**
		 * If set to true, a link will be shown on console instead of QR code
		 * Default value is false.
		 */
		link: boolean;
	}

	interface IPreviewDevicesService extends EventEmitter {
		getConnectedDevices(): Device[];
		updateConnectedDevices(devices: Device[]): void;
		getDeviceById(id: string): Device;
		getDevicesForPlatform(platform: string): Device[];
	}
}