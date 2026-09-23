import * as _ from "lodash";
import { defineCommand } from "../../common/define-command";
import { inject } from "../../common/di";
import { IExtensibilityService } from "../../common/definitions/extensibility";
import * as helpers from "../../common/helpers";

export const listExtensionsCommandDefinition = defineCommand({
	name: "extension|*list",
	description: "Lists all installed extensions.",
	run(): void {
		const $extensibilityService = inject<IExtensibilityService>(
			"extensibilityService",
		);
		const $logger = inject<ILogger>("logger");

		const installedExtensions = $extensibilityService.getInstalledExtensions();
		if (_.keys(installedExtensions).length) {
			$logger.info("Installed extensions:");
			const data = _.map(installedExtensions, (version, name) => {
				return [name, version];
			});

			const table = helpers.createTable(["Name", "Version"], data);
			$logger.info(table.toString());
		} else {
			$logger.info("No extensions installed.");
		}
	},
});
