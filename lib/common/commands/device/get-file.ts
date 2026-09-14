import { IProjectData } from "../../../definitions/project";
import { IErrors } from "../../declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const getFileCommandOptions = {
	device: stringOption(),
	file: stringOption(),
} satisfies CommandOptionsSchema;

export type GetFileCommandContext = CommandContext<
	typeof getFileCommandOptions
>;

export interface IGetFileCommandServices {
	$devicesService: Mobile.IDevicesService;
	$errors: IErrors;
	$projectData: IProjectData;
}

export function setupGetFileCommand(): IGetFileCommandServices {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$errors: inject<IErrors>("errors"),
		$projectData: inject<IProjectData>("projectData"),
	};
}

export async function runGetFileCommand(
	context: GetFileCommandContext,
	services: IGetFileCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
		deviceId: context.options.device,
		skipInferPlatform: true,
	});
	let appIdentifier = context.args[1];

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
		await device.fileSystem.getFile(
			context.args[0],
			appIdentifier,
			context.options.file,
		);
	};
	await services.$devicesService.execute(action);
}

export const getFileCommandDefinition = defineCommand({
	name: ["device|get-file", "devices|get-file"],
	description: "Downloads a file from a connected device.",
	options: getFileCommandOptions,
	arguments: [{ name: "path" }, { name: "appId" }],
	setup: setupGetFileCommand,
	run: runGetFileCommand,
});
