import { color } from "../color";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import * as constants from "../constants";
import {
	IProjectCleanupService,
	IProjectConfigService,
} from "../definitions/project";

export class CleanCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $projectCleanupService: IProjectCleanupService,
		private $projectConfigService: IProjectConfigService,
		private $terminalSpinnerService: ITerminalSpinnerService
	) {}

	public async execute(args: string[]): Promise<void> {
		const spinner = this.$terminalSpinnerService.createSpinner();
		spinner.start("Cleaning project...\n");

		let pathsToClean = [
			constants.HOOKS_DIR_NAME,
			constants.PLATFORMS_DIR_NAME,
			constants.NODE_MODULES_FOLDER_NAME,
			constants.PACKAGE_LOCK_JSON_FILE_NAME,
		];

		try {
			const overridePathsToClean = this.$projectConfigService.getValue(
				"cli.pathsToClean"
			);
			const additionalPaths = this.$projectConfigService.getValue(
				"cli.additionalPathsToClean"
			);

			// allow overriding default paths to clean
			if (Array.isArray(overridePathsToClean)) {
				pathsToClean = overridePathsToClean;
			}

			if (Array.isArray(additionalPaths)) {
				pathsToClean.push(...additionalPaths);
			}
		} catch (err) {
			// ignore
		}

		const success = await this.$projectCleanupService.clean(pathsToClean);

		if (success) {
			spinner.succeed("Project successfully cleaned.");
		} else {
			spinner.fail(color.red("Project unsuccessfully cleaned."));
		}
	}
}

injector.registerCommand("clean", CleanCommand);
