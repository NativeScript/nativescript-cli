import { color } from "../color";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import * as constants from "../constants";
import {
	IProjectCleanupResult,
	IProjectCleanupService,
	IProjectConfigService,
	IProjectData,
	IProjectService,
} from "../definitions/project";

import type { PromptObject } from "prompts";
import { IOptions, IStaticConfig } from "../declarations";
import {
	ITerminalSpinner,
	ITerminalSpinnerService,
} from "../definitions/terminal-spinner-service";
import { IChildProcess } from "../common/declarations";
import * as os from "os";

import { resolve } from "path";
import { readdir } from "fs/promises";
import { isInteractive } from "../common/helpers";

function bytesToHumanReadable(bytes: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let unit = 0;
	while (bytes >= 1024) {
		bytes /= 1024;
		unit++;
	}
	return `${bytes.toFixed(2)} ${units[unit]}`;
}

/**
 * A helper function to map an array of values to promises with a concurrency limit.
 * The mapper function should return a promise. It will be called for each value in the values array.
 * The concurrency limit is the number of promises that can be running at the same time.
 *
 * This function will return a promise that resolves when all values have been mapped.
 *
 * @param values A static array of values to map to promises
 * @param mapper	A function that maps a value to a promise
 * @param concurrency The number of promises that can be running at the same time
 * @returns Promise<void>
 */
function promiseMap<T>(
	values: T[],
	mapper: (value: T) => Promise<void>,
	concurrency = 10,
) {
	let index = 0;
	let pending = 0;
	let done = false;

	return new Promise<void>((resolve, reject) => {
		const next = () => {
			done = index === values.length;

			if (done && pending === 0) {
				return resolve();
			}

			while (pending < concurrency && index < values.length) {
				const value = values[index++];
				pending++;
				mapper(value)
					.then(() => {
						pending--;
						next();
					})
					.catch();
			}
		};

		next();
	});
}

export class CleanCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $projectCleanupService: IProjectCleanupService,
		private $projectConfigService: IProjectConfigService,
		private $projectData: IProjectData,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $projectService: IProjectService,
		private $prompter: IPrompter,
		private $logger: ILogger,
		private $options: IOptions,
		private $childProcess: IChildProcess,
		private $staticConfig: IStaticConfig,
	) {}

	public async execute(args: string[]): Promise<void> {
		const isDryRun = this.$options.dryRun ?? false;
		const isJSON = this.$options.json ?? false;

		const spinner = this.$terminalSpinnerService.createSpinner({
			isSilent: isJSON,
		});

		if (!this.$projectService.isValidNativeScriptProject()) {
			return this.cleanMultipleProjects(spinner);
		}

		spinner.start("Cleaning project...\n");

		let pathsToClean = [
			constants.HOOKS_DIR_NAME,
			this.$projectData.getBuildRelativeDirectoryPath(),
			constants.NODE_MODULES_FOLDER_NAME,
		];

		try {
			const overridePathsToClean =
				this.$projectConfigService.getValue("cli.pathsToClean");
			const additionalPaths = this.$projectConfigService.getValue(
				"cli.additionalPathsToClean",
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

		const res = await this.$projectCleanupService.clean(pathsToClean, {
			dryRun: isDryRun,
			silent: isJSON,
			stats: isJSON,
		});

		if (res.stats && isJSON) {
			console.log(
				JSON.stringify(
					{
						ok: res.ok,
						dryRun: isDryRun,
						stats: Object.fromEntries(res.stats.entries()),
					},
					null,
					2,
				),
			);

			return;
		}

		if (res.ok) {
			spinner.succeed("Project successfully cleaned.");
		} else {
			spinner.fail(color.red("Project unsuccessfully cleaned."));
		}
	}

	private async cleanMultipleProjects(spinner: ITerminalSpinner) {
		if (!isInteractive() || this.$options.json) {
			// interactive terminal is required, and we can't output json in an interactive command.
			this.$logger.warn("No project found in the current directory.");
			return;
		}

		const shouldScan = await this.$prompter.confirm(
			"No project found in the current directory. Would you like to scan for all projects in sub-directories instead?",
		);

		if (!shouldScan) {
			return;
		}

		spinner.start("Scanning for projects... Please wait.");
		const paths = await this.getNSProjectPathsInDirectory();
		spinner.succeed(`Found ${paths.length} projects.`);

		let computed = 0;
		const updateProgress = () => {
			const current = color.grey(`${computed}/${paths.length}`);
			spinner.start(
				`Gathering cleanable sizes. This may take a while... ${current}`,
			);
		};

		// update the progress initially
		updateProgress();

		const projects = new Map<string, number>();

		await promiseMap(
			paths,
			(p) => {
				return this.$childProcess
					.exec(
						`node ${this.$staticConfig.cliBinPath} clean --dry-run --json --disable-analytics`,
						{
							cwd: p,
						},
					)
					.then((res) => {
						const paths: Record<string, number> = JSON.parse(res).stats;
						return Object.values(paths).reduce((a, b) => a + b, 0);
					})
					.catch((err) => {
						this.$logger.trace(
							"Failed to get project size for %s, Error is:",
							p,
							err,
						);
						return -1;
					})
					.then((size) => {
						if (size > 0 || size === -1) {
							// only store size if it's larger than 0 or -1 (error while getting size)
							projects.set(p, size);
						}
						// update the progress after each processed project
						computed++;
						updateProgress();
					});
			},
			os.cpus().length,
		);

		spinner.clear();
		spinner.stop();

		this.$logger.clearScreen();

		const totalSize = Array.from(projects.values())
			.filter((s) => s > 0)
			.reduce((a, b) => a + b, 0);

		const pathsToClean = await this.$prompter.promptForChoice(
			`Found ${
				projects.size
			} cleanable project(s) with a total size of: ${color.green(
				bytesToHumanReadable(totalSize),
			)}. Select projects to clean`,
			Array.from(projects.keys()).map((p) => {
				const size = projects.get(p);
				let description;
				if (size === -1) {
					description = " - could not get size";
				} else {
					description = ` - ${bytesToHumanReadable(size)}`;
				}

				return {
					title: `${p}${color.grey(description)}`,
					value: p,
				};
			}),
			true,
			{
				optionsPerPage: process.stdout.rows - 6, // 6 lines are taken up by the instructions
			} as Partial<PromptObject>,
		);
		this.$logger.clearScreen();

		spinner.warn(
			`This will run "${color.yellow(
				`ns clean`,
			)}" in all the selected projects and ${color.styleText(
				["red", "bold"],
				"delete files from your system",
			)}!`,
		);
		spinner.warn(`This action cannot be undone!`);

		let confirmed = await this.$prompter.confirm(
			"Are you sure you want to clean the selected projects?",
		);
		if (!confirmed) {
			return;
		}

		spinner.info("Cleaning... This might take a while...");

		let totalSizeCleaned = 0;
		for (let i = 0; i < pathsToClean.length; i++) {
			const currentPath = pathsToClean[i];

			spinner.start(
				`Cleaning ${color.cyan(currentPath)}... ${i + 1}/${pathsToClean.length}`,
			);

			const ok = await this.$childProcess
				.exec(
					`node ${this.$staticConfig.cliBinPath} clean ${
						this.$options.dryRun ? "--dry-run" : ""
					} --json --disable-analytics`,
					{
						cwd: currentPath,
					},
				)
				.then((res) => {
					const cleanupRes = JSON.parse(res) as IProjectCleanupResult;
					return cleanupRes.ok;
				})
				.catch((err) => {
					this.$logger.trace('Failed to clean project "%s"', currentPath, err);
					return false;
				});

			if (ok) {
				const cleanedSize = projects.get(currentPath);
				const cleanedSizeStr = color.grey(
					`- ${bytesToHumanReadable(cleanedSize)}`,
				);
				spinner.succeed(`Cleaned ${color.cyan(currentPath)} ${cleanedSizeStr}`);
				totalSizeCleaned += cleanedSize;
			} else {
				spinner.fail(`Failed to clean ${color.cyan(currentPath)} - skipped`);
			}
		}
		spinner.clear();
		spinner.stop();
		spinner.succeed(
			`Done! We've just freed up ${color.green(
				bytesToHumanReadable(totalSizeCleaned),
			)}! Woohoo! 🎉`,
		);

		if (this.$options.dryRun) {
			spinner.info(
				'Note: the "--dry-run" flag was used, so no files were actually deleted.',
			);
		}
	}

	private async getNSProjectPathsInDirectory(
		dir = process.cwd(),
	): Promise<string[]> {
		let nsDirs: string[] = [];

		const getFiles = async (dir: string) => {
			if (dir.includes("node_modules")) {
				// skip traversing node_modules
				return;
			}

			const dirents = await readdir(dir, { withFileTypes: true }).catch(
				(err): any[] => {
					this.$logger.trace(
						'Failed to read directory "%s". Error is:',
						dir,
						err,
					);
					return [];
				},
			);

			const hasNSConfig = dirents.some(
				(ent) =>
					ent.name.includes("nativescript.config.ts") ||
					ent.name.includes("nativescript.config.js"),
			);

			if (hasNSConfig) {
				nsDirs.push(dir);
				// found a NativeScript project, stop traversing
				return;
			}

			await Promise.all(
				dirents.map((dirent: any) => {
					const res = resolve(dir, dirent.name);

					if (dirent.isDirectory()) {
						return getFiles(res);
					}
				}),
			);
		};

		await getFiles(dir);

		return nsDirs;
	}
}

injector.registerCommand("clean", CleanCommand);
