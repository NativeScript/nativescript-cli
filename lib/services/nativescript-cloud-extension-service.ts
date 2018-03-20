import * as constants from "../constants";

export class NativescriptCloudExtensionService implements INativescriptCloudExtensionService {

	constructor(private $extensibilityService: IExtensibilityService,
		private $logger: ILogger) { }

	public install(): Promise<IExtensionData> {
		if (!this.isInstalled()) {
			return this.$extensibilityService.installExtension(constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME);
		}

		this.$logger.out(`Extension ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} is already installed.`);
	}

	public isInstalled(): boolean {
		return !!this.getInstalledExtensions()[constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME];
	}

	private getInstalledExtensions(): IStringDictionary {
		return this.$extensibilityService.getInstalledExtensions() || {};
	}
}
$injector.register("nativescriptCloudExtensionService", NativescriptCloudExtensionService);
