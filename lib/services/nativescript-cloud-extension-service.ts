import * as constants from "../constants";

export class NativescriptCloudExtensionService implements INativescriptCloudExtensionService {

	constructor(private $extensibilityService: IExtensibilityService) { }

	public install(): Promise<IExtensionData> {
		const installedExtensions = this.$extensibilityService.getInstalledExtensions();
		if (!installedExtensions[constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME]) {
			return this.$extensibilityService.installExtension(constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME);
		}
	}
}
$injector.register("nativescriptCloudExtensionService", NativescriptCloudExtensionService);
