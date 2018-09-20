import { EventEmitter } from "events";
import { DeviceDiscoveryEventNames } from "../../constants";

export class DeviceDiscovery extends EventEmitter implements Mobile.IDeviceDiscovery {
	private devices: IDictionary<Mobile.IDevice> = {};

	public addDevice(device: Mobile.IDevice) {
		this.devices[device.deviceInfo.identifier] = device;
		this.raiseOnDeviceFound(device);
	}

	public removeDevice(deviceIdentifier: string) {
		const device = this.devices[deviceIdentifier];
		if (!device) {
			return;
		}
		delete this.devices[deviceIdentifier];
		this.raiseOnDeviceLost(device);
	}

	public async startLookingForDevices(): Promise<void> {
		return;
	}

	private raiseOnDeviceFound(device: Mobile.IDevice) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_FOUND, device);
	}

	private raiseOnDeviceLost(device: Mobile.IDevice) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_LOST, device);
	}
}
$injector.register("deviceDiscovery", DeviceDiscovery);
