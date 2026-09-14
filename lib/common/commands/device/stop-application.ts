import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const stopApplicationOnDeviceCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const stopApplicationOnDeviceCommandDefinition = defineCommand({
	name: ["device|stop", "devices|stop"],
	description: "Stops the selected application on a connected device.",
	options: stopApplicationOnDeviceCommandOptions,
	arguments: [{ name: "appId" }, { name: "platform" }, { name: "projectName" }],
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");

		await $devicesService.initialize({
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
		await $devicesService.execute(action);
	},
});
