import { IOSPrepareData, AndroidPrepareData } from "../data/prepare-data";

export class PrepareDataService {
	constructor(private $mobileHelper: Mobile.IMobileHelper) { }

	public getPrepareData(projectDir: string, platform: string, data: any) {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return new IOSPrepareData(projectDir, platform, data);
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return new AndroidPrepareData(projectDir, platform, data);
		}
	}
}
$injector.register("prepareDataService", PrepareDataService);
