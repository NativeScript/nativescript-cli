import * as path from "path";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import { IFileSystem, IProjectHelper } from "../common/declarations";
import * as constants from "../constants";

export class CleanCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectHelper: IProjectHelper
	) {}

	public async execute(args: string[]): Promise<void> {
		this.$fs.deleteDirectory(
			path.join(this.$projectHelper.projectDir, constants.HOOKS_DIR_NAME)
		);
		this.$fs.deleteDirectory(
			path.join(this.$projectHelper.projectDir, constants.PLATFORMS_DIR_NAME)
		);
		this.$fs.deleteDirectory(
			path.join(
				this.$projectHelper.projectDir,
				constants.NODE_MODULES_FOLDER_NAME
			)
		);
		this.$fs.deleteFile(
			path.join(
				this.$projectHelper.projectDir,
				constants.PACKAGE_LOCK_JSON_FILE_NAME
			)
		);

		this.$logger.info("Project successfully cleaned.");
	}
}

injector.registerCommand("clean", CleanCommand);
