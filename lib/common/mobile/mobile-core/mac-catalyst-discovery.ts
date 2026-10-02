import { DeviceDiscovery } from "./device-discovery";
import { MacCatalystDevice } from "../mac/mac-catalyst-device";
import { IInjector } from "../../definitions/yok";
import { IHostInfo } from "../../declarations";
import { injector } from "../../yok";

export class MacCatalystDeviceDiscovery extends DeviceDiscovery {
	private isDeviceAdded = false;

	constructor(
		private $injector: IInjector,
		private $hostInfo: IHostInfo,
		private $mobileHelper: Mobile.IMobileHelper,
	) {
		super();
	}

	public async startLookingForDevices(
		options?: Mobile.IDeviceLookingOptions,
	): Promise<void> {
		// Only one Mac to run on, and it is this machine.
		if (!this.$hostInfo.isDarwin || this.isDeviceAdded) {
			return;
		}

		if (
			!options ||
			!options.platform ||
			!this.$mobileHelper.isCatalystPlatform(options.platform)
		) {
			return;
		}

		this.addDevice(this.$injector.resolve(MacCatalystDevice));
		this.isDeviceAdded = true;
	}
}

injector.register("macCatalystDeviceDiscovery", MacCatalystDeviceDiscovery);
