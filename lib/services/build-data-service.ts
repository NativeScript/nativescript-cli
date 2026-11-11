import {
	AndroidBuildData,
	IOSBuildData,
	WindowsBuildData,
	LinuxBuildData,
} from "../data/build-data";
import { IBuildDataService } from "../definitions/build";
import { injector } from "../common/yok";

export class BuildDataService implements IBuildDataService {
	constructor(private $mobileHelper: Mobile.IMobileHelper) {}

	public getBuildData(projectDir: string, platform: string, data: any) {
		if (this.$mobileHelper.isApplePlatform(platform)) {
			return new IOSBuildData(projectDir, platform, data);
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return new AndroidBuildData(projectDir, platform, data);
		} else if (this.$mobileHelper.isWindowsPlatform(platform)) {
			return new WindowsBuildData(projectDir, platform, data);
		} else if (this.$mobileHelper.isLinuxPlatform(platform)) {
			return new LinuxBuildData(projectDir, platform, data);
		}
	}
}
injector.register("buildDataService", BuildDataService);
