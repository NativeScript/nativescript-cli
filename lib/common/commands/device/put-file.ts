import { IProjectData } from "../../../definitions/project";
import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../../define-command";
import { inject } from "../../di";

const putFileCommandOptions = {
	device: stringOption(),
} satisfies CommandOptionsSchema;

export const putFileCommandDefinition = defineCommand({
	name: ["device|put-file", "devices|put-file"],
	description: "Uploads a file to a connected device.",
	options: putFileCommandOptions,
	arguments: [{ name: "localPath" }, { name: "devicePath" }, { name: "appId" }],
	async run(context): Promise<void> {
		const $devicesService = inject<Mobile.IDevicesService>("devicesService");
		const $projectData = inject<IProjectData>("projectData");

		await $devicesService.initialize({
			deviceId: context.options.device,
			skipInferPlatform: true,
		});
		let appIdentifier = context.args[2];

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
			await device.fileSystem.putFile(
				context.args[0],
				context.args[1],
				appIdentifier,
			);
		};
		await $devicesService.execute(action);
	},
});
