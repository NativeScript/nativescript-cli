import { IProjectData } from "../../../definitions/project";
import { IErrors } from "../../declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const listFilesCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export type ListFilesCommandContext = CommandContext<
	typeof listFilesCommandOptions
>;

export interface IListFilesCommandServices {
	$devicesService: Mobile.IDevicesService;
	$errors: IErrors;
	$projectData: IProjectData;
}

export function setupListFilesCommand(): IListFilesCommandServices {
	return {
		$devicesService: inject<Mobile.IDevicesService>("devicesService"),
		$errors: inject<IErrors>("errors"),
		$projectData: inject<IProjectData>("projectData"),
	};
}

export async function runListFilesCommand(
	context: ListFilesCommandContext,
	services: IListFilesCommandServices,
): Promise<void> {
	await services.$devicesService.initialize({
		deviceId: context.options.device,
		skipInferPlatform: true,
	});
	const pathToList = context.args[0];
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
		await device.fileSystem.listFiles(pathToList, appIdentifier);
	};
	await services.$devicesService.execute(action);
}

export const listFilesCommandDefinition = defineCommand({
	name: ["device|list-files", "devices|list-files"],
	description: "Lists the files in a directory on a connected device.",
	options: listFilesCommandOptions,
	arguments: [{ name: "path" }, { name: "appId" }],
	setup: setupListFilesCommand,
	run: runListFilesCommand,
});
