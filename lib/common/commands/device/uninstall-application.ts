import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const uninstallApplicationCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export type UninstallApplicationCommandContext = CommandContext<
	typeof uninstallApplicationCommandOptions
>;

export interface IUninstallApplicationCommandServices {
	$devicesService: Mobile.IDevicesService;
}

export function setupUninstallApplicationCommand(): IUninstallApplicationCommandServices {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
	};
}

export async function runUninstallApplicationCommand(
	context: UninstallApplicationCommandContext,
	services: IUninstallApplicationCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
		deviceId: context.options.device,
		skipInferPlatform: true,
	});

	const action = (device: Mobile.IDevice) =>
		device.applicationManager.uninstallApplication(context.args[0]);
	await services.$devicesService.execute(action);
}

export const uninstallApplicationCommandDefinition = defineCommand({
	name: ["device|uninstall", "devices|uninstall"],
	description: "Uninstalls an application from all connected devices.",
	options: uninstallApplicationCommandOptions,
	arguments: [{ name: "appId" }],
	setup: setupUninstallApplicationCommand,
	run: runUninstallApplicationCommand,
});
