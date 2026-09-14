import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { IExtensibilityService } from "../../common/definitions/extensibility";

export const installExtensionCommandDefinition = defineCommand({
	name: "extension|install",
	description: "Installs the specified extension.",
	arguments: [
		{
			name: "extensionName",
			required: true,
			errorMessage:
				"You have to provide a valid name for extension that you want to install.",
		},
	],
	async run(context): Promise<void> {
		const $extensibilityService = inject<IExtensibilityService>(
			"extensibilityService",
		);
		const $logger = inject<ILogger>("logger");

		const extensionData = await $extensibilityService.installExtension(
			context.args[0],
		);
		$logger.info(
			`Successfully installed extension ${extensionData.extensionName}.`,
		);

		await $extensibilityService.loadExtension(extensionData.extensionName);
		$logger.info(
			`Successfully loaded extension ${extensionData.extensionName}.`,
		);
	},
});
