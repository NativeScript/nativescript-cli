import * as querystring from "querystring";
import { DeviceAppDataBase } from "./../../mobile/device-app-data/device-app-data-base";

export abstract class AppBuilderDeviceAppDataBase extends DeviceAppDataBase implements ILiveSyncDeviceAppData {
	constructor(_appIdentifier: string,
		public device: Mobile.IDevice,
		public platform: string,
		private $deployHelper: IDeployHelper) {
		super(_appIdentifier);
	}

	public abstract getDeviceProjectRootPath(): Promise<string>;

	public get liveSyncFormat(): string {
		return null;
	}

	public encodeLiveSyncHostUri(hostUri: string): string {
		return querystring.escape(hostUri);
	}

	public getLiveSyncNotSupportedError(): string {
		return `You can't LiveSync on device with id ${this.device.deviceInfo.identifier}! Deploy the app with LiveSync enabled and wait for the initial start up before LiveSyncing.`;
	}

	public async isLiveSyncSupported(): Promise<boolean> {
		const isApplicationInstalled = await this.device.applicationManager.isApplicationInstalled(this.appIdentifier);

		if (!isApplicationInstalled) {
			await this.$deployHelper.deploy(this.platform.toString());
			// Update cache of installed apps
			await this.device.applicationManager.checkForApplicationUpdates();
		}

		return await this.device.applicationManager.isLiveSyncSupported(this.appIdentifier);
	}
}
