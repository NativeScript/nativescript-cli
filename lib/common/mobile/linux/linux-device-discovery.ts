import { DeviceDiscovery } from "../mobile-core/device-discovery";
import { LinuxDevice } from "./linux-device";
import { IInjector } from "../../definitions/yok";
import { injector } from "../../yok";

export class LinuxDeviceDiscovery
	extends DeviceDiscovery
	implements Mobile.IDeviceDiscovery
{
	private _deviceAdded = false;

	constructor(
		private $injector: IInjector,
		private $mobileHelper: Mobile.IMobileHelper,
	) {
		super();
	}

	public async startLookingForDevices(
		options?: Mobile.IDeviceLookingOptions,
	): Promise<void> {
		if (
			options?.platform &&
			!this.$mobileHelper.isLinuxPlatform(options.platform)
		) {
			return;
		}

		if (!this._deviceAdded) {
			this._deviceAdded = true;
			const device = this.$injector.resolve<LinuxDevice>(LinuxDevice);
			this.addDevice(device);
		}
	}
}
injector.register("linuxDeviceDiscovery", LinuxDeviceDiscovery);
