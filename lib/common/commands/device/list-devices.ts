import { color } from "../../../color";
import { DeviceConnectionType } from "../../../constants";
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

type ListDevicesCommandContext = CommandContext<
	typeof listDevicesCommandOptions
>;

function printEmulators(
	$logger: ILogger,
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

	$logger.info(table.toString());
}

async function listDevices(
	context: ListDevicesCommandContext,
	platformFilter: string,
): Promise<void> {
	const $devicesService =
		context.injector.get<Mobile.IDevicesService>("devicesService");
	const $emulatorHelper =
		context.injector.get<Mobile.IEmulatorHelper>("emulatorHelper");
	const $logger = context.injector.get<ILogger>("logger");
	const $mobileHelper =
		context.injector.get<Mobile.IMobileHelper>("mobileHelper");

	const devices: {
		available?: any[];
		devices: any[];
	} = {
		devices: [],
	};

	if (context.options.availableDevices) {
		const platform = $mobileHelper.normalizePlatformName(platformFilter);
		if (!platform && platformFilter) {
			context.fail(
				`${platformFilter} is not a valid device platform. The valid platforms are ${formatListOfNames(
					$mobileHelper.platformNames,
				)}`,
				{ help: false },
			);
		}

		const availableEmulatorsOutput = await $devicesService.getEmulatorImages({
			platform,
		});
		const emulators = $emulatorHelper.getEmulatorsFromAvailableEmulatorsOutput(
			availableEmulatorsOutput,
		);
		devices.available = emulators;

		if (!context.options.json) {
			$logger.info(color.bold("\n Available emulators"));
			printEmulators($logger, emulators);
		}
	}

	let index = 1;
	await $devicesService.initialize({
		platform: platformFilter,
		deviceId: null,
		skipInferPlatform: true,
		skipDeviceDetectionInterval: true,
		skipEmulatorStart: true,
		fullDiscovery: true,
	});

	if (!context.options.json) {
		$logger.info(color.bold("\n Connected devices & emulators"));
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

	await $devicesService.execute(action, undefined, {
		allowNoDevices: true,
	});

	if (context.options.json) {
		return $logger.info(JSON.stringify(devices, null, 2));
	}

	if (table.length) {
		$logger.info(table.toString());
	}
}

export class ListDevicesCommand extends Command({
	name: ["device|*list", "devices|*list"],
	description: "Lists the connected devices and emulators.",
	options: listDevicesCommandOptions,
	params: [{ name: "platform" }],
}) {
	public run(): Promise<void> {
		return listDevices(this.context, this.args[0]);
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
		params: "none",
		run(context): Promise<void> {
			const platform = inject<Mobile.IDevicePlatformsConstants>(
				"devicePlatformsConstants",
			)[listedPlatform];

			return listDevices(context, platform);
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
