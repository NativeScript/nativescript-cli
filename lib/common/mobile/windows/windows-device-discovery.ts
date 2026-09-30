import { DeviceDiscovery } from "../mobile-core/device-discovery";
import { WindowsDevice } from "./windows-device";
import { IInjector } from "../../definitions/yok";
import { injector } from "../../yok";

export class WindowsDeviceDiscovery
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
			!this.$mobileHelper.isWindowsPlatform(options.platform)
		) {
			return;
		}

		if (!this._deviceAdded) {
			this._deviceAdded = true;
			const device = this.$injector.resolve<WindowsDevice>(WindowsDevice);
			this.addDevice(device);
		}
	}
}
injector.register("windowsDeviceDiscovery", WindowsDeviceDiscovery);
