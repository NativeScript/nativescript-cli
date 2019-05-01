import { EventEmitter } from "events";
import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { WorkflowDataService } from "./workflow/workflow-data-service";

export class LocalBuildService extends EventEmitter implements ILocalBuildService {
	constructor(
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsData: IPlatformsData,
		private $platformBuildService: IPlatformBuildService,
		private $projectDataService: IProjectDataService,
		private $workflowDataService: WorkflowDataService
	) { super(); }

	public async build(platform: string, platformBuildOptions: IPlatformBuildData): Promise<string> {
		if (this.$mobileHelper.isAndroidPlatform(platform) && platformBuildOptions.release && (!platformBuildOptions.keyStorePath || !platformBuildOptions.keyStorePassword || !platformBuildOptions.keyStoreAlias || !platformBuildOptions.keyStoreAliasPassword)) {
			this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
		}

		const { nativePlatformData, projectData, buildPlatformData } = this.$workflowDataService.createWorkflowData(platform, platformBuildOptions.projectDir, platformBuildOptions);

		const result = await this.$platformBuildService.buildPlatform(nativePlatformData, projectData, buildPlatformData);

		return result;
	}

	public async cleanNativeApp(data: ICleanNativeAppData): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(data.projectDir);
		const platformData = this.$platformsData.getPlatformData(data.platform, projectData);
		await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
	}
}

$injector.register("localBuildService", LocalBuildService);
