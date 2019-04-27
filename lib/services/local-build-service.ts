import { EventEmitter } from "events";
import { ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";

export class LocalBuildService extends EventEmitter implements ILocalBuildService {
	constructor(
		private $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		private $platformsData: IPlatformsData,
		private $platformWorkflowDataFactory: IPlatformWorkflowDataFactory,
		private $platformWorkflowService: IPlatformWorkflowService,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService
	) { super(); }

	public async build(platform: string, platformBuildOptions: IPlatformBuildData): Promise<string> {
		if (this.$mobileHelper.isAndroidPlatform(platform) && platformBuildOptions.release && (!platformBuildOptions.keyStorePath || !platformBuildOptions.keyStorePassword || !platformBuildOptions.keyStoreAlias || !platformBuildOptions.keyStoreAliasPassword)) {
			this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
		}

		this.$projectData.initializeProjectData(platformBuildOptions.projectDir);

		const projectData = this.$projectDataService.getProjectData(platformBuildOptions.projectDir);
		const platformData = this.$platformsData.getPlatformData(platform, projectData);
		const workflowData = this.$platformWorkflowDataFactory.createPlatformWorkflowData(platform, <any>platformBuildOptions, (<any>platformBuildOptions).nativePrepare);

		platformBuildOptions.buildOutputStdio = "pipe";

		const result = await this.$platformWorkflowService.buildPlatform(platformData, projectData, workflowData, platformBuildOptions);

		return result;
	}

	public async cleanNativeApp(data: ICleanNativeAppData): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(data.projectDir);
		const platformData = this.$platformsData.getPlatformData(data.platform, projectData);
		await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
	}
}

$injector.register("localBuildService", LocalBuildService);
