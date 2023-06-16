import * as constants from "../constants";
import { Configurations } from "../common/constants";
import { EventEmitter } from "events";
import { attachAwaitDetach } from "../common/helpers";
import { IProjectDataService } from "../definitions/project";
import {
	IBuildController,
	IBuildArtifactsService,
	IBuildInfoFileService,
	IBuildData,
} from "../definitions/build";
import { IPlatformsDataService } from "../definitions/platform";
import { IAnalyticsService, IFileSystem } from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { performance } from "perf_hooks";

export class BuildController extends EventEmitter implements IBuildController {
	constructor(
		private $analyticsService: IAnalyticsService,
		private $buildArtifactsService: IBuildArtifactsService,
		private $buildInfoFileService: IBuildInfoFileService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $injector: IInjector,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectDataService: IProjectDataService,
		private $projectChangesService: IProjectChangesService,
		private $prepareController: IPrepareController
	) {
		super();
	}

	private get $platformsDataService(): IPlatformsDataService {
		return this.$injector.resolve("platformsDataService");
	}

	public async prepareAndBuild(buildData: IBuildData): Promise<string> {
		await this.$prepareController.prepare(buildData);
		const result = await this.build(buildData);

		return result;
	}

	public async build(buildData: IBuildData): Promise<string> {
		this.$logger.info("Building project...");
		const startTime = performance.now();

		const platform = buildData.platform.toLowerCase();
		const projectData = this.$projectDataService.getProjectData(
			buildData.projectDir
		);
		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData
		);

		const action = constants.TrackActionNames.Build;
		const isForDevice = this.$mobileHelper.isAndroidPlatform(platform)
			? null
			: buildData && buildData.buildForDevice;

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action,
			isForDevice,
			platform,
			projectDir: projectData.projectDir,
			additionalData: `${
				buildData.release ? Configurations.Release : Configurations.Debug
			}_${
				buildData.clean
					? constants.BuildStates.Clean
					: constants.BuildStates.Incremental
			}`,
		});

		if (buildData.clean) {
			await platformData.platformProjectService.cleanProject(
				platformData.projectRoot
			);
		}

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
			this.$logger.info(data.data.toString(), {
				[constants.LoggerConfigData.skipNewLine]: true,
			});
		};

		await attachAwaitDetach(
			constants.BUILD_OUTPUT_EVENT_NAME,
			platformData.platformProjectService,
			handler,
			platformData.platformProjectService.buildProject(
				platformData.projectRoot,
				projectData,
				buildData
			)
		);

		const buildInfoFileDir = platformData.getBuildOutputPath(buildData);
		this.$buildInfoFileService.saveLocalBuildInfo(
			platformData,
			buildInfoFileDir
		);

		const endTime = performance.now();
		const buildTime = (endTime - startTime) / 1000;

		this.$logger.info("Project successfully built.");
		this.$logger.info(`Build time: ${buildTime.toFixed(3)} s.`);

		const result = await this.$buildArtifactsService.getLatestAppPackagePath(
			platformData,
			buildData
		);

		if (buildData.copyTo) {
			this.$buildArtifactsService.copyLatestAppPackage(
				buildData.copyTo,
				platformData,
				buildData
			);
		} else {
			this.$logger.info(`The build result is located at: ${result}`);
		}

		return result;
	}

	public async buildIfNeeded(buildData: IBuildData): Promise<string> {
		let result = null;

		const shouldBuildPlatform = await this.shouldBuild(buildData);
		if (shouldBuildPlatform) {
			result = await this.build(buildData);
		}

		return result;
	}

	public async shouldBuild(buildData: IBuildData): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(
			buildData.projectDir
		);
		const platformData = this.$platformsDataService.getPlatformData(
			buildData.platform,
			projectData
		);
		const outputPath =
			buildData.outputPath || platformData.getBuildOutputPath(buildData);
		const changesInfo =
			this.$projectChangesService.currentChanges ||
			(await this.$projectChangesService.checkForChanges(
				platformData,
				projectData,
				buildData
			));

		if (changesInfo.changesRequireBuild) {
			return true;
		}

		if (!this.$fs.exists(outputPath)) {
			return true;
		}

		const validBuildOutputData = platformData.getValidBuildOutputData(
			buildData
		);
		const packages = this.$buildArtifactsService.getAllAppPackages(
			outputPath,
			validBuildOutputData
		);
		if (packages.length === 0) {
			return true;
		}

		const prepareInfo = this.$projectChangesService.getPrepareInfo(
			platformData
		);
		const buildInfo = this.$buildInfoFileService.getLocalBuildInfo(
			platformData,
			buildData
		);
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
injector.register("buildController", BuildController);
