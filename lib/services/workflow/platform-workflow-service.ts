import * as path from "path";
import { NativePlatformStatus } from "../../constants";

export class PlatformWorkflowService implements IPlatformWorkflowService {
	constructor (
		private $fs: IFileSystem,
		private $platformAddService: IPlatformAddService,
		private $platformBuildService: IPlatformBuildService,
		private $platformService: IPreparePlatformService,
		private $projectChangesService: IProjectChangesService
	) { }

	public async preparePlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData): Promise<void> {
		await this.addPlatformIfNeeded(platformData, projectData, workflowData);
		await this.$platformService.preparePlatform(platformData, projectData, workflowData);
	}

	public async buildPlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData, buildConfig: IBuildConfig): Promise<string> {
		await this.preparePlatform(platformData, projectData, workflowData);
		const result = await this.$platformBuildService.buildPlatform(platformData, projectData, buildConfig);

		return result;
	}

	public async runPlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData) {
		return;
		// await this.buildPlatformIfNeeded()
	}

	private async addPlatformIfNeeded(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData): Promise<void> {
		const { platformParam, frameworkPath, nativePrepare } = workflowData;

		const shouldAddPlatform = this.shouldAddPlatform(platformData, projectData, nativePrepare);
		if (shouldAddPlatform) {
			await this.$platformAddService.addPlatform({ platformParam, frameworkPath, nativePrepare }, projectData);
		}
	}

	private shouldAddPlatform(platformData: IPlatformData, projectData: IProjectData, nativePrepare: INativePrepare): boolean {
		const platformName = platformData.platformNameLowerCase;
		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformName, projectData);
		const hasPlatformDirectory = this.$fs.exists(path.join(projectData.platformsDir, platformName));
		const shouldAddNativePlatform = !nativePrepare || !nativePrepare.skipNativePrepare;
		const requiresNativePlatformAdd = prepareInfo && prepareInfo.nativePlatformStatus === NativePlatformStatus.requiresPlatformAdd;
		const result = !hasPlatformDirectory || (shouldAddNativePlatform && requiresNativePlatformAdd);

		return !!result;
	}
}
$injector.register("platformWorkflowService", PlatformWorkflowService);
