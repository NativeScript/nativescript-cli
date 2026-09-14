import { readdir } from "fs/promises";
import * as os from "os";
import { resolve } from "path";
import type { PromptObject } from "prompts";
import { color } from "../color";
import { IChildProcess } from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
} from "../common/define-command";
import { inject } from "../common/di";
import { isInteractive } from "../common/helpers";
import { registerCommand } from "../common/services/command-definition-adapter";
import * as constants from "../constants";
import { IStaticConfig } from "../declarations";
import {
	IProjectCleanupResult,
	IProjectCleanupService,
	IProjectConfigService,
	IProjectData,
	IProjectService,
} from "../definitions/project";
import {
	ITerminalSpinner,
	ITerminalSpinnerService,
} from "../definitions/terminal-spinner-service";

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

const cleanCommandOptions = {
	dryRun: booleanOption(),
	json: booleanOption(),
} satisfies CommandOptionsSchema;

export type CleanCommandContext = CommandContext<typeof cleanCommandOptions>;

export interface ICleanCommandServices {
	$childProcess: IChildProcess;
	$logger: ILogger;
	$projectCleanupService: IProjectCleanupService;
	$projectConfigService: IProjectConfigService;
	$projectData: IProjectData;
	$projectService: IProjectService;
	$prompter: IPrompter;
	$staticConfig: IStaticConfig;
	$terminalSpinnerService: ITerminalSpinnerService;
}

export function setupCleanCommand(): ICleanCommandServices {
	return {
		$childProcess: inject<IChildProcess>("childProcess"),
		$logger: inject<ILogger>("logger"),
		$projectCleanupService: inject<IProjectCleanupService>(
			"projectCleanupService",
		),
		$projectConfigService: inject<IProjectConfigService>(
			"projectConfigService",
		),
		$projectData: inject<IProjectData>("projectData"),
		$projectService: inject<IProjectService>("projectService"),
		$prompter: inject<IPrompter>("prompter"),
		$staticConfig: inject<IStaticConfig>("staticConfig"),
		$terminalSpinnerService: inject<ITerminalSpinnerService>(
			"terminalSpinnerService",
		),
	};
}

async function getNSProjectPathsInDirectory(
	services: ICleanCommandServices,
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
				services.$logger.trace(
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

async function cleanMultipleProjects(
	context: CleanCommandContext,
	services: ICleanCommandServices,
	spinner: ITerminalSpinner,
) {
	if (!isInteractive() || context.options.json) {
		// interactive terminal is required, and we can't output json in an interactive command.
		services.$logger.warn("No project found in the current directory.");
		return;
	}

	const shouldScan = await services.$prompter.confirm(
		"No project found in the current directory. Would you like to scan for all projects in sub-directories instead?",
	);

	if (!shouldScan) {
		return;
	}

	spinner.start("Scanning for projects... Please wait.");
	const paths = await getNSProjectPathsInDirectory(services);
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
			return services.$childProcess
				.exec(
					`node ${services.$staticConfig.cliBinPath} clean --dry-run --json --disable-analytics`,
					{
						cwd: p,
					},
				)
				.then((res) => {
					const paths: Record<string, number> = JSON.parse(res).stats;
					return Object.values(paths).reduce((a, b) => a + b, 0);
				})
				.catch((err) => {
					services.$logger.trace(
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

	services.$logger.clearScreen();

	const totalSize = Array.from(projects.values())
		.filter((s) => s > 0)
		.reduce((a, b) => a + b, 0);

	const pathsToClean = await services.$prompter.promptForChoice(
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
	services.$logger.clearScreen();

	spinner.warn(
		`This will run "${color.yellow(
			`ns clean`,
		)}" in all the selected projects and ${color.styleText(
			["red", "bold"],
			"delete files from your system",
		)}!`,
	);
	spinner.warn(`This action cannot be undone!`);

	let confirmed = await services.$prompter.confirm(
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

		const ok = await services.$childProcess
			.exec(
				`node ${services.$staticConfig.cliBinPath} clean ${
					context.options.dryRun ? "--dry-run" : ""
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
				services.$logger.trace(
					'Failed to clean project "%s"',
					currentPath,
					err,
				);
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

	if (context.options.dryRun) {
		spinner.info(
			'Note: the "--dry-run" flag was used, so no files were actually deleted.',
		);
	}
}

export async function runCleanCommand(
	context: CleanCommandContext,
	services: ICleanCommandServices,
): Promise<void> {
	const isDryRun = context.options.dryRun ?? false;
	const isJSON = context.options.json ?? false;

	const spinner = services.$terminalSpinnerService.createSpinner({
		isSilent: isJSON,
	});

	if (!services.$projectService.isValidNativeScriptProject()) {
		return cleanMultipleProjects(context, services, spinner);
	}

	spinner.start("Cleaning project...\n");

	let pathsToClean = [
		constants.HOOKS_DIR_NAME,
		services.$projectData.getBuildRelativeDirectoryPath(),
		constants.NODE_MODULES_FOLDER_NAME,
	];

	try {
		const overridePathsToClean =
			services.$projectConfigService.getValue("cli.pathsToClean");
		const additionalPaths = services.$projectConfigService.getValue(
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

	const res = await services.$projectCleanupService.clean(pathsToClean, {
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

export const cleanCommandDefinition = defineCommand({
	name: "clean",
	description: "Cleans the project's build artefacts and dependencies.",
	options: cleanCommandOptions,
	arguments: "none",
	setup: setupCleanCommand,
	run: runCleanCommand,
});

registerCommand(cleanCommandDefinition);
