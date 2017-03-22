import { EventEmitter } from "events";
import { BUILD_OUTPUT_EVENT_NAME } from "../constants";

export class LocalBuildService extends EventEmitter {
	constructor(private $projectData: IProjectData,
	private $platformService: IPlatformService) {
		super();
	}

	public async build(platform: string, platformBuildOptions: IPlatformBuildData, platformTemplate?: string): Promise<string> {
		this.$projectData.initializeProjectData(platformBuildOptions.projectDir);
		await this.$platformService.preparePlatform(platform, platformBuildOptions, platformTemplate, this.$projectData, { provision: platformBuildOptions.provision, sdk: null });
		this.$platformService.on(BUILD_OUTPUT_EVENT_NAME, (data: any) => {
			data.projectDir = platformBuildOptions.projectDir;
			this.emit(BUILD_OUTPUT_EVENT_NAME, data);
		});
		platformBuildOptions.buildOutputStdio = "inherit";
		await this.$platformService.buildPlatform(platform, platformBuildOptions, this.$projectData);
		return this.$platformService.lastOutputPath(platform, platformBuildOptions, this.$projectData);
	}
}

$injector.register("localBuildService", LocalBuildService);
