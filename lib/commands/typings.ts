import { glob } from "node:fs/promises";
import { homedir } from "os";
import * as path from "path";
import { PromptObject } from "prompts";
import { color } from "../color";
import { IChildProcess, IFileSystem, IHostInfo } from "../common/declarations";
import {
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { IOptions, IStaticConfig } from "../declarations";
import { IProjectData } from "../definitions/project";

const typingsCommandOptions = {
	aar: stringOption(),
	copyTo: stringOption(),
	filter: stringOption(),
	jar: stringOption(),
} satisfies CommandOptionsSchema;

export type TypingsCommandContext = CommandContext<
	typeof typingsCommandOptions
>;

export interface ITypingsCommandServices {
	$childProcess: IChildProcess;
	$fs: IFileSystem;
	$hostInfo: IHostInfo;
	$logger: ILogger;
	$mobileHelper: Mobile.IMobileHelper;
	$options: IOptions;
	$projectData: IProjectData;
	$prompter: IPrompter;
	$staticConfig: IStaticConfig;
}

export function setupTypingsCommand(): ITypingsCommandServices {
	return {
		$childProcess: inject<IChildProcess>("childProcess"),
		$fs: inject<IFileSystem>("fs"),
		$hostInfo: inject<IHostInfo>("hostInfo"),
		$logger: inject<ILogger>("logger"),
		$mobileHelper: inject<Mobile.IMobileHelper>("mobileHelper"),
		$options: inject<IOptions>("options"),
		$projectData: inject<IProjectData>("projectData"),
		$prompter: inject<IPrompter>("prompter"),
		$staticConfig: inject<IStaticConfig>("staticConfig"),
	};
}

async function resolveGradleDependencies(
	services: ITypingsCommandServices,
	target: string,
) {
	const gradleHome = path.resolve(
		process.env.GRADLE_USER_HOME ?? path.join(homedir(), `/.gradle`),
	);
	const gradleFiles = path.resolve(gradleHome, "caches/modules-2/files-2.1/");

	if (!services.$fs.exists(gradleFiles)) {
		services.$logger.warn("No gradle files found");
		return;
	}

	const pattern = `${target.replaceAll(":", "/")}/**/*.{jar,aar}`;

	const items = [];
	for await (const item of glob(pattern, {
		cwd: gradleFiles,
	})) {
		const [group, artifact, version, sha1, file] = item.split(path.sep);
		items.push({
			id: sha1 + version,
			group,
			artifact,
			version,
			sha1,
			file,
			path: path.resolve(gradleFiles, item),
		});
	}

	if (items.length === 0) {
		services.$logger.warn("No files found");
		return [];
	}

	services.$logger.clearScreen();

	const choices = await services.$prompter.promptForChoice(
		`Select dependencies to generate typings for (${color.greenBright(
			target,
		)})`,
		items
			.sort((a, b) => {
				if (a.artifact < b.artifact) return -1;
				if (a.artifact > b.artifact) return 1;

				return a.version.localeCompare(b.version, undefined, {
					numeric: true,
					sensitivity: "base",
				});
			})
			.map((item) => {
				return {
					title: `${color.white(item.group)}:${color.greenBright(
						item.artifact,
					)}:${color.yellow(item.version)} - ${color.styleText(
						["cyanBright", "bold"],
						item.file,
					)}`,
					value: item.id,
				};
			}),
		true,
		{
			optionsPerPage: process.stdout.rows - 6, // 6 lines are taken up by the instructions
		} as Partial<PromptObject>,
	);

	services.$logger.clearScreen();

	return items
		.filter((item) => choices.includes(item.id))
		.map((item) => item.path);
}

async function handleAndroidTypings(
	context: TypingsCommandContext,
	services: ITypingsCommandServices,
) {
	// The gradle targets are positional arguments this command reads off the
	// raw argv rather than declaring, so that they keep working alongside the
	// --jar and --aar flags.
	const targets = services.$options.argv._.slice(2) ?? [];
	const paths: string[] = [];

	if (targets.length) {
		for (const target of targets) {
			try {
				paths.push(...(await resolveGradleDependencies(services, target)));
			} catch (err) {
				services.$logger.trace(
					`Failed to resolve gradle dependencies for target "${target}"`,
					err,
				);
			}
		}
	}

	if (!paths.length && !(context.options.jar || context.options.aar)) {
		services.$logger.warn(
			[
				"No .jar or .aar file specified. Please specify at least one of the following:",
				"  - path to .jar file with --jar <jar>",
				"  - path to .aar file with --aar <aar>",
			].join("\n"),
		);
		return false;
	}

	services.$fs.ensureDirectoryExists(
		path.resolve(services.$projectData.projectDir, "typings", "android"),
	);

	const dtsGeneratorPath = path.resolve(
		services.$projectData.platformsDir,
		"android",
		"build-tools",
		"dts-generator.jar",
	);
	if (!services.$fs.exists(dtsGeneratorPath)) {
		services.$logger.warn(
			"No platforms folder found, preparing project now...",
		);
		await services.$childProcess.spawnFromEvent(
			services.$hostInfo.isWindows ? "ns.cmd" : "ns",
			["prepare", "android"],
			"exit",
			{ stdio: "inherit", shell: services.$hostInfo.isWindows },
		);
	}

	const asArray = (input: string | string[]) => {
		if (!input) {
			return [];
		}

		if (typeof input === "string") {
			return [input];
		}

		return input;
	};

	const inputs: string[] = [
		...asArray(context.options.jar),
		...asArray(context.options.aar),
		...paths,
	];

	await services.$childProcess.spawnFromEvent(
		"java",
		[
			"-jar",
			dtsGeneratorPath,
			"-input",
			...inputs,
			"-output",
			path.resolve(services.$projectData.projectDir, "typings", "android"),
		],
		"exit",
		{ stdio: "inherit" },
	);
}

async function handleiOSTypings(
	context: TypingsCommandContext,
	services: ITypingsCommandServices,
) {
	if (context.options.filter !== undefined) {
		services.$logger.warn("--filter flag is not supported yet.");
	}

	services.$fs.ensureDirectoryExists(
		path.resolve(services.$projectData.projectDir, "typings", "ios"),
	);

	await services.$childProcess.spawnFromEvent(
		"node",
		[services.$staticConfig.cliBinPath, "build", "ios"],
		"exit",
		{
			env: {
				...process.env,
				TNS_TYPESCRIPT_DECLARATIONS_PATH: path.resolve(
					services.$projectData.projectDir,
					"typings",
					"ios",
				),
			},
			stdio: "inherit",
		},
	);
}

export function canExecuteTypingsCommand(
	context: TypingsCommandContext,
	services: ITypingsCommandServices,
): boolean {
	services.$mobileHelper.validatePlatformName(context.args[0]);
	return true;
}

export async function runTypingsCommand(
	context: TypingsCommandContext,
	services: ITypingsCommandServices,
): Promise<void> {
	const platform = context.args[0];
	let result;
	if (services.$mobileHelper.isAndroidPlatform(platform)) {
		result = await handleAndroidTypings(context, services);
	} else if (services.$mobileHelper.isiOSPlatform(platform)) {
		result = await handleiOSTypings(context, services);
	}
	let typingsFolder = "./typings";
	if (context.options.copyTo) {
		services.$fs.copyFile(
			path.resolve(services.$projectData.projectDir, "typings"),
			context.options.copyTo,
		);
		typingsFolder = context.options.copyTo;
	}

	if (result !== false) {
		services.$logger.info(
			"Typings have been generated in the following directory:",
			typingsFolder,
		);
	}
}

export const typingsCommandDefinition = defineCommand({
	name: "typings",
	description: "Generates typings for the native platform APIs.",
	options: typingsCommandOptions,
	// Only the first argument is read; the rest are gradle targets this command
	// takes off the raw argv, so the policy must not reject them.
	arguments: "any",
	setup: setupTypingsCommand,
	canExecute: canExecuteTypingsCommand,
	run: runTypingsCommand,
});
