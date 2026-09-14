import * as _ from "lodash";
import { EOL } from "os";
import * as util from "util";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";
import { registerCommand } from "../../services/command-definition-adapter";

const listApplicationsCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export type ListApplicationsCommandContext = CommandContext<
	typeof listApplicationsCommandOptions
>;

export interface IListApplicationsCommandServices {
	$devicesService: Mobile.IDevicesService;
	$logger: ILogger;
}

export function setupListApplicationsCommand(): IListApplicationsCommandServices {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$logger: inject<ILogger>("logger"),
	};
}

export async function runListApplicationsCommand(
	context: ListApplicationsCommandContext,
	services: IListApplicationsCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
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
		_.each(applications, (applicationId: string) => output.push(applicationId));
	};
	await services.$devicesService.execute(action);

	services.$logger.info(output.join(EOL));
}

export const listApplicationsCommandDefinition = defineCommand({
	name: ["device|list-applications", "devices|list-applications"],
	description: "Lists the installed applications on all connected devices.",
	options: listApplicationsCommandOptions,
	arguments: "none",
	setup: setupListApplicationsCommand,
	run: runListApplicationsCommand,
});

registerCommand(listApplicationsCommandDefinition);
