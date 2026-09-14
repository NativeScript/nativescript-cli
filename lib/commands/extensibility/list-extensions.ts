import * as _ from "lodash";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { IExtensibilityService } from "../../common/definitions/extensibility";
import * as helpers from "../../common/helpers";

export function setupListExtensionsCommand() {
	return {
		$extensibilityService: inject<IExtensibilityService>(
			"extensibilityService",
		),
		$logger: inject<ILogger>("logger"),
	};
}

export type IListExtensionsCommandServices = ReturnType<
	typeof setupListExtensionsCommand
>;

export const listExtensionsCommandDefinition = defineCommand({
	name: "extension|*list",
	description: "Lists all installed extensions.",
	setup: setupListExtensionsCommand,
	run(context, services: IListExtensionsCommandServices): void {
		const installedExtensions =
			services.$extensibilityService.getInstalledExtensions();
		if (_.keys(installedExtensions).length) {
			services.$logger.info("Installed extensions:");
			const data = _.map(installedExtensions, (version, name) => {
				return [name, version];
			});

			const table = helpers.createTable(["Name", "Version"], data);
			services.$logger.info(table.toString());
		} else {
			services.$logger.info("No extensions installed.");
		}
	},
});
