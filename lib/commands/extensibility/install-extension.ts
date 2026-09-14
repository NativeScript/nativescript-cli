import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { IExtensibilityService } from "../../common/definitions/extensibility";
import { registerCommand } from "../../common/services/command-definition-adapter";

export interface IInstallExtensionCommandServices {
	$extensibilityService: IExtensibilityService;
	$logger: ILogger;
}

export function setupInstallExtensionCommand(): IInstallExtensionCommandServices {
	return {
		$extensibilityService: inject<IExtensibilityService>(
			"extensibilityService",
		),
		$logger: inject<ILogger>("logger"),
	};
}

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
	setup: setupInstallExtensionCommand,
	async run(
		context,
		services: IInstallExtensionCommandServices,
	): Promise<void> {
		const extensionData = await services.$extensibilityService.installExtension(
			context.args[0],
		);
		services.$logger.info(
			`Successfully installed extension ${extensionData.extensionName}.`,
		);

		await services.$extensibilityService.loadExtension(
			extensionData.extensionName,
		);
		services.$logger.info(
			`Successfully loaded extension ${extensionData.extensionName}.`,
		);
	},
});

registerCommand(installExtensionCommandDefinition);
