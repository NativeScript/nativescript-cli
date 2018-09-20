import * as net from "net";
import { connectEventuallyUntilTimeout } from "../../../helpers";
import { APPLE_VENDOR_NAME, DeviceTypes, RUNNING_EMULATOR_STATUS, NOT_RUNNING_EMULATOR_STATUS } from "../../../constants";

class IosEmulatorServices implements Mobile.IiOSSimulatorService {
	private static DEFAULT_TIMEOUT = 10000;

	constructor(private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $mobileHelper: Mobile.IMobileHelper) { }

	public async startEmulator(options: Mobile.IStartEmulatorOptions): Promise<Mobile.IStartEmulatorOutput> {
		let error = null;

		try {
			await this.$iOSSimResolver.iOSSim.startSimulator({
				device: options.imageIdentifier || options.emulatorIdOrName,
				state: "None",
				sdkVersion: options.sdk
			});
		} catch (err) {
			error = err && err.message;
		}

		return {
			errors: error ? [error] : []
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

	public async getRunningEmulatorImageIdentifier(emulatorId: string): Promise<string> {
		return "";
	}

	public runApplicationOnEmulator(app: string, emulatorOptions?: Mobile.IRunApplicationOnEmulatorOptions): Promise<any> {
		emulatorOptions = emulatorOptions || {};

		if (emulatorOptions.availableDevices) {
			return this.$iOSSimResolver.iOSSim.printDeviceTypes();
		}

		const options: any = {
			sdkVersion: emulatorOptions.sdk,
			device: emulatorOptions.device,
			args: emulatorOptions.args,
			waitForDebugger: emulatorOptions.waitForDebugger,
			skipInstall: emulatorOptions.skipInstall
		};

		if (emulatorOptions.justlaunch) {
			options.exit = true;
		}

		return this.$iOSSimResolver.iOSSim.launchApplication(app, emulatorOptions.appId, options);
	}

	public async postDarwinNotification(notification: string, deviceId: string): Promise<void> {
		return this.$iOSSimResolver.iOSSim.sendNotification(notification, deviceId);
	}

	public async connectToPort(data: Mobile.IConnectToPortData): Promise<net.Socket> {
		try {
			const socket = await connectEventuallyUntilTimeout(async () => net.connect(data.port), data.timeout || IosEmulatorServices.DEFAULT_TIMEOUT);
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
			devices =  _(output.devices)
				.map(simDevice => this.convertSimDeviceToDeviceInfo(simDevice))
				.sortBy(deviceInfo => deviceInfo.version)
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

	private async tryGetiOSSimDevices(): Promise<{devices: Mobile.IiSimDevice[], error: string}> {
		let devices: Mobile.IiSimDevice[] = [];
		let error: string = null;

		try {
			devices = await this.$iOSSimResolver.iOSSim.getDevices();
		} catch (err) {
			error = err;
		}

		return { devices, error };
	}

	private convertSimDeviceToDeviceInfo(simDevice: Mobile.IiSimDevice): Mobile.IDeviceInfo {
		return {
			imageIdentifier: simDevice.id,
			identifier: simDevice.id,
			displayName: simDevice.name,
			model: simDevice.name,
			version: simDevice.runtimeVersion,
			vendor: APPLE_VENDOR_NAME,
			status: simDevice.state && simDevice.state.toLowerCase() === "booted" ? RUNNING_EMULATOR_STATUS : NOT_RUNNING_EMULATOR_STATUS,
			errorHelp: null,
			isTablet: this.$mobileHelper.isiOSTablet(simDevice.name),
			type: DeviceTypes.Emulator,
			platform: this.$devicePlatformsConstants.iOS
		};
	}
}
$injector.register("iOSEmulatorServices", IosEmulatorServices);
