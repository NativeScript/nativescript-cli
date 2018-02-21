import { EventEmitter } from "events";
import { BUILD_OUTPUT_EVENT_NAME, ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { attachAwaitDetach } from "../common/helpers";

export class LocalBuildService extends EventEmitter implements ILocalBuildService {
	constructor(private $projectData: IProjectData,
		private $mobileHelper: Mobile.IMobileHelper,
		private $errors: IErrors,
		private $platformsData: IPlatformsData,
		private $platformService: IPlatformService,
		private $projectDataService: IProjectDataService) {
		super();
	}

	public async build(platform: string, platformBuildOptions: IPlatformBuildData, platformTemplate?: string): Promise<string> {
		if (this.$mobileHelper.isAndroidPlatform(platform) && platformBuildOptions.release && (!platformBuildOptions.keyStorePath || !platformBuildOptions.keyStorePassword || !platformBuildOptions.keyStoreAlias || !platformBuildOptions.keyStoreAliasPassword)) {
			this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
		}

		this.$projectData.initializeProjectData(platformBuildOptions.projectDir);
		const prepareInfo: IPreparePlatformInfo = {
			platform,
			appFilesUpdaterOptions: platformBuildOptions,
			platformTemplate,
			projectData: this.$projectData,
			env: platformBuildOptions.env,
			config: {
				provision: platformBuildOptions.provision,
				teamId: platformBuildOptions.teamId,
				sdk: null,
				frameworkPath: null,
				ignoreScripts: false
			}
		};

		await this.$platformService.preparePlatform(prepareInfo);
		const handler = (data: any) => {
			data.projectDir = platformBuildOptions.projectDir;
			this.emit(BUILD_OUTPUT_EVENT_NAME, data);
		};
		platformBuildOptions.buildOutputStdio = "pipe";

		await attachAwaitDetach(BUILD_OUTPUT_EVENT_NAME, this.$platformService, handler, this.$platformService.buildPlatform(platform, platformBuildOptions, this.$projectData));
		return this.$platformService.lastOutputPath(platform, platformBuildOptions, this.$projectData);
	}

	public async cleanNativeApp(data: ICleanNativeAppData): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(data.projectDir);
		const platformData = this.$platformsData.getPlatformData(data.platform, projectData);
		await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
	}
}

$injector.register("localBuildService", LocalBuildService);
