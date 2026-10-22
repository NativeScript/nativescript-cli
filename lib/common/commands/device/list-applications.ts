import * as _ from "lodash";
import { EOL } from "os";
import * as util from "util";
import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const listApplicationsCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const listApplicationsCommandDefinition = defineCommand({
	name: ["device|list-applications", "devices|list-applications"],
	description: "Lists the installed applications on all connected devices.",
	options: listApplicationsCommandOptions,
	params: "none",
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");
		const $logger = inject<ILogger>("logger");

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});
		const output: string[] = [];

		const action = async (device: Mobile.IDevice) => {
			const applications =
				await device.applicationManager.getInstalledApplications();
			output.push(
				util.format(
					"%s=====Installed applications on device with UDID '%s' are:",
					EOL,
					device.deviceInfo.identifier,
				),
			);
			_.each(applications, (applicationId: string) =>
				output.push(applicationId),
			);
		};
		await $devicesService.execute(action);

		$logger.info(output.join(EOL));
	},
});
