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
		spinner.start("Cleaning project...");

		const pathsToClean = [
			constants.HOOKS_DIR_NAME,
			constants.PLATFORMS_DIR_NAME,
			constants.NODE_MODULES_FOLDER_NAME,
			constants.PACKAGE_LOCK_JSON_FILE_NAME,
		];

		try {
			const additionalPaths = this.$projectConfigService.getValue(
				"additionalPathsToClean"
			);
			if (Array.isArray(additionalPaths)) {
				pathsToClean.push(...additionalPaths);
			}
		} catch (err) {
			// ignore
		}

		let result = await this.$projectCleanupService.clean(pathsToClean);

		if (result) {
			spinner.succeed("Project successfully cleaned.");
		} else {
			spinner.fail(`${"Project unsuccessfully cleaned.".red}`);
		}
	}
}

injector.registerCommand("clean", CleanCommand);
