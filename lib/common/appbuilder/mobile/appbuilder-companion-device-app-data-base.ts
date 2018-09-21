import { AppBuilderDeviceAppDataBase } from "./appbuilder-device-app-data-base";

export abstract class AppBuilderCompanionDeviceAppDataBase extends AppBuilderDeviceAppDataBase {
	public isLiveSyncSupported(): Promise<boolean> {
		return this.device.applicationManager.isApplicationInstalled(this.appIdentifier);
	}

	public getLiveSyncNotSupportedError(): string {
		return `Cannot LiveSync changes to the ${this.getCompanionAppName()}. The ${this.getCompanionAppName()} is not installed on ${this.device.deviceInfo.identifier}.`;
	}

	protected abstract getCompanionAppName(): string;
}
