import { IInjector, $injector } from "../common/definitions/yok";
import { IErrors } from "../common/declarations";

export class LiveSyncServiceResolver implements ILiveSyncServiceResolver {
	constructor(
		private $errors: IErrors,
		private $injector: IInjector,
		private $mobileHelper: Mobile.IMobileHelper
	) { }

	public resolveLiveSyncService(platform: string): IPlatformLiveSyncService {
		if (this.$mobileHelper.isiOSPlatform(platform)) {
			return this.$injector.resolve("iOSLiveSyncService");
		} else if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return this.$injector.resolve("androidLiveSyncService");
		}

		this.$errors.fail(`Invalid platform ${platform}. Supported platforms are: ${this.$mobileHelper.platformNames.join(", ")}`);
	}
}
$injector.register("liveSyncServiceResolver", LiveSyncServiceResolver);
