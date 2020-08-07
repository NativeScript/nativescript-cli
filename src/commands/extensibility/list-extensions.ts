import * as helpers from "../../common/helpers";

import { ICommand, ICommandParameter } from "../../common/definitions/commands";
import { IExtensibilityService } from "../../common/definitions/extensibility";
import * as _ from "lodash";

export class ListExtensionsCommand implements ICommand {
	constructor(private $extensibilityService: IExtensibilityService,
				private $logger: ILogger) {
	}

	public async execute(args: string[]): Promise<void> {
		const installedExtensions = this.$extensibilityService.getInstalledExtensions();
		if (_.keys(installedExtensions).length) {
			this.$logger.info("Installed extensions:");
			const data = _.map(installedExtensions, (version, name) => {
				return [name, version];
			});

			const table = helpers.createTable(["Name", "Version"], data);
			this.$logger.info(table.toString());
		} else {
			this.$logger.info("No extensions installed.");
		}
	}

	allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("extension|*list", ListExtensionsCommand);
