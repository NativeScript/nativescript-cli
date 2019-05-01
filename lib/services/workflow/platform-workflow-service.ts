import { WorkflowDataService } from "./workflow-data-service";
import { PlatformAddService } from "../platform/platform-add-service";
import { PlatformBuildService } from "../platform/platform-build-service";
import { PlatformService } from "../platform-service";

export class PlatformWorkflowService implements IPlatformWorkflowService {
	constructor (
		private $platformAddService: PlatformAddService,
		private $platformBuildService: PlatformBuildService,
		private $platformService: PlatformService,
		private $workflowDataService: WorkflowDataService,
	) { }

	public async preparePlatform(platform: string, projectDir: string, options: IOptions): Promise<void> {
		const { nativePlatformData, projectData, addPlatformData, preparePlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, options);

		await this.$platformAddService.addPlatformIfNeeded(nativePlatformData, projectData, addPlatformData);
		await this.$platformService.preparePlatform(nativePlatformData, projectData, preparePlatformData);
	}

	public async buildPlatform(platform: string, projectDir: string, options: IOptions): Promise<string> {
		const { nativePlatformData, projectData, buildPlatformData } = this.$workflowDataService.createWorkflowData(platform, projectDir, options);

		await this.preparePlatform(platform, projectDir, options);
		const result = await this.$platformBuildService.buildPlatform(nativePlatformData, projectData, buildPlatformData);

		return result;
	}
}
$injector.register("platformWorkflowService", PlatformWorkflowService);
