import { IErrors } from "../../declarations";
import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const runApplicationOnDeviceCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const runApplicationOnDeviceCommandDefinition = defineCommand({
	name: ["device|run", "devices|run"],
	description: "Runs the selected application on a connected device.",
	options: runApplicationOnDeviceCommandOptions,
	params: [{ name: "appId" }, { name: "projectName" }],
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");
		const $errors = inject<IErrors>("errors");
		const $staticConfig = inject<Config.IStaticConfig>("staticConfig");

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});

		if ($devicesService.deviceCount > 1) {
			$errors.failWithHelp(
				"More than one device found. Specify device explicitly with --device option. To discover device ID, use $%s device command.",
				$staticConfig.CLIENT_NAME.toLowerCase(),
			);
		}

		await $devicesService.execute(
			async (device: Mobile.IDevice) =>
				await device.applicationManager.startApplication({
					appId: context.args[0],
					projectName: context.args[1],
					projectDir: null,
				}),
		);
	},
});
