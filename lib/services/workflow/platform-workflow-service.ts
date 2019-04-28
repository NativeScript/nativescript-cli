import * as path from "path";
import { NativePlatformStatus } from "../../constants";

export class PlatformWorkflowService implements IPlatformWorkflowService {
	constructor (
		private $buildArtefactsService: IBuildArtefactsService,
		private $fs: IFileSystem,
		private $platformAddService: IPlatformAddService,
		private $platformBuildService: IPlatformBuildService,
		private $platformService: IPreparePlatformService,
		private $projectChangesService: IProjectChangesService
	) { }

	public async addPlatformIfNeeded(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData): Promise<void> {
		const { platformParam, frameworkPath, nativePrepare } = workflowData;

		const shouldAddPlatform = this.shouldAddPlatform(platformData, projectData, nativePrepare);
		if (shouldAddPlatform) {
			await this.$platformAddService.addPlatform({ platformParam, frameworkPath, nativePrepare }, projectData);
		}
	}

	public async preparePlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData): Promise<void> {
		await this.addPlatformIfNeeded(platformData, projectData, workflowData);
		await this.$platformService.preparePlatform(platformData, projectData, workflowData);
	}

	public async buildPlatform(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData, buildConfig: IBuildConfig): Promise<string> {
		await this.preparePlatform(platformData, projectData, workflowData);
		const result = await this.$platformBuildService.buildPlatform(platformData, projectData, buildConfig);

		return result;
	}

	public async buildPlatformIfNeeded(platformData: IPlatformData, projectData: IProjectData, workflowData: IPlatformWorkflowData, buildConfig: IBuildConfig, outputPath?: string): Promise<string> {
		await this.preparePlatform(platformData, projectData, workflowData);

		let result = null;

		outputPath = outputPath || platformData.getBuildOutputPath(buildConfig);
		const shouldBuildPlatform = await this.shouldBuildPlatform(platformData, projectData, buildConfig, outputPath);
		if (shouldBuildPlatform) {
			result = await this.$platformBuildService.buildPlatform(platformData, projectData, buildConfig);
		}

		return result;
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

	private async shouldBuildPlatform(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig, outputPath: string): Promise<boolean> {
		const platform = platformData.platformNameLowerCase;
		if (buildConfig.release && this.$projectChangesService.currentChanges.hasChanges) {
			return true;
		}

		if (this.$projectChangesService.currentChanges.changesRequireBuild) {
			return true;
		}

		if (!this.$fs.exists(outputPath)) {
			return true;
		}

		const validBuildOutputData = platformData.getValidBuildOutputData(buildConfig);
		const packages = this.$buildArtefactsService.getAllBuiltApplicationPackages(outputPath, validBuildOutputData);
		if (packages.length === 0) {
			return true;
		}

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		const buildInfo = this.$platformBuildService.getBuildInfoFromFile(platformData, buildConfig, outputPath);
		if (!prepareInfo || !buildInfo) {
			return true;
		}

		if (buildConfig.clean) {
			return true;
		}

		if (prepareInfo.time === buildInfo.prepareTime) {
			return false;
		}

		return prepareInfo.changesRequireBuildTime !== buildInfo.prepareTime;
	}
}
$injector.register("platformWorkflowService", PlatformWorkflowService);
