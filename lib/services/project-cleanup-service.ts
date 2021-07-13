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

	public async clean(pathsToClean: string[]): Promise<void> {
		for (const pathToClean of pathsToClean) {
			await this.cleanPath(pathToClean).catch((error) => {
				this.$logger.trace(
					`Encountered error while cleaning. Error is: ${error.message}.`,
					error
				);
			});
		}
	}

	public async cleanPath(pathToClean: string): Promise<void> {
		this.spinner.clear();

		if (!pathToClean || pathToClean.trim().length === 0) {
			this.$logger.trace("cleanPath called with no pathToClean.");
			return;
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
				this.spinner.succeed(`Cleaned directory ${displayPath}`);
			} else {
				this.$logger.trace(`Path '${filePath}' is a file, deleting.`);
				this.$fs.deleteFile(filePath);
				this.spinner.succeed(`Cleaned file ${displayPath}`);
			}
			return;
		}
		this.$logger.trace(`Path '${filePath}' not found, skipping.`);
		// this.spinner.text = `Skipping ${displayPath} because it doesn't exist.`;
		// this.spinner.info();
	}
}

injector.register("projectCleanupService", ProjectCleanupService);
