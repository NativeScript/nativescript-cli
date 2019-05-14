import { PrepareController } from "./prepare-controller";
import { BuildData } from "../data/build-data";
import * as constants from "../constants";
import { BuildArtefactsService } from "../services/build-artefacts-service";
import { Configurations } from "../common/constants";
import { EventEmitter } from "events";
import { attachAwaitDetach } from "../common/helpers";
import { BuildInfoFileService } from "../services/build-info-file-service";

export class BuildController extends EventEmitter {
	constructor(
		private $analyticsService: IAnalyticsService,
		private $buildArtefactsService: BuildArtefactsService,
		private $buildInfoFileService: BuildInfoFileService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $injector: IInjector,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectDataService: IProjectDataService,
		private $projectChangesService: IProjectChangesService,
		private $prepareController: PrepareController,
	) { super(); }

	private get $platformsData(): IPlatformsData {
		return this.$injector.resolve("platformsData");
	}

	public async prepareAndBuildPlatform(buildData: BuildData): Promise<string> {
		await this.$prepareController.preparePlatform(buildData);
		const result = await this.buildPlatform(buildData);

		return result;
	}

	public async buildPlatform(buildData: BuildData) {
		this.$logger.out("Building project...");

		const platform = buildData.platform.toLowerCase();
		const projectData = this.$projectDataService.getProjectData(buildData.projectDir);
		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		const action = constants.TrackActionNames.Build;
		const isForDevice = this.$mobileHelper.isAndroidPlatform(platform) ? null : buildData && buildData.buildForDevice;

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action,
			isForDevice,
			platform,
			projectDir: projectData.projectDir,
			additionalData: `${buildData.release ? Configurations.Release : Configurations.Debug}_${buildData.clean ? constants.BuildStates.Clean : constants.BuildStates.Incremental}`
		});

		if (buildData.clean) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
			this.$logger.printInfoMessageOnSameLine(data.data.toString());
		};

		await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME, platformData.platformProjectService, handler, platformData.platformProjectService.buildProject(platformData.projectRoot, projectData, buildData));

		const buildInfoFileDir = platformData.getBuildOutputPath(buildData);
		this.$buildInfoFileService.saveBuildInfoFile(platformData, buildInfoFileDir);

		this.$logger.out("Project successfully built.");

		const result = await this.$buildArtefactsService.getLatestApplicationPackagePath(platformData, buildData);

		if (buildData.copyTo) {
			this.$buildArtefactsService.copyLastOutput(buildData.copyTo, platformData, buildData);
			this.$logger.info(`The build result is located at: ${buildInfoFileDir}`);
		}

		return result;
	}

	public async buildPlatformIfNeeded(buildData: BuildData): Promise<string> {
		let result = null;

		const platform = buildData.platform.toLowerCase();
		const projectData = this.$projectDataService.getProjectData(buildData.projectDir);
		const platformData = this.$platformsData.getPlatformData(platform, projectData);

		const outputPath = buildData.outputPath || platformData.getBuildOutputPath(buildData);
		const shouldBuildPlatform = await this.shouldBuildPlatform(buildData, platformData, outputPath);
		if (shouldBuildPlatform) {
			result = await this.buildPlatform(buildData);
		}

		return result;
	}

	private async shouldBuildPlatform(buildData: BuildData, platformData: IPlatformData, outputPath: string): Promise<boolean> {
		if (buildData.release && this.$projectChangesService.currentChanges.hasChanges) {
			return true;
		}

		if (this.$projectChangesService.currentChanges.changesRequireBuild) {
			return true;
		}

		if (!this.$fs.exists(outputPath)) {
			return true;
		}

		const validBuildOutputData = platformData.getValidBuildOutputData(buildData);
		const packages = this.$buildArtefactsService.getAllApplicationPackages(outputPath, validBuildOutputData);
		if (packages.length === 0) {
			return true;
		}

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformData);
		const buildInfo = this.$buildInfoFileService.getBuildInfoFromFile(platformData, buildData, outputPath);
		if (!prepareInfo || !buildInfo) {
			return true;
		}

		if (buildData.clean) {
			return true;
		}

		if (prepareInfo.time === buildInfo.prepareTime) {
			return false;
		}

		return prepareInfo.changesRequireBuildTime !== buildInfo.prepareTime;
	}
}
$injector.register("buildController", BuildController);
