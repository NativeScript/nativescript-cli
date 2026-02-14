import { IProjectData } from "../definitions/project";
import { IPlatformData, IPlatformsDataService } from "../definitions/platform";
import { injector } from "../common/yok";
import * as _ from "lodash";
import { IOptions } from "../declarations";

export class PlatformsDataService implements IPlatformsDataService {
	private platformsDataService: { [index: string]: any } = {};

	constructor(
		private $options: IOptions,
		$androidProjectService: IPlatformProjectService,
		$iOSProjectService: IPlatformProjectService
	) {
		this.platformsDataService = {
			ios: $iOSProjectService,
			android: $androidProjectService,
			visionos: $iOSProjectService,
			macos: $iOSProjectService,
		};
	}

	public getPlatformData(
		platform: string,
		projectData: IProjectData
	): IPlatformData {
		const platformKey = platform && _.first(platform.toLowerCase().split("@"));
		let platformData: IPlatformData;
		if (platformKey) {
			this.$options.platformOverride ??= platform;
			platformData =
				this.platformsDataService[platformKey] &&
				this.platformsDataService[platformKey].getPlatformData(projectData);
		}

		return platformData;
	}
}
injector.register("platformsDataService", PlatformsDataService);
