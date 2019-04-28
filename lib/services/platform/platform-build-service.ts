import * as constants from "../../constants";
import { Configurations } from "../../common/constants";
import { EventEmitter } from "events";
import { attachAwaitDetach } from "../../common/helpers";
import * as path from "path";

const buildInfoFileName = ".nsbuildinfo";

export class PlatformBuildService extends EventEmitter implements IPlatformBuildService {
	constructor(
		private $analyticsService: IAnalyticsService,
		private $buildArtefactsService: IBuildArtefactsService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectChangesService: IProjectChangesService
	) { super(); }

	public async buildPlatform(platformData: IPlatformData, projectData: IProjectData, buildConfig: IBuildConfig): Promise<string> {
		this.$logger.out("Building project...");

		const platform = platformData.platformNameLowerCase;

		const action = constants.TrackActionNames.Build;
		const isForDevice = this.$mobileHelper.isAndroidPlatform(platform) ? null : buildConfig && buildConfig.buildForDevice;

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action,
			isForDevice,
			platform,
			projectDir: projectData.projectDir,
			additionalData: `${buildConfig.release ? Configurations.Release : Configurations.Debug}_${buildConfig.clean ? constants.BuildStates.Clean : constants.BuildStates.Incremental}`
		});

		if (buildConfig.clean) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}

		const handler = (data: any) => {
			this.emit(constants.BUILD_OUTPUT_EVENT_NAME, data);
			this.$logger.printInfoMessageOnSameLine(data.data.toString());
		};

		await attachAwaitDetach(constants.BUILD_OUTPUT_EVENT_NAME, platformData.platformProjectService, handler, platformData.platformProjectService.buildProject(platformData.projectRoot, projectData, buildConfig));

		const buildInfoFileDirname = platformData.getBuildOutputPath(buildConfig);
		this.saveBuildInfoFile(platformData, projectData, buildInfoFileDirname);

		this.$logger.out("Project successfully built.");

		const result = await this.$buildArtefactsService.getLastBuiltPackagePath(platformData, buildConfig);

		// if (this.$options.copyTo) {
		// 	this.$platformService.copyLastOutput(platform, this.$options.copyTo, buildConfig, this.$projectData);
		// } else {
		// 	this.$logger.info(`The build result is located at: ${outputPath}`);
		// }

		return result;
	}

	public saveBuildInfoFile(platformData: IPlatformData, projectData: IProjectData, buildInfoFileDirname: string): void {
		const buildInfoFile = path.join(buildInfoFileDirname, buildInfoFileName);

		const prepareInfo = this.$projectChangesService.getPrepareInfo(platformData.platformNameLowerCase, projectData);
		const buildInfo: IBuildInfo = {
			prepareTime: prepareInfo.changesRequireBuildTime,
			buildTime: new Date().toString()
		};

		this.$fs.writeJson(buildInfoFile, buildInfo);
	}

	public getBuildInfoFromFile(platformData: IPlatformData, buildConfig: IBuildConfig, buildOutputPath?: string): IBuildInfo {
		buildOutputPath = buildOutputPath || platformData.getBuildOutputPath(buildConfig);
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
}
$injector.register("platformBuildService", PlatformBuildService);
