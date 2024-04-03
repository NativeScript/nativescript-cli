import { DeviceDiscovery } from "./device-discovery";
import { IOSDevice } from "../ios/device/ios-device";
import { IInjector } from "../../definitions/yok";
import { injector } from "../../yok";

export class IOSDeviceDiscovery extends DeviceDiscovery {
	constructor(
		private $injector: IInjector,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $iosDeviceOperations: IIOSDeviceOperations,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants
	) {
		super();
	}

	public async startLookingForDevices(
		options?: Mobile.IDeviceLookingOptions
	): Promise<void> {
		this.$logger.trace("Options for ios-device-discovery", options);

		if (
			options &&
			options.platform &&
			(!this.$mobileHelper.isApplePlatform(options.platform) ||
				options.emulator)
		) {
			return;
		}

		if (this.$mobileHelper.isvisionOSPlatform(options.platform)) {
			// look for ios devices - same logic.
			options.platform = this.$devicePlatformsConstants.iOS;
		}

		await this.$iosDeviceOperations.startLookingForDevices(
			(deviceInfo: IOSDeviceLib.IDeviceActionInfo) => {
				const device = this.createDevice(deviceInfo);
				this.addDevice(device);
			},
			(deviceInfo: IOSDeviceLib.IDeviceActionInfo) => {
				const currentDevice = this.getDevice(deviceInfo.deviceId);
				if (currentDevice) {
					const device = this.createDevice(deviceInfo);
					this.updateDeviceInfo(device);
				} else {
					const device = this.createDevice(deviceInfo);
					this.addDevice(device);
				}
			},
			(deviceInfo: IOSDeviceLib.IDeviceActionInfo) => {
				this.removeDevice(deviceInfo.deviceId);
			},
			options
		);
	}

	private createDevice(
		deviceActionInfo: IOSDeviceLib.IDeviceActionInfo
	): IOSDevice {
		const device = this.$injector.resolve(IOSDevice, {
			deviceActionInfo: deviceActionInfo,
		});
		return device;
	}
}

injector.register("iOSDeviceDiscovery", IOSDeviceDiscovery);
