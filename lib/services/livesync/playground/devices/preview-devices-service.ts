import { Device } from "nativescript-preview-sdk";
import { EventEmitter } from "events";
import { DeviceDiscoveryEventNames } from "../../../../common/constants";

export class PreviewDevicesService extends EventEmitter implements IPreviewDevicesService {
	private connectedDevices: Device[] = [];

	public getConnectedDevices(): Device[] {
		return this.connectedDevices;
	}

	public updateConnectedDevices(devices: Device[]): void {
		_(devices)
			.reject(d => _.find(this.connectedDevices, device => d.id === device.id))
			.each(device => this.raiseDeviceFound(device));

		_(this.connectedDevices)
			.reject(d => _.find(devices, device => d.id === device.id))
			.each(device => this.raiseDeviceLost(device));
	}

	public getDeviceById(id: string): Device {
		return _.find(this.connectedDevices, { id });
	}

	public getDevicesForPlatform(platform: string): Device[] {
		return _.filter(this.connectedDevices, { platform: platform.toLowerCase() });
	}

	private raiseDeviceFound(device: Device) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_FOUND, device);
		this.connectedDevices.push(device);
	}

	private raiseDeviceLost(device: Device) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_LOST, device);
		_.remove(this.connectedDevices, d => d.id === device.id);
	}
}
$injector.register("previewDevicesService", PreviewDevicesService);
