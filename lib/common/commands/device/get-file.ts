import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";
import { ProjectData } from "../../../contracts/project-data";

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

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});
		let appIdentifier = context.args[1];
		let $projectData: ProjectData = null;

		if (!appIdentifier) {
			try {
				// The project is optional: an app identifier stands in for it.
				$projectData = context.injector.get(ProjectData);
				$projectData.initializeProjectData();
			} catch (err) {
				// ignore the error
			}
			if (!$projectData?.projectIdentifiers) {
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
			await device.fileSystem.getFile(
				context.args[0],
				appIdentifier,
				context.options.file,
			);
		};
		await $devicesService.execute(action);
	},
});
