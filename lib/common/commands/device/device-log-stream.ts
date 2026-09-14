import { ICleanupService } from "../../../definitions/cleanup-service";
import { IErrors } from "../../declarations";
import {
	CommandContext,
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

export type OpenDeviceLogStreamCommandContext = CommandContext<
	typeof openDeviceLogStreamCommandOptions
>;

export function setupOpenDeviceLogStreamCommand() {
	// The log stream is the command's whole output, so neither the simulator log
	// provider nor the cleanup process may be torn down while it is open. The
	// legacy command did this from its constructor, which ran before anything
	// looked at the command line.
	inject<Mobile.IiOSSimulatorLogProvider>(
		"iOSSimulatorLogProvider",
	).setShouldDispose(false);
	inject<ICleanupService>("cleanupService").setShouldDispose(false);

	return {
		$commandsService: inject<ICommandsService>("commandsService"),
		$deviceLogProvider: inject<Mobile.IDeviceLogProvider>("deviceLogProvider"),
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$errors: inject<IErrors>("errors"),
		$loggingLevels: inject<Mobile.ILoggingLevels>("loggingLevels"),
	};
}

export type IOpenDeviceLogStreamCommandServices = ReturnType<
	typeof setupOpenDeviceLogStreamCommand
>;

export async function runOpenDeviceLogStreamCommand(
	context: OpenDeviceLogStreamCommandContext,
	services: IOpenDeviceLogStreamCommandServices,
): Promise<void> {
	services.$deviceLogProvider.setLogLevel(services.$loggingLevels.full);

	await services.$devicesService.initialize({
		deviceId: context.options.device,
		skipInferPlatform: true,
	});

	if (services.$devicesService.deviceCount > 1) {
		await services.$commandsService.tryExecuteCommand("device", []);
		services.$errors.failWithHelp(NOT_SPECIFIED_DEVICE_ERROR_MESSAGE);
	}

	const action = (device: Mobile.IiOSDevice) => device.openDeviceLogStream();
	await services.$devicesService.execute(action);
}

export const openDeviceLogStreamCommandDefinition = defineCommand({
	name: ["device|log", "devices|log"],
	description: "Opens the device log stream for a connected device.",
	options: openDeviceLogStreamCommandOptions,
	arguments: "none",
	setup: setupOpenDeviceLogStreamCommand,
	run: runOpenDeviceLogStreamCommand,
});
