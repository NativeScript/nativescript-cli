import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";
import { ProjectData } from "../../../contracts/project-data";

const putFileCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const putFileCommandDefinition = defineCommand({
	name: ["device|put-file", "devices|put-file"],
	description: "Uploads a file to a connected device.",
	options: putFileCommandOptions,
	params: [{ name: "localPath" }, { name: "devicePath" }, { name: "appId" }],
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});
		let appIdentifier = context.args[2];
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
			await device.fileSystem.putFile(
				context.args[0],
				context.args[1],
				appIdentifier,
			);
		};
		await $devicesService.execute(action);
	},
});
