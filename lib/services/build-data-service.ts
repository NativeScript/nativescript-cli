import { AndroidBuildData, IOSBuildData } from "../data/build-data";
import { IBuildDataService } from "../definitions/build";
import { injector } from "../common/yok";

export class BuildDataService implements IBuildDataService {
	constructor(private $mobileHelper: Mobile.IMobileHelper) {}

	public getBuildData(projectDir: string, platform: string, data: any) {
		if (this.$mobileHelper.isApplePlatfrom(platform)) {
			return new IOSBuildData(projectDir, platform, data);
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return new AndroidBuildData(projectDir, platform, data);
		}
	}
}
injector.register("buildDataService", BuildDataService);
