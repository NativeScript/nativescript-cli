import { Device } from "nativescript-preview-sdk";
import { EventEmitter } from "events";
import {
	DeviceDiscoveryEventNames,
	DEVICE_LOG_EVENT_NAME,
} from "../../../../common/constants";
import { IDictionary } from "../../../../common/declarations";
import * as _ from "lodash";
import { injector } from "../../../../common/yok";

export class PreviewDevicesService
	extends EventEmitter
	implements IPreviewDevicesService {
	private connectedDevices: Device[] = [];
	private deviceLostTimers: IDictionary<NodeJS.Timer> = {};

	constructor(
		private $previewAppLogProvider: IPreviewAppLogProvider,
		private $previewAppPluginsService: IPreviewAppPluginsService
	) {
		super();

		this.initialize();
	}

	public getConnectedDevices(): Device[] {
		return this.connectedDevices;
	}

	public updateConnectedDevices(devices: Device[]): void {
		_(devices)
			.reject((d) =>
				_.some(this.connectedDevices, (device) => d.id === device.id)
			)
			.each((device) => this.raiseDeviceFound(device));

		_(this.connectedDevices)
			.reject((d) => _.some(devices, (device) => d.id === device.id))
			.each((device) => this.raiseDeviceLostAfterTimeout(device));
	}

	public getDeviceById(id: string): Device {
		return _.find(this.connectedDevices, { id });
	}

	public getDevicesForPlatform(platform: string): Device[] {
		return _.filter(this.connectedDevices, {
			platform: platform.toLowerCase(),
		});
	}

	public getPluginsUsageWarnings(
		data: IPreviewAppLiveSyncData,
		device: Device
	): Promise<string[]> {
		return this.$previewAppPluginsService.getPluginsUsageWarnings(data, device);
	}

	private initialize(): void {
		this.$previewAppLogProvider.on(
			DEVICE_LOG_EVENT_NAME,
			(deviceId: string, message: string) => {
				this.emit(DEVICE_LOG_EVENT_NAME, deviceId, message);
			}
		);
	}

	private raiseDeviceFound(device: Device) {
		if (this.deviceLostTimers[device.id]) {
			clearTimeout(this.deviceLostTimers[device.id]);
			this.deviceLostTimers[device.id] = null;
		}

		this.emit(DeviceDiscoveryEventNames.DEVICE_FOUND, device);
		this.connectedDevices.push(device);
	}

	private raiseDeviceLost(device: Device) {
		this.emit(DeviceDiscoveryEventNames.DEVICE_LOST, device);
		_.remove(this.connectedDevices, (d) => d.id === device.id);
	}

	private raiseDeviceLostAfterTimeout(device: Device) {
		if (!this.deviceLostTimers[device.id]) {
			const timeoutId = setTimeout(() => {
				this.raiseDeviceLost(device);
				clearTimeout(timeoutId);
			}, 5 * 1000);
			this.deviceLostTimers[device.id] = timeoutId;
		}
	}
}
injector.register("previewDevicesService", PreviewDevicesService);
