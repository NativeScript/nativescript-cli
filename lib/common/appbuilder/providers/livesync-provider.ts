import { AppBuilderLiveSyncProviderBase } from "./appbuilder-livesync-provider-base";

export class LiveSyncProvider extends AppBuilderLiveSyncProviderBase {
	constructor($androidLiveSyncServiceLocator: { factory: Function },
		$iosLiveSyncServiceLocator: { factory: Function }) {
		super($androidLiveSyncServiceLocator, $iosLiveSyncServiceLocator);
	}

	public async buildForDevice(device: Mobile.IDevice): Promise<string> {
		throw new Error(`Application is not installed on device ${device.deviceInfo.identifier}. Cannot LiveSync changes without installing the application before that.`);
	}
}
$injector.register("liveSyncProvider", LiveSyncProvider);
