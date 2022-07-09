import * as net from "net";
import * as _ from "lodash";
import {
	APPLE_VENDOR_NAME,
	DeviceTypes,
	RUNNING_EMULATOR_STATUS,
	NOT_RUNNING_EMULATOR_STATUS,
} from "../../../constants";
import { DeviceConnectionType } from "../../../../constants";
import { injector } from "../../../yok";

class IosEmulatorServices implements Mobile.IiOSSimulatorService {
	constructor(
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $mobileHelper: Mobile.IMobileHelper
	) {}

	public async startEmulator(
		options: Mobile.IStartEmulatorOptions
	): Promise<Mobile.IStartEmulatorOutput> {
		let error = null;

		try {
			await this.$iOSSimResolver.iOSSim.startSimulator({
				device: options.imageIdentifier || options.emulatorIdOrName,
				state: "None",
				sdkVersion: options.sdk,
			});
		} catch (err) {
			error = err && err.message;
		}

		return {
			errors: error ? [error] : [],
		};
	}

	public async getRunningEmulator(): Promise<Mobile.IDeviceInfo> {
		return null;
	}

	public async getRunningEmulatorIds(): Promise<string[]> {
		return [];
	}

	public async getRunningEmulatorName(): Promise<string> {
		return "";
	}

	public async getRunningEmulatorImageIdentifier(
		emulatorId: string
	): Promise<string> {
		return "";
	}

	public async postDarwinNotification(
		notification: string,
		deviceId: string
	): Promise<void> {
		return this.$iOSSimResolver.iOSSim.sendNotification(notification, deviceId);
	}

	public async connectToPort(
		data: Mobile.IConnectToPortData
	): Promise<net.Socket> {
		try {
			// node v17+ resolves localhost to ::1 (ipv6) instead of 127.0.0.1 (ipv4)
			// so we explicitly pass ipv4
			const socket = net.connect(data.port, "127.0.0.1");
			return socket;
		} catch (e) {
			this.$logger.debug(e);
		}
	}

	public async getEmulatorImages(): Promise<Mobile.IEmulatorImagesOutput> {
		let devices: Mobile.IDeviceInfo[] = [];
		const errors: string[] = [];

		const output = await this.tryGetiOSSimDevices();
		if (output.devices && output.devices.length) {
			devices = _(output.devices)
				.map((simDevice) => this.convertSimDeviceToDeviceInfo(simDevice))
				.sortBy((deviceInfo) => deviceInfo.version)
				.value();
		}

		if (output.error) {
			errors.push(output.error);
		}

		return { devices, errors };
	}

	public async getRunningEmulators(): Promise<Mobile.IDeviceInfo[]> {
		return [];
	}

	private async tryGetiOSSimDevices(): Promise<{
		devices: Mobile.IiSimDevice[];
		error: string;
	}> {
		let devices: Mobile.IiSimDevice[] = [];
		let error: string = null;

		try {
			devices = await this.$iOSSimResolver.iOSSim.getDevices();
		} catch (err) {
			error = err;
		}

		return { devices, error };
	}

	private convertSimDeviceToDeviceInfo(
		simDevice: Mobile.IiSimDevice
	): Mobile.IDeviceInfo {
		return {
			imageIdentifier: simDevice.id,
			identifier: simDevice.id,
			displayName: simDevice.name,
			model: simDevice.name,
			version: simDevice.runtimeVersion,
			vendor: APPLE_VENDOR_NAME,
			status:
				simDevice.state && simDevice.state.toLowerCase() === "booted"
					? RUNNING_EMULATOR_STATUS
					: NOT_RUNNING_EMULATOR_STATUS,
			errorHelp: null,
			isTablet: this.$mobileHelper.isiOSTablet(simDevice.name),
			type: DeviceTypes.Emulator,
			connectionTypes: [DeviceConnectionType.Local],
			platform: this.$devicePlatformsConstants.iOS,
		};
	}
}
injector.register("iOSEmulatorServices", IosEmulatorServices);
