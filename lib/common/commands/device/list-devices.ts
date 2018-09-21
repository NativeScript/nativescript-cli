import { createTable, formatListOfNames } from "../../helpers";

export class ListDevicesCommand implements ICommand {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $emulatorHelper: Mobile.IEmulatorHelper,
		private $logger: ILogger,
		private $stringParameter: ICommandParameter,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: ICommonOptions) { }

	public allowedParameters = [this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		if (this.$options.availableDevices) {
			const platform = this.$mobileHelper.normalizePlatformName(args[0]);
			if (!platform && args[0]) {
				this.$errors.failWithoutHelp(`${args[0]} is not a valid device platform. The valid platforms are ${formatListOfNames(this.$mobileHelper.platformNames)}`);
			}

			const availableEmulatorsOutput = await this.$devicesService.getEmulatorImages({ platform });
			const emulators = this.$emulatorHelper.getEmulatorsFromAvailableEmulatorsOutput(availableEmulatorsOutput);
			this.printEmulators("\nAvailable emulators", emulators);
		}

		this.$logger.out("\nConnected devices & emulators");
		let index = 1;
		await this.$devicesService.initialize({ platform: args[0], deviceId: null, skipInferPlatform: true, skipDeviceDetectionInterval: true, skipEmulatorStart: true });

		const table: any = createTable(["#", "Device Name", "Platform", "Device Identifier", "Type", "Status"], []);
		let action: (_device: Mobile.IDevice) => Promise<void>;
		if (this.$options.json) {
			this.$logger.setLevel("ERROR");
			action = async (device) => {
				this.$logger.out(JSON.stringify(device.deviceInfo));
			};
		} else {
			action = async (device) => {
				table.push([(index++).toString(), device.deviceInfo.displayName || '',
				device.deviceInfo.platform || '', device.deviceInfo.identifier || '',
				device.deviceInfo.type || '', device.deviceInfo.status || '']);
			};
		}

		await this.$devicesService.execute(action, undefined, { allowNoDevices: true });

		if (!this.$options.json && table.length) {
			this.$logger.out(table.toString());
		}
	}

	private printEmulators(title: string, emulators: Mobile.IDeviceInfo[]) {
		this.$logger.out(title);
		const table: any = createTable(["Device Name", "Platform", "Version", "Device Identifier", "Image Identifier", "Error Help"], []);
		for (const info of emulators) {
			table.push([info.displayName, info.platform, info.version, info.identifier || "", info.imageIdentifier || "", info.errorHelp || ""]);
		}

		this.$logger.out(table.toString());
	}
}

$injector.registerCommand(["device|*list", "devices|*list"], ListDevicesCommand);

class ListAndroidDevicesCommand implements ICommand {
	constructor(private $injector: IInjector,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		const listDevicesCommand: ICommand = this.$injector.resolve(ListDevicesCommand);
		const platform = this.$devicePlatformsConstants.Android;
		await listDevicesCommand.execute([platform]);
	}
}

$injector.registerCommand(["device|android", "devices|android"], ListAndroidDevicesCommand);

class ListiOSDevicesCommand implements ICommand {
	constructor(private $injector: IInjector,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		const listDevicesCommand: ICommand = this.$injector.resolve(ListDevicesCommand);
		const platform = this.$devicePlatformsConstants.iOS;
		await listDevicesCommand.execute([platform]);
	}
}

$injector.registerCommand(["device|ios", "devices|ios"], ListiOSDevicesCommand);
