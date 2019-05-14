import { AndroidBuildData, IOSBuildData } from "../data/build-data";

export class BuildDataService {
	constructor(private $mobileHelper: Mobile.IMobileHelper) { }

	public getBuildData(projectDir: string, platform: string, data: any) {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return new IOSBuildData(projectDir, platform, data);
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return new AndroidBuildData(projectDir, platform, data);
		}
	}
}
$injector.register("buildDataService", BuildDataService);
