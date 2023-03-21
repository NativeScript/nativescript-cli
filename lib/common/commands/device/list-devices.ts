import { createTable, formatListOfNames } from "../../helpers";
import { DeviceConnectionType } from "../../../constants";
import { IOptions } from "../../../declarations";
import { ICommand, ICommandParameter } from "../../definitions/commands";
import { IErrors } from "../../declarations";
import { IInjector } from "../../definitions/yok";
import { injector } from "../../yok";
import { color } from "../../../color";

export class ListDevicesCommand implements ICommand {
	constructor(
		private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $emulatorHelper: Mobile.IEmulatorHelper,
		private $logger: ILogger,
		private $stringParameter: ICommandParameter,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions
	) {}

	public allowedParameters = [this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		const devices: {
			available?: any[];
			devices: any[];
		} = {
			devices: [],
		};

		if (this.$options.availableDevices) {
			const platform = this.$mobileHelper.normalizePlatformName(args[0]);
			if (!platform && args[0]) {
				this.$errors.fail(
					`${
						args[0]
					} is not a valid device platform. The valid platforms are ${formatListOfNames(
						this.$mobileHelper.platformNames
					)}`
				);
			}

			const availableEmulatorsOutput = await this.$devicesService.getEmulatorImages(
				{ platform }
			);
			const emulators = this.$emulatorHelper.getEmulatorsFromAvailableEmulatorsOutput(
				availableEmulatorsOutput
			);
			devices.available = emulators;

			if (!this.$options.json) {
				this.$logger.info(color.bold("\n Available emulators"));
				this.printEmulators(emulators);
			}
		}

		let index = 1;
		await this.$devicesService.initialize({
			platform: args[0],
			deviceId: null,
			skipInferPlatform: true,
			skipDeviceDetectionInterval: true,
			skipEmulatorStart: true,
			fullDiscovery: true,
		});

		if (!this.$options.json) {
			this.$logger.info(color.bold("\n Connected devices & emulators"));
		}

		const table: any = createTable(
			[
				"#",
				"Device Name",
				"Platform",
				"Device Identifier",
				"Type",
				"Status",
				"Connection Type",
			],
			[]
		);
		let action: (_device: Mobile.IDevice) => Promise<void>;
		if (this.$options.json) {
			action = async (device) => {
				devices.devices.push(device.deviceInfo);
			};
		} else {
			action = async (device) => {
				table.push([
					(index++).toString(),
					device.deviceInfo.displayName || "",
					device.deviceInfo.platform || "",
					device.deviceInfo.identifier || "",
					device.deviceInfo.type || "",
					device.deviceInfo.status || "",
					device.deviceInfo.connectionTypes
						.map((type) => DeviceConnectionType[type])
						.join(", "),
				]);
			};
		}

		await this.$devicesService.execute(action, undefined, {
			allowNoDevices: true,
		});

		if (this.$options.json) {
			return this.$logger.info(JSON.stringify(devices, null, 2));
		}

		if (table.length) {
			this.$logger.info(table.toString());
		}
	}

	private printEmulators(emulators: Mobile.IDeviceInfo[]) {
		const table: any = createTable(
			[
				"Device Name",
				"Platform",
				"Version",
				"Device Identifier",
				"Image Identifier",
				// "Error Help",
			],
			[]
		);
		for (const info of emulators) {
			table.push([
				info.displayName,
				info.platform,
				info.version,
				info.identifier || "",
				info.imageIdentifier || "",
				// info.errorHelp || "",
			]);
		}

		this.$logger.info(table.toString());
	}
}

injector.registerCommand(["device|*list", "devices|*list"], ListDevicesCommand);

class ListAndroidDevicesCommand implements ICommand {
	constructor(
		private $injector: IInjector,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants
	) {}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		const listDevicesCommand: ICommand = this.$injector.resolve(
			ListDevicesCommand
		);
		const platform = this.$devicePlatformsConstants.Android;
		await listDevicesCommand.execute([platform]);
	}
}

injector.registerCommand(
	["device|android", "devices|android"],
	ListAndroidDevicesCommand
);

class ListiOSDevicesCommand implements ICommand {
	constructor(
		private $injector: IInjector,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants
	) {}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		const listDevicesCommand: ICommand = this.$injector.resolve(
			ListDevicesCommand
		);
		const platform = this.$devicePlatformsConstants.iOS;
		await listDevicesCommand.execute([platform]);
	}
}

injector.registerCommand(["device|ios", "devices|ios"], ListiOSDevicesCommand);
