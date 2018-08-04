import { cache } from "../../common/decorators";
import * as path from "path";

export abstract class DeviceLiveSyncServiceBase {
	private static FAST_SYNC_FILE_EXTENSIONS = [".css", ".xml", ".html"];

	constructor(
		protected $platformsData: IPlatformsData,
		protected device: Mobile.IDevice
	) { }

	public canExecuteFastSync(filePath: string, projectData: IProjectData, platform: string): boolean {
		const fastSyncFileExtensions = this.getFastLiveSyncFileExtensions(platform, projectData);
		return _.includes(fastSyncFileExtensions, path.extname(filePath));
	}

	protected canExecuteFastSyncForPaths(localToDevicePaths: Mobile.ILocalToDevicePathData[], projectData: IProjectData, platform: string) {
		return !_.some(localToDevicePaths,
			(localToDevicePath: Mobile.ILocalToDevicePathData) =>
				!this.canExecuteFastSync(localToDevicePath.getLocalPath(), projectData, this.device.deviceInfo.platform));
	}

	@cache()
	private getFastLiveSyncFileExtensions(platform: string, projectData: IProjectData): string[] {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const fastSyncFileExtensions = DeviceLiveSyncServiceBase.FAST_SYNC_FILE_EXTENSIONS.concat(platformData.fastLivesyncFileExtensions);
		return fastSyncFileExtensions;
	}

	public async transferFiles(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[], projectFilesPath: string, isFullSync: boolean): Promise<Mobile.ILocalToDevicePathData[]> {
		let transferredFiles: Mobile.ILocalToDevicePathData[] = [];

		if (isFullSync) {
			transferredFiles = await this.device.fileSystem.transferDirectory(deviceAppData, localToDevicePaths, projectFilesPath);
		} else {
			transferredFiles = await this.device.fileSystem.transferFiles(deviceAppData, localToDevicePaths);
		}

		return transferredFiles;
	}

	public async finalizeSync(liveSyncInfo: ILiveSyncResultInfo, projectData: IProjectData): Promise<IAndroidLivesyncSyncOperationResult> {
		//implement in case a sync point for all remove/create operation is needed
		return {
			didRefresh:true,
			operationId: ""
		};
	}
}
