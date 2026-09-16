import { IProjectData } from "../../../definitions/project";
import { IErrors } from "../../declarations";
import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const getFileCommandOptions = {
	device: stringOption(),
	file: stringOption(),
} satisfies CommandOptionsSchema;

export const getFileCommandDefinition = defineCommand({
	name: ["device|get-file", "devices|get-file"],
	description: "Downloads a file from a connected device.",
	options: getFileCommandOptions,
	arguments: [{ name: "path" }, { name: "appId" }],
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");
		const $errors = inject<IErrors>("errors");
		const $projectData = inject<IProjectData>("projectData");

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});
		let appIdentifier = context.args[1];

		if (!appIdentifier) {
			try {
				$projectData.initializeProjectData();
			} catch (err) {
				// ignore the error
			}
			if (!$projectData.projectIdentifiers) {
				$errors.fail(
					"Please enter application identifier or execute this command in project.",
				);
			}
		}

		const action = async (device: Mobile.IDevice) => {
			appIdentifier =
				appIdentifier ||
				$projectData.projectIdentifiers[
					device.deviceInfo.platform.toLowerCase()
				];
			await device.fileSystem.getFile(
				context.args[0],
				appIdentifier,
				context.options.file,
			);
		};
		await $devicesService.execute(action);
	},
});
