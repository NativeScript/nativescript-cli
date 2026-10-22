import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const uninstallApplicationCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const uninstallApplicationCommandDefinition = defineCommand({
	name: ["device|uninstall", "devices|uninstall"],
	description: "Uninstalls an application from all connected devices.",
	options: uninstallApplicationCommandOptions,
	params: [{ name: "appId" }],
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});

		const action = (device: Mobile.IDevice) =>
			device.applicationManager.uninstallApplication(context.args[0]);
		await $devicesService.execute(action);
	},
});
