import * as path from "path";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import { IFileSystem, IProjectHelper } from "../common/declarations";
import * as constants from "../constants";
import { IProjectConfigService } from "../definitions/project";

export class CleanCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectHelper: IProjectHelper,
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

			for (const pathToClean of pathsToClean) {
				const filePath = path.resolve(
					this.$projectHelper.projectDir,
					pathToClean
				);
				const displayPath = `${path.relative(
					this.$projectHelper.projectDir,
					filePath
				)}`.yellow;
				spinner.start(`Cleaning ${displayPath}`);
				this.$logger.trace(`Trying to clean '${filePath}'`);
				if (this.$fs.exists(filePath)) {
					const stat = this.$fs.getFsStats(filePath);

					if (stat.isDirectory()) {
						this.$logger.trace(`Path '${filePath}' is a directory, deleting.`);
						this.$fs.deleteDirectorySafe(filePath);
						spinner.text = `Cleaned directory ${displayPath}`;
						spinner.succeed();
					} else {
						this.$logger.trace(`Path '${filePath}' is a file, deleting.`);
						this.$fs.deleteFile(filePath);
						spinner.text = `Cleaned file ${displayPath}`;
						spinner.succeed();
					}
				} else {
					spinner.text = `Skipping ${displayPath} because it doesn't exist.`;
					spinner.info();
					this.$logger.trace(`Path '${filePath}' not found, skipping.`);
				}
			}
		} catch (err) {
			// ignore any errors
			this.$logger.trace(
				`Encountered error while cleaning. Error is: ${err.message}.`,
				err
			);
		}

		spinner.succeed("Project successfully cleaned.");
		// this.$logger.info("Project successfully cleaned.");
	}
}

injector.registerCommand("clean", CleanCommand);
