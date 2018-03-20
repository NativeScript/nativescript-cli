import * as constants from "../constants";

export class NativescriptCloudExtensionService implements INativescriptCloudExtensionService {

	constructor(private $extensibilityService: IExtensibilityService,
		private $logger: ILogger) { }

	public install(): Promise<IExtensionData> {
		const installedExtensions = this.$extensibilityService.getInstalledExtensions() || {};
		if (!installedExtensions[constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME]) {
			return this.$extensibilityService.installExtension(constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME);
		}

		this.$logger.out(`Extension ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} is already installed.`);
	}
}
$injector.register("nativescriptCloudExtensionService", NativescriptCloudExtensionService);
