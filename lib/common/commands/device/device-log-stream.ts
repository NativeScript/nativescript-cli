import { ICleanupService } from "../../../definitions/cleanup-service";
import { CommandsService } from "../../contracts/commands-service";
import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const NOT_SPECIFIED_DEVICE_ERROR_MESSAGE =
	"More than one device found. Specify device explicitly.";

const openDeviceLogStreamCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const openDeviceLogStreamCommandDefinition = defineCommand({
	name: ["device|log", "devices|log"],
	description: "Opens the device log stream for a connected device.",
	options: openDeviceLogStreamCommandOptions,
	params: "none",
	// The log stream is the command's whole output, so neither the simulator log
	// provider nor the cleanup process may be torn down while it is open. In
	// setup, so the flags are set at the point in the invocation they always were.
	setup(): void {
		inject<Mobile.IiOSSimulatorLogProvider>(
			"iOSSimulatorLogProvider",
		).setShouldDispose(false);
		inject<ICleanupService>("cleanupService").setShouldDispose(false);
	},
	async run(context): Promise<void> {
		const $commandsService = inject(CommandsService);
		const $deviceLogProvider =
			inject<Mobile.IDeviceLogProvider>("deviceLogProvider");
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");
		const $loggingLevels = inject<Mobile.ILoggingLevels>("loggingLevels");

		$deviceLogProvider.setLogLevel($loggingLevels.full);

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});

		if ($devicesService.deviceCount > 1) {
			await $commandsService.runCommand("device");
			context.fail(NOT_SPECIFIED_DEVICE_ERROR_MESSAGE);
		}

		const action = (device: Mobile.IiOSDevice) => device.openDeviceLogStream();
		await $devicesService.execute(action);
	},
});
