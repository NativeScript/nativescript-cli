import { color } from "../../../color";
import { DeviceConnectionType } from "../../../constants";
import { IErrors } from "../../declarations";
import {
	booleanOption,
	Command,
	CommandContext,
	CommandName,
	CommandOptionsSchema,
	defineCommand,
} from "../../define-command";
import { inject } from "../../di";
import { createTable, formatListOfNames } from "../../helpers";

const listDevicesCommandOptions = {
	availableDevices: booleanOption(),
	json: booleanOption(),
} satisfies CommandOptionsSchema;

export type ListDevicesCommandContext = CommandContext<
	typeof listDevicesCommandOptions
>;

export function setupListDevicesCommand() {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$emulatorHelper: inject<Mobile.IEmulatorHelper>("emulatorHelper"),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$mobileHelper: inject<Mobile.IMobileHelper>("mobileHelper"),
	};
}

export type IListDevicesCommandServices = ReturnType<
	typeof setupListDevicesCommand
>;

function printEmulators(
	services: IListDevicesCommandServices,
	emulators: Mobile.IDeviceInfo[],
): void {
	const table: any = createTable(
		[
			"Device Name",
			"Platform",
			"Version",
			"Device Identifier",
			"Image Identifier",
			// "Error Help",
		],
		[],
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

	services.$logger.info(table.toString());
}

export async function runListDevicesCommand(
	context: ListDevicesCommandContext,
	services: IListDevicesCommandServices,
	platformFilter: string,
): Promise<void> {
	const devices: {
		available?: any[];
		devices: any[];
	} = {
		devices: [],
	};

	if (context.options.availableDevices) {
		const platform =
			services.$mobileHelper.normalizePlatformName(platformFilter);
		if (!platform && platformFilter) {
			services.$errors.fail(
				`${platformFilter} is not a valid device platform. The valid platforms are ${formatListOfNames(
					services.$mobileHelper.platformNames,
				)}`,
			);
		}

		const availableEmulatorsOutput =
			await services.$devicesService.getEmulatorImages({ platform });
		const emulators =
			services.$emulatorHelper.getEmulatorsFromAvailableEmulatorsOutput(
				availableEmulatorsOutput,
			);
		devices.available = emulators;

		if (!context.options.json) {
			services.$logger.info(color.bold("\n Available emulators"));
			printEmulators(services, emulators);
		}
	}

	let index = 1;
	await services.$devicesService.initialize({
		platform: platformFilter,
		deviceId: null,
		skipInferPlatform: true,
		skipDeviceDetectionInterval: true,
		skipEmulatorStart: true,
		fullDiscovery: true,
	});

	if (!context.options.json) {
		services.$logger.info(color.bold("\n Connected devices & emulators"));
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
		[],
	);
	let action: (_device: Mobile.IDevice) => Promise<void>;
	if (context.options.json) {
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

	await services.$devicesService.execute(action, undefined, {
		allowNoDevices: true,
	});

	if (context.options.json) {
		return services.$logger.info(JSON.stringify(devices, null, 2));
	}

	if (table.length) {
		services.$logger.info(table.toString());
	}
}

export class ListDevicesCommand extends Command({
	name: ["device|*list", "devices|*list"],
	description: "Lists the connected devices and emulators.",
	options: listDevicesCommandOptions,
	arguments: [{ name: "platform" }],
}) {
	private services = setupListDevicesCommand();

	public run(): Promise<void> {
		return runListDevicesCommand(this.context, this.services, this.args[0]);
	}
}

// One definition per platform, generated: the object form is what a family of
// commands needs, where the class form fits a single named command.
const defineListPlatformDevicesCommand = <const TName extends CommandName>(
	name: TName,
	listedPlatform: "iOS" | "Android",
) =>
	defineCommand({
		name,
		description: "Lists the connected devices and emulators for one platform.",
		options: listDevicesCommandOptions,
		arguments: "none",
		setup() {
			const $devicePlatformsConstants =
				inject<Mobile.IDevicePlatformsConstants>("devicePlatformsConstants");

			return {
				...setupListDevicesCommand(),
				platform: $devicePlatformsConstants[listedPlatform],
			};
		},
		run(context, services): Promise<void> {
			return runListDevicesCommand(context, services, services.platform);
		},
	});

export const androidListDevicesCommand = defineListPlatformDevicesCommand(
	["device|android", "devices|android"],
	"Android",
);

export const iosListDevicesCommand = defineListPlatformDevicesCommand(
	["device|ios", "devices|ios"],
	"iOS",
);
