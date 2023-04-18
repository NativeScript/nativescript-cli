import {
	IProjectCleanupOptions,
	IProjectCleanupResult,
	IProjectCleanupService,
	IProjectPathCleanupResult,
} from "../definitions/project";
import { IFileSystem, IProjectHelper } from "../common/declarations";
import { injector } from "../common/yok";
import * as path from "path";
import { color } from "../color";
import {
	ITerminalSpinner,
	ITerminalSpinnerService,
} from "../definitions/terminal-spinner-service";

export class ProjectCleanupService implements IProjectCleanupService {
	private spinner: ITerminalSpinner;

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectHelper: IProjectHelper,
		private $terminalSpinnerService: ITerminalSpinnerService
	) {}

	public async clean(
		pathsToClean: string[],
		options?: IProjectCleanupOptions
	): Promise<IProjectCleanupResult> {
		this.spinner = this.$terminalSpinnerService.createSpinner({
			isSilent: options?.silent,
		});

		let stats = options?.stats ? new Map<string, number>() : false;

		let success = true;
		for (const pathToClean of pathsToClean) {
			const cleanRes = await this.cleanPath(pathToClean, options).catch(
				(error) => {
					this.$logger.trace(
						`Encountered error while cleaning. Error is: ${error.message}.`,
						error
					);
					return { ok: false };
				}
			);
			if (stats && "size" in cleanRes) {
				stats.set(pathToClean, cleanRes.size);
			}
			success = success && cleanRes.ok;
		}

		if (!options?.silent) {
			// required to print an empty line for the spinner to not replace the last status... (probably a bug in the spinners)
			console.log();
		}

		if (stats) {
			return { ok: success, stats };
		}
		return { ok: success };
	}

	public async cleanPath(
		pathToClean: string,
		options?: IProjectCleanupOptions
	): Promise<IProjectPathCleanupResult> {
		const dryRun = options?.dryRun ?? false;
		const logPrefix = dryRun ? color.grey("(dry run) ") : "";

		this.spinner.clear();
		let fileType: string;

		if (!pathToClean || pathToClean.trim().length === 0) {
			this.$logger.trace(`${logPrefix}cleanPath called with no pathToClean.`);
			return { ok: true };
		}

		const filePath = path.resolve(this.$projectHelper.projectDir, pathToClean);
		const displayPath = color.yellow(
			`${path.relative(this.$projectHelper.projectDir, filePath)}`
		);

		this.$logger.trace(`${logPrefix}Trying to clean '${filePath}'`);

		if (this.$fs.exists(filePath)) {
			const stat = this.$fs.getFsStats(filePath);
			let size = 0;

			if (options?.stats) {
				size = this.$fs.getSize(filePath);
			}

			if (stat.isDirectory()) {
				this.$logger.trace(
					`${logPrefix}Path '${filePath}' is a directory, deleting.`
				);
				!dryRun && this.$fs.deleteDirectorySafe(filePath);
				fileType = "directory";
			} else {
				this.$logger.trace(
					`${logPrefix}Path '${filePath}' is a file, deleting.`
				);
				!dryRun && this.$fs.deleteFile(filePath);
				fileType = "file";
			}

			const success = dryRun || !this.$fs.exists(filePath);

			if (success) {
				this.spinner.succeed(`${logPrefix}Cleaned ${fileType} ${displayPath}`);
			} else {
				const message = color.red(`Failed to Clean ${fileType}`);
				this.spinner.fail(`${logPrefix}${message} ${displayPath}`);
			}

			if (options?.stats) {
				return { ok: success, size };
			}
			return { ok: success };
		}

		this.$logger.trace(`${logPrefix}Path '${filePath}' not found, skipping.`);
		this.spinner.info(
			`${logPrefix}Skipping ${displayPath} because it doesn't exist.`
		);

		if (options?.stats) {
			return { ok: true, size: 0 };
		}
		return { ok: true };
	}
}

injector.register("projectCleanupService", ProjectCleanupService);
