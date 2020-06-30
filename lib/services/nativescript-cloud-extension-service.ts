import * as constants from "../constants";
import * as semver from "semver";

export class NativeScriptCloudExtensionService implements INativeScriptCloudExtensionService {
	constructor(private $extensibilityService: IExtensibilityService,
		private $logger: ILogger,
		private $packageInstallationManager: IPackageInstallationManager) { }

	public install(): Promise<IExtensionData> {
		if (!this.isInstalled()) {
			return this.$extensibilityService.installExtension(constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME);
		}

		this.$logger.info(`Extension ${constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME} is already installed.`);
	}

	public isInstalled(): boolean {
		return !!this.getExtensionData();
	}

	public async isLatestVersionInstalled(): Promise<boolean> {
		const extensionData = this.getExtensionData();
		if (extensionData) {
			const latestVersion = await this.$packageInstallationManager.getLatestVersion(constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME);
			return semver.eq(latestVersion, extensionData.version);
		}

		return false;
	}

	private getExtensionData(): IExtensionData {
		return _.find(this.$extensibilityService.getInstalledExtensionsData(), extensionData => extensionData.extensionName === constants.NATIVESCRIPT_CLOUD_EXTENSION_NAME);
	}
}
$injector.register("nativeScriptCloudExtensionService", NativeScriptCloudExtensionService);