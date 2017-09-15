import { EventEmitter } from "events";
import { BUILD_OUTPUT_EVENT_NAME, ANDROID_RELEASE_BUILD_ERROR_MESSAGE } from "../constants";
import { attachAwaitDetach } from "../common/helpers";

export class LocalBuildService extends EventEmitter implements ILocalBuildService {
	constructor(private $projectData: IProjectData,
		private $mobileHelper: Mobile.IMobileHelper,
		private $errors: IErrors,
		private $platformService: IPlatformService) {
		super();
	}

	public async build(platform: string, platformBuildOptions: IPlatformBuildData, platformTemplate?: string): Promise<string> {
		if (this.$mobileHelper.isAndroidPlatform(platform) && platformBuildOptions.release && (!platformBuildOptions.keyStorePath || !platformBuildOptions.keyStorePassword || !platformBuildOptions.keyStoreAlias || !platformBuildOptions.keyStoreAliasPassword)) {
			this.$errors.fail(ANDROID_RELEASE_BUILD_ERROR_MESSAGE);
		}

		this.$projectData.initializeProjectData(platformBuildOptions.projectDir);
		await this.$platformService.preparePlatform(platform, platformBuildOptions, platformTemplate, this.$projectData, {
			provision: platformBuildOptions.provision,
			teamId: platformBuildOptions.teamId,
			sdk: null,
			frameworkPath: null,
			ignoreScripts: false
		});
		const handler = (data: any) => {
			data.projectDir = platformBuildOptions.projectDir;
			this.emit(BUILD_OUTPUT_EVENT_NAME, data);
		};
		platformBuildOptions.buildOutputStdio = "pipe";

		await attachAwaitDetach(BUILD_OUTPUT_EVENT_NAME, this.$platformService, handler, this.$platformService.buildPlatform(platform, platformBuildOptions, this.$projectData));
		return this.$platformService.lastOutputPath(platform, platformBuildOptions, this.$projectData);
	}
}

$injector.register("localBuildService", LocalBuildService);
