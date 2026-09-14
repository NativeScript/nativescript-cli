import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const stopApplicationOnDeviceCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export type StopApplicationOnDeviceCommandContext = CommandContext<
	typeof stopApplicationOnDeviceCommandOptions
>;

export interface IStopApplicationOnDeviceCommandServices {
	$devicesService: Mobile.IDevicesService;
}

export function setupStopApplicationOnDeviceCommand(): IStopApplicationOnDeviceCommandServices {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
	};
}

export async function runStopApplicationOnDeviceCommand(
	context: StopApplicationOnDeviceCommandContext,
	services: IStopApplicationOnDeviceCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
		deviceId: context.options.device,
		skipInferPlatform: true,
		platform: context.args[1],
	});

	const action = (device: Mobile.IDevice) =>
		device.applicationManager.stopApplication({
			appId: context.args[0],
			projectName: context.args[2],
			projectDir: null,
		});
	await services.$devicesService.execute(action);
}

export const stopApplicationOnDeviceCommandDefinition = defineCommand({
	name: ["device|stop", "devices|stop"],
	description: "Stops the selected application on a connected device.",
	options: stopApplicationOnDeviceCommandOptions,
	arguments: [{ name: "appId" }, { name: "platform" }, { name: "projectName" }],
	setup: setupStopApplicationOnDeviceCommand,
	run: runStopApplicationOnDeviceCommand,
});
