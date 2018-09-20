import { exported } from "../../../decorators";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../../constants";

const NS_COMPANION_APP_IDENTIFIER = "com.telerik.NativeScript";
const APPBUILDER_ANDROID_COMPANION_APP_IDENTIFIER = "com.telerik.AppBuilder";
const APPBUILDER_IOS_COMPANION_APP_IDENTIFIER = "com.telerik.Icenium";
const APPBUILDER_WP8_COMPANION_APP_IDENTIFIER = "{9155af5b-e7ed-486d-bc6b-35087fb59ecc}";

export class CompanionAppsService implements ICompanionAppsService {
	constructor(private $mobileHelper: Mobile.IMobileHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	@exported("companionAppsService")
	public getCompanionAppIdentifier(framework: string, platform: string): string {
		const lowerCasedFramework = (framework || "").toLowerCase();
		const lowerCasedPlatform = (platform || "").toLowerCase();

		if (lowerCasedFramework === TARGET_FRAMEWORK_IDENTIFIERS.Cordova.toLowerCase()) {
			if (this.$mobileHelper.isAndroidPlatform(lowerCasedPlatform)) {
				return APPBUILDER_ANDROID_COMPANION_APP_IDENTIFIER;
			} else if (this.$mobileHelper.isiOSPlatform(lowerCasedPlatform)) {
				return APPBUILDER_IOS_COMPANION_APP_IDENTIFIER;
			} else if (this.$mobileHelper.isWP8Platform(lowerCasedPlatform)) {
				return APPBUILDER_WP8_COMPANION_APP_IDENTIFIER;
			}
		} else if (lowerCasedFramework === TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()) {
			if (!this.$mobileHelper.isWP8Platform(lowerCasedPlatform)) {
				return NS_COMPANION_APP_IDENTIFIER;
			}
		}

		return null;
	}

	@exported("companionAppsService")
	public getAllCompanionAppIdentifiers(): IDictionary<IStringDictionary> {
		const platforms = [
			this.$devicePlatformsConstants.Android,
			this.$devicePlatformsConstants.iOS,
			this.$devicePlatformsConstants.WP8
		];

		const frameworks = [
			TARGET_FRAMEWORK_IDENTIFIERS.Cordova.toLowerCase(),
			TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()
		];

		const companionAppIdentifiers: IDictionary<IStringDictionary> = {};
		_.each(frameworks, framework => {
			const lowerCasedFramework = framework.toLowerCase();
			companionAppIdentifiers[lowerCasedFramework] = companionAppIdentifiers[lowerCasedFramework] || {};
			_.each(platforms, platform => {
				const lowerCasedPlatform = platform.toLowerCase();
				companionAppIdentifiers[lowerCasedFramework][lowerCasedPlatform] = this.getCompanionAppIdentifier(lowerCasedFramework, lowerCasedPlatform);
			});
		});

		return companionAppIdentifiers;
	}
}
$injector.register("companionAppsService", CompanionAppsService);
