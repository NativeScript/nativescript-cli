import { IErrors } from "../../declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const runApplicationOnDeviceCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export type RunApplicationOnDeviceCommandContext = CommandContext<
	typeof runApplicationOnDeviceCommandOptions
>;

export function setupRunApplicationOnDeviceCommand() {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$errors: inject<IErrors>("errors"),
		$staticConfig: inject<Config.IStaticConfig>("staticConfig"),
	};
}

export type IRunApplicationOnDeviceCommandServices = ReturnType<
	typeof setupRunApplicationOnDeviceCommand
>;

export async function runRunApplicationOnDeviceCommand(
	context: RunApplicationOnDeviceCommandContext,
	services: IRunApplicationOnDeviceCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
		deviceId: context.options.device,
		skipInferPlatform: true,
	});

	if (services.$devicesService.deviceCount > 1) {
		services.$errors.failWithHelp(
			"More than one device found. Specify device explicitly with --device option. To discover device ID, use $%s device command.",
			services.$staticConfig.CLIENT_NAME.toLowerCase(),
		);
	}

	await services.$devicesService.execute(
		async (device: Mobile.IDevice) =>
			await device.applicationManager.startApplication({
				appId: context.args[0],
				projectName: context.args[1],
				projectDir: null,
			}),
	);
}

export const runApplicationOnDeviceCommandDefinition = defineCommand({
	name: ["device|run", "devices|run"],
	description: "Runs the selected application on a connected device.",
	options: runApplicationOnDeviceCommandOptions,
	arguments: [{ name: "appId" }, { name: "projectName" }],
	setup: setupRunApplicationOnDeviceCommand,
	run: runRunApplicationOnDeviceCommand,
});
