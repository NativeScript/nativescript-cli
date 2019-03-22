import { FilePayload, Device, FilesPayload } from "nativescript-preview-sdk";
import { EventEmitter } from "events";

declare global {
	interface IPreviewAppLiveSyncService extends EventEmitter {
		initialize(data: IPreviewAppLiveSyncData): void;
		syncFiles(data: IPreviewAppLiveSyncData, filesToSync: string[], filesToRemove: string[]): Promise<void>;
		stopLiveSync(): Promise<void>;
	}

	interface IPreviewAppFilesService {
		getInitialFilesPayload(liveSyncData: IPreviewAppLiveSyncData, platform: string, deviceId?: string): FilesPayload;
		getFilesPayload(liveSyncData: IPreviewAppLiveSyncData, filesData: IPreviewAppFilesData, platform: string, deviceId?: string): FilesPayload;
	}

	interface IPreviewAppFilesData {
		filesToSync: string[];
		filesToRemove?: string[];
	}

	interface IPreviewAppLiveSyncData extends IProjectDir, IHasUseHotModuleReloadOption, IBundle, IEnvOptions { }

	interface IPreviewSdkService extends EventEmitter {
		getQrCodeUrl(options: IGetQrCodeUrlOptions): string;
		initialize(getInitialFiles: (device: Device) => Promise<FilesPayload>): void;
		applyChanges(filesPayload: FilesPayload): Promise<void>;
		stop(): void;
	}

	interface IGetQrCodeUrlOptions extends IHasUseHotModuleReloadOption, IProjectDir { }

	interface IPreviewAppPluginsService {
		getPluginsUsageWarnings(data: IPreviewAppLiveSyncData, device: Device): string[];
		comparePluginsOnDevice(data: IPreviewAppLiveSyncData, device: Device): Promise<void>;
		getExternalPlugins(device: Device): string[];
	}

	interface IPreviewAppLogProvider extends EventEmitter {
		logData(log: string, deviceName: string, deviceId: string): void;
	}

	interface IPreviewQrCodeService {
		getPlaygroundAppQrCode(options?: IPlaygroundAppQrCodeOptions): Promise<IDictionary<IQrCodeImageData>>;
		getLiveSyncQrCode(url: string): Promise<IQrCodeImageData>;
		printLiveSyncQrCode(options: IPrintLiveSyncOptions): Promise<void>;
	}

	interface IPlaygroundAppQrCodeOptions {
		platform?: string;
	}

	interface IPrintLiveSyncOptions extends IGetQrCodeUrlOptions {
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
		getPluginsUsageWarnings(data: IPreviewAppLiveSyncData, device: Device): string[];
	}
}