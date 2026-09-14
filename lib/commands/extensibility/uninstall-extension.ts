import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { IExtensibilityService } from "../../common/definitions/extensibility";

export function setupUninstallExtensionCommand() {
	return {
		$extensibilityService: inject<IExtensibilityService>(
			"extensibilityService",
		),
		$logger: inject<ILogger>("logger"),
	};
}

export type IUninstallExtensionCommandServices = ReturnType<
	typeof setupUninstallExtensionCommand
>;

export const uninstallExtensionCommandDefinition = defineCommand({
	name: "extension|uninstall",
	description: "Uninstalls the specified extension.",
	arguments: [
		{
			name: "extensionName",
			required: true,
			errorMessage:
				"You have to provide a valid name for extension that you want to uninstall.",
		},
	],
	setup: setupUninstallExtensionCommand,
	async run(
		context,
		services: IUninstallExtensionCommandServices,
	): Promise<void> {
		const extensionName = context.args[0];
		await services.$extensibilityService.uninstallExtension(extensionName);
		services.$logger.info(
			`Successfully uninstalled extension ${extensionName}`,
		);
	},
});
