import { IProjectCleanupService } from "../definitions/project";
import { IFileSystem, IProjectHelper } from "../common/declarations";
import { injector } from "../common/yok";
import * as path from "path";

export class ProjectCleanupService implements IProjectCleanupService {
	private spinner: ITerminalSpinner;

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectHelper: IProjectHelper,
		private $terminalSpinnerService: ITerminalSpinnerService
	) {
		this.spinner = this.$terminalSpinnerService.createSpinner();
	}

	public async clean(pathsToClean: string[]): Promise<boolean> {
		let success = true;
		for (const pathToClean of pathsToClean) {
			const isCleaned = await this.cleanPath(pathToClean).catch((error) => {
				this.$logger.trace(
					`Encountered error while cleaning. Error is: ${error.message}.`,
					error
				);
				return false;
			});
			success = success && isCleaned;
		}
		return success;
	}

	public async cleanPath(pathToClean: string): Promise<boolean> {
		this.spinner.clear();
		let success = true;
		let fileType: string;
		if (!pathToClean || pathToClean.trim().length === 0) {
			this.$logger.trace("cleanPath called with no pathToClean.");
			return success;
		}

		const filePath = path.resolve(this.$projectHelper.projectDir, pathToClean);
		const displayPath = `${path.relative(
			this.$projectHelper.projectDir,
			filePath
		)}`.yellow;

		this.$logger.trace(`Trying to clean '${filePath}'`);

		if (this.$fs.exists(filePath)) {
			const stat = this.$fs.getFsStats(filePath);

			if (stat.isDirectory()) {
				this.$logger.trace(`Path '${filePath}' is a directory, deleting.`);
				this.$fs.deleteDirectorySafe(filePath);
				fileType = "directory";
			} else {
				this.$logger.trace(`Path '${filePath}' is a file, deleting.`);
				this.$fs.deleteFile(filePath);
				fileType = "file";
			}

			success = !this.$fs.exists(filePath);
			if (success) {
				this.spinner.succeed(`Cleaned ${fileType} ${displayPath}`);
			} else {
				const message = `Failed to Clean ${fileType}`.red;
				this.spinner.fail(`${message} ${displayPath}`);
			}
			return success;
		}
		this.$logger.trace(`Path '${filePath}' not found, skipping.`);
		// this.spinner.text = `Skipping ${displayPath} because it doesn't exist.`;
		// this.spinner.info();
		return success;
	}
}

injector.register("projectCleanupService", ProjectCleanupService);
