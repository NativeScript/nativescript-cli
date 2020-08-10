import { EventEmitter } from "events";
import { DeviceDiscoveryEventNames } from "../../constants";
import { IDictionary } from "../../declarations";
import * as _ from 'lodash';
import { $injector } from "../../definitions/yok";

export class DeviceDiscovery extends EventEmitter implements Mobile.IDeviceDiscovery {
	private devices: IDictionary<Mobile.IDevice> = {};

	public async startLookingForDevices(): Promise<void> {
		return;
	}

	protected getDevice(deviceIdentifier: string) {
		const device = this.devices[deviceIdentifier];
		return device;
	}

	protected addDevice(device: Mobile.IDevice) {
		this.devices[device.deviceInfo.identifier] = device;
		this.raiseOnDeviceFound(device);
	}

	protected updateDeviceInfo(device: Mobile.IDevice) {
		const existingDevice = this.devices[device.deviceInfo.identifier];
		if (existingDevice) {
			_.assign(existingDevice.deviceInfo, device.deviceInfo);
		} else {
			this.devices[device.deviceInfo.identifier] = device;
		}

		this.raiseOnDeviceUpdated(device);
	}

	protected removeDevice(deviceIdentifier: string) {
		const device = this.devices[deviceIdentifier];
		if (!device) {
			return;
		}
		delete this.devices[deviceIdentifier];
		this.raiseOnDeviceLost(device);
	}

	private raiseOnDeviceFound(device: Mobile.IDevice) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_FOUND, device);
	}

	private raiseOnDeviceUpdated(device: Mobile.IDevice) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_UPDATED, device);
	}

	private raiseOnDeviceLost(device: Mobile.IDevice) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_LOST, device);
	}
}
$injector.register("deviceDiscovery", DeviceDiscovery);
