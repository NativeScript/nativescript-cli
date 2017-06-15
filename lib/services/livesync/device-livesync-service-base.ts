import { cache } from "../../common/decorators";
import * as path from "path";

export abstract class DeviceLiveSyncServiceBase {
	private static FAST_SYNC_FILE_EXTENSIONS = [".css", ".xml", ".html"];

	constructor(protected $platformsData: IPlatformsData) { }

	public canExecuteFastSync(filePath: string, projectData: IProjectData, platform: string): boolean {
		const fastSyncFileExtensions = this.getFastLiveSyncFileExtensions(platform, projectData);
		return _.includes(fastSyncFileExtensions, path.extname(filePath));
	}

	@cache()
	private getFastLiveSyncFileExtensions(platform: string, projectData: IProjectData): string[] {
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const fastSyncFileExtensions = DeviceLiveSyncServiceBase.FAST_SYNC_FILE_EXTENSIONS.concat(platformData.fastLivesyncFileExtensions);
		return fastSyncFileExtensions;
	}

}
