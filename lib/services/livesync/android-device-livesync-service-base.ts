import { DeviceLiveSyncServiceBase } from "./device-livesync-service-base";
import { IPlatformsDataService } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import { IFilesHashService } from "../../definitions/files-hash-service";
import { IStringDictionary } from "../../common/declarations";
import { IInjector } from "../../common/definitions/yok";
import * as _ from "lodash";

export abstract class AndroidDeviceLiveSyncServiceBase extends DeviceLiveSyncServiceBase {
	constructor(
		protected $injector: IInjector,
		protected $platformsDataService: IPlatformsDataService,
		protected $filesHashService: IFilesHashService,
		protected $logger: ILogger,
		protected device: Mobile.IAndroidDevice
	) {
		super($platformsDataService, device);
	}

	public abstract transferFilesOnDevice(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[]
	): Promise<void>;
	public abstract transferDirectoryOnDevice(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		projectFilesPath: string
	): Promise<void>;

	public async transferFiles(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		projectFilesPath: string,
		projectData: IProjectData,
		liveSyncDeviceDescriptor: ILiveSyncDeviceDescriptor,
		options: ITransferFilesOptions
	): Promise<Mobile.ILocalToDevicePathData[]> {
		const deviceHashService = this.device.fileSystem.getDeviceHashService(
			deviceAppData.appIdentifier
		);
		const currentHashes = await deviceHashService.generateHashesFromLocalToDevicePaths(
			localToDevicePaths
		);
		const transferredFiles = await this.transferFilesCore(
			deviceAppData,
			localToDevicePaths,
			projectFilesPath,
			currentHashes,
			options
		);
		await this.device.fileSystem.updateHashesOnDevice(
			currentHashes,
			deviceAppData.appIdentifier
		);
		return transferredFiles;
	}

	private async transferFilesCore(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		projectFilesPath: string,
		currentHashes: IStringDictionary,
		options: ITransferFilesOptions
	): Promise<Mobile.ILocalToDevicePathData[]> {
		if (options.force && options.isFullSync) {
			const hashFileDevicePath = this.device.fileSystem.getDeviceHashService(
				deviceAppData.appIdentifier
			).hashFileDevicePath;
			await this.device.fileSystem.deleteFile(
				hashFileDevicePath,
				deviceAppData.appIdentifier
			);
			this.$logger.trace(
				"Before transfer directory on device ",
				localToDevicePaths
			);
			await this.transferDirectoryOnDevice(
				deviceAppData,
				localToDevicePaths,
				projectFilesPath
			);
			return localToDevicePaths;
		}

		const localToDevicePathsToTransfer = await this.getLocalToDevicePathsToTransfer(
			deviceAppData,
			localToDevicePaths,
			currentHashes,
			options
		);
		this.$logger.trace("Files to transfer: ", localToDevicePathsToTransfer);
		await this.transferFilesOnDevice(
			deviceAppData,
			localToDevicePathsToTransfer
		);
		return localToDevicePathsToTransfer;
	}

	private async getLocalToDevicePathsToTransfer(
		deviceAppData: Mobile.IDeviceAppData,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		currentHashes: IStringDictionary,
		options: ITransferFilesOptions
	): Promise<Mobile.ILocalToDevicePathData[]> {
		if (options.force || !options.isFullSync) {
			return localToDevicePaths;
		}

		const changedLocalToDevicePaths = await this.getChangedLocalToDevicePaths(
			deviceAppData.appIdentifier,
			localToDevicePaths,
			currentHashes
		);
		return changedLocalToDevicePaths;
	}

	private async getChangedLocalToDevicePaths(
		appIdentifier: string,
		localToDevicePaths: Mobile.ILocalToDevicePathData[],
		currentHashes: IStringDictionary
	): Promise<Mobile.ILocalToDevicePathData[]> {
		const deviceHashService = this.device.fileSystem.getDeviceHashService(
			appIdentifier
		);
		const oldHashes = (await deviceHashService.getShasumsFromDevice()) || {};
		const changedHashes = deviceHashService.getChangedShasums(
			oldHashes,
			currentHashes
		);
		const changedFiles = _.keys(changedHashes);
		const changedLocalToDevicePaths = localToDevicePaths.filter(
			(localToDevicePathData) =>
				changedFiles.indexOf(localToDevicePathData.getLocalPath()) >= 0
		);
		return changedLocalToDevicePaths;
	}
}
