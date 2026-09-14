import { IProjectData } from "../../../definitions/project";
import { IErrors } from "../../declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";
import { registerCommand } from "../../services/command-definition-adapter";

const putFileCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export type PutFileCommandContext = CommandContext<
	typeof putFileCommandOptions
>;

export interface IPutFileCommandServices {
	$devicesService: Mobile.IDevicesService;
	$errors: IErrors;
	$projectData: IProjectData;
}

export function setupPutFileCommand(): IPutFileCommandServices {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$errors: inject<IErrors>("errors"),
		$projectData: inject<IProjectData>("projectData"),
	};
}

export async function runPutFileCommand(
	context: PutFileCommandContext,
	services: IPutFileCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
		deviceId: context.options.device,
		skipInferPlatform: true,
	});
	let appIdentifier = context.args[2];

	if (!appIdentifier) {
		try {
			services.$projectData.initializeProjectData();
		} catch (err) {
			// ignore the error
		}
		if (!services.$projectData.projectIdentifiers) {
			services.$errors.fail(
				"Please enter application identifier or execute this command in project.",
			);
		}
	}

	const action = async (device: Mobile.IDevice) => {
		appIdentifier =
			appIdentifier ||
			services.$projectData.projectIdentifiers[
				device.deviceInfo.platform.toLowerCase()
			];
		await device.fileSystem.putFile(
			context.args[0],
			context.args[1],
			appIdentifier,
		);
	};
	await services.$devicesService.execute(action);
}

export const putFileCommandDefinition = defineCommand({
	name: ["device|put-file", "devices|put-file"],
	description: "Uploads a file to a connected device.",
	options: putFileCommandOptions,
	arguments: [{ name: "localPath" }, { name: "devicePath" }, { name: "appId" }],
	setup: setupPutFileCommand,
	run: runPutFileCommand,
});

registerCommand(putFileCommandDefinition);
