import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { IExtensibilityService } from "../../common/definitions/extensibility";

export const uninstallExtensionCommandDefinition = defineCommand({
	name: "extension|uninstall",
	description: "Uninstalls the specified extension.",
	params: [
		{
			name: "extensionName",
			required: true,
			errorMessage:
				"You have to provide a valid name for extension that you want to uninstall.",
		},
	],
	async run(context): Promise<void> {
		const $extensibilityService = inject<IExtensibilityService>(
			"extensibilityService",
		);
		const $logger = inject<ILogger>("logger");

		const extensionName = context.args[0];
		await $extensibilityService.uninstallExtension(extensionName);
		$logger.info(`Successfully uninstalled extension ${extensionName}`);
	},
});
