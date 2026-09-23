import { IProjectData } from "../../../definitions/project";
import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const listFilesCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const listFilesCommandDefinition = defineCommand({
	name: ["device|list-files", "devices|list-files"],
	description: "Lists the files in a directory on a connected device.",
	options: listFilesCommandOptions,
	arguments: [{ name: "path" }, { name: "appId" }],
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");
		const $projectData = inject<IProjectData>("projectData");

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});
		const pathToList = context.args[0];
		let appIdentifier = context.args[1];

		if (!appIdentifier) {
			try {
				$projectData.initializeProjectData();
			} catch (err) {
				// ignore the error
			}
			if (!$projectData.projectIdentifiers) {
				context.fail(
					"Please enter application identifier or execute this command in project.",
					{ help: false },
				);
			}
		}

		const action = async (device: Mobile.IDevice) => {
			appIdentifier =
				appIdentifier ||
				$projectData.projectIdentifiers[
					device.deviceInfo.platform.toLowerCase()
				];
			await device.fileSystem.listFiles(pathToList, appIdentifier);
		};
		await $devicesService.execute(action);
	},
});
