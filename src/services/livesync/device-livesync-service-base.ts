import { cache } from "../../common/decorators";
import * as path from "path";
import { performanceLog } from "../../common/decorators";

export abstract class DeviceLiveSyncServiceBase {
	private static FAST_SYNC_FILE_EXTENSIONS = [".css", ".xml", ".html"];

	constructor(
		protected platformsDataService: IPlatformsDataService,
		protected device: Mobile.IDevice
	) { }

	public canExecuteFastSync(liveSyncResult: ILiveSyncResultInfo, filePath: string, projectData: IProjectData, platform: string): boolean {
		const fastSyncFileExtensions = this.getFastLiveSyncFileExtensions(platform, projectData);
		return liveSyncResult.useHotModuleReload || _.includes(fastSyncFileExtensions, path.extname(filePath));
	}

	protected canExecuteFastSyncForPaths(liveSyncResult: ILiveSyncResultInfo, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectData: IProjectData, platform: string) {
		return !_.some(localToDevicePaths,
			(localToDevicePath: Mobile.ILocalToDevicePathData) =>
				!this.canExecuteFastSync(liveSyncResult, localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));
	}

	@cache()
	private getFastLiveSyncFileExtensions(platform: string, projectData: IProjectData): string[] {
		const platformData = this.platformsDataService.getPlatformData(platform, projectData);
		const fastSyncFileExtensions = DeviceLiveSyncServiceBase.FAST_SYNC_FILE_EXTENSIONS.concat(platformData.fastLivesyncFileExtensions);
		return fastSyncFileExtensions;
	}

	@performanceLog()
	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, projectData: IProjectData, liveSyncDeviceDescriptor: ILiveSyncDeviceDescriptor, options: ITransferFilesOptions): Promise<Mobile.ILocalToDevicePathData[]> {
		let transferredFiles: Mobile.ILocalToDevicePathData[] = [];

		if (options.isFullSync) {
			transferredFiles = await this.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			transferredFiles = await this.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
		}

		return transferredFiles;
	}

	public async finalizeSync(liveSyncInfo: ILiveSyncResultInfo, projectData: IProjectData): Promise<IAndroidLivesyncSyncOperationResult> {
		//implement in case a sync point for all remove/create operation is needed
		return {
			didRefresh: true,
			operationId: ""
		};
	}
}
