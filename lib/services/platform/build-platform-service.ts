import * as constants from "../../constants";
import { Configurations } from "../../common/constants";
import { attachAwaitDetach } from "../../common/helpers";
import { BuildArtefactsService } from "../build-artefacts-service";
import { BuildPlatformDataBase } from "../workflow/workflow-data-service";
import { EventEmitter } from "events";
import * as path from "path";

const buildInfoFileName = ".nsbuildinfo";

export class BuildPlatformService extends EventEmitter {
	constructor(
		private $analyticsService: IAnalyticsService,
		private $buildArtefactsService: BuildArtefactsService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectChangesService: IProjectChangesService
	) { super(); }

	public async buildPlatform<T extends BuildPlatformDataBase>(platformData: IPlatformData, projectData: IProjectData, buildPlatformData: T): Promise<string> {
		this.$logger.out("Building project...");

		const platform = platformData.platformNameLowerCase;

		const action = constants.TrackActionNames.Build;
		const isForDevice = this.$mobileHelper.isAndroidPlatform(platform) ? null : buildPlatformData && buildPlatformData.buildForDevice;

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action,
			isForDevice,
			platform,
			projectDir: projectData.projectDir,
			additionalData: `${buildPlatformData.release ? Configurations.Release : Configurations.Debug}_${buildPlatformData.clean ? constants.BuildStates.Clean : constants.BuildStates.Incremental}`
		});

		if (buildPlatformData.clean) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
			this.$logger.printInfoMessageOnSameLine(data.data.toString());
		};

		await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME, platformData.platformProjectService, handler, platformData.platformProjectService.buildProject(platformData.projectRoot, projectData, buildPlatformData));

		const buildInfoFileDirname = platformData.getBuildOutputPath(buildPlatformData);
		this.saveBuildInfoFile(platformData, projectData, buildInfoFileDirname);

		this.$logger.out("Project successfully built.");

		const result = await this.$buildArtefactsService.getLatestApplicationPackagePath(platformData, buildPlatformData);

		// if (this.$options.copyTo) {
		// 	this.$platformService.copyLastOutput(platform, this.$options.copyTo, buildPlatformData, this.$projectData);
		// } else {
		// 	this.$logger.info(`The build result is located at: ${outputPath}`);
		// }

		return result;
	}

	public async buildPlatformIfNeeded<T extends BuildPlatformDataBase>(platformData: IPlatformData, projectData: IProjectData, buildPlatformData: T, outputPath?: string): Promise<string> {
		let result = null;

		outputPath = outputPath || platformData.getBuildOutputPath(buildPlatformData);
		const shouldBuildPlatform = await this.shouldBuildPlatform(platformData, projectData, buildPlatformData, outputPath);
		if (shouldBuildPlatform) {
			result = await this.buildPlatform(platformData, projectData, buildPlatformData);
		}

		return result;
	}

	public saveBuildInfoFile(platformData: IPlatformData, projectData: IProjectData, buildInfoFileDirname: string): void {
		const buildInfoFile = path.join(buildInfoFileDirname, buildInfoFileName);

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformData);
		const buildInfo: IBuildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};

		this.$fs.writeJson(buildInfoFile, buildInfo);
	}

	public getBuildInfoFromFile(platformData: IPlatformData, buildPlatformData: BuildPlatformDataBase, buildOutputPath?: string): IBuildInfo {
		buildOutputPath = buildOutputPath || platformData.getBuildOutputPath(buildPlatformData);
		const buildInfoFile = path.join(buildOutputPath, buildInfoFileName);
		if (this.$fs.exists(buildInfoFile)) {
			try {
				const buildInfo = this.$fs.readJson(buildInfoFile);
				return buildInfo;
			} catch (e) {
				return null;
			}
		}

		return null;
	}

	private async shouldBuildPlatform(platformData: IPlatformData, projectData: IProjectData, buildPlatformData: BuildPlatformDataBase, outputPath: string): Promise<boolean> {
		if (buildPlatformData.release && this.$projectChangesService.currentChanges.hasChanges) {
			return true;
		}

		if (this.$projectChangesService.currentChanges.changesRequireBuild) {
			return true;
		}

		if (!this.$fs.exists(outputPath)) {
			return true;
		}

		const validBuildOutputData = platformData.getValidBuildOutputData(buildPlatformData);
		const packages = this.$buildArtefactsService.getAllApplicationPackages(outputPath, validBuildOutputData);
		if (packages.length === 0) {
			return true;
		}

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformData);
		const buildInfo = this.getBuildInfoFromFile(platformData, buildPlatformData, outputPath);
		if (!prepareInfo || !buildInfo) {
			return true;
		}

		if (buildPlatformData.clean) {
			return true;
		}

		if (prepareInfo.time === buildInfo.prepareTime) {
			return false;
		}

		return prepareInfo.changesRequireBuildTime !== buildInfo.prepareTime;
	}
}
$injector.register("buildPlatformService", BuildPlatformService);
