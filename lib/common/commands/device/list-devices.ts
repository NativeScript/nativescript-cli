import { color } from "../../../color";
import { DeviceConnectionType } from "../../../constants";
import { IErrors } from "../../declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
} from "../../define-command";
import { inject, InjectionToken } from "../../di";
import { createTable, formatListOfNames } from "../../helpers";
import { registerCommandDefinition } from "../../services/command-definition-adapter";
import { injector } from "../../yok";

/** Which `$devicePlatformsConstants` entry this registration lists. */
const LIST_DEVICES_PLATFORM = new InjectionToken<"iOS" | "Android">(
	"listDevicesCommandPlatform",
);

const listDevicesCommandOptions = {
	availableDevices: booleanOption(),
	json: booleanOption(),
} satisfies CommandOptionsSchema;

export type ListDevicesCommandContext = CommandContext<
	typeof listDevicesCommandOptions
>;

export interface IListDevicesCommandServices {
	$devicesService: Mobile.IDevicesService;
	$emulatorHelper: Mobile.IEmulatorHelper;
	$errors: IErrors;
	$logger: ILogger;
	$mobileHelper: Mobile.IMobileHelper;
}

export function setupListDevicesCommand(): IListDevicesCommandServices {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$emulatorHelper: inject<Mobile.IEmulatorHelper>("emulatorHelper"),
		$errors: inject<IErrors>("errors"),
		$logger: inject<ILogger>("logger"),
		$mobileHelper: inject<Mobile.IMobileHelper>("mobileHelper"),
	};
}

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

export const listDevicesCommandDefinition = defineCommand({
	name: ["device|*list", "devices|*list"],
	description: "Lists the connected devices and emulators.",
	options: listDevicesCommandOptions,
	arguments: [{ name: "platform" }],
	setup: setupListDevicesCommand,
	run(context, services): Promise<void> {
		return runListDevicesCommand(context, services, context.args[0]);
	},
});

registerCommandDefinition(listDevicesCommandDefinition);

interface IListPlatformDevicesCommandServices extends IListDevicesCommandServices {
	platform: string;
}

export const listPlatformDevicesCommandDefinition = defineCommand({
	name: ["device|android", "devices|android"],
	description: "Lists the connected devices and emulators for one platform.",
	options: listDevicesCommandOptions,
	arguments: "none",
	setup(): IListPlatformDevicesCommandServices {
		const $devicePlatformsConstants = inject<Mobile.IDevicePlatformsConstants>(
			"devicePlatformsConstants",
		);

		return {
			...setupListDevicesCommand(),
			platform: $devicePlatformsConstants[inject(LIST_DEVICES_PLATFORM)],
		};
	},
	run(context, services): Promise<void> {
		return runListDevicesCommand(context, services, services.platform);
	},
});

const listDevicesPlatforms: [string[], "iOS" | "Android"][] = [
	[["device|android", "devices|android"], "Android"],
	[["device|ios", "devices|ios"], "iOS"],
];

for (const [name, platform] of listDevicesPlatforms) {
	registerCommandDefinition(
		{ ...listPlatformDevicesCommandDefinition, name },
		injector.createChild([
			{ provide: LIST_DEVICES_PLATFORM, useValue: platform },
		]),
	);
}
