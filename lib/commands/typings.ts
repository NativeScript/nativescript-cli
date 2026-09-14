import { glob } from "node:fs/promises";
import { homedir } from "os";
import * as path from "path";
import { PromptObject } from "prompts";
import { color } from "../color";
import { IChildProcess, IFileSystem, IHostInfo } from "../common/declarations";
import {
	Command,
	CommandOptionsSchema,
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

export class TypingsCommand extends Command({
	name: "typings",
	description: "Generates typings for the native platform APIs.",
	options: typingsCommandOptions,
	// Only the first argument is read; the rest are gradle targets this command
	// takes off the raw argv, so the policy must not reject them.
	arguments: "any",
}) {
	private $childProcess = inject<IChildProcess>("childProcess");
	private $fs = inject<IFileSystem>("fs");
	private $hostInfo = inject<IHostInfo>("hostInfo");
	private $logger = inject<ILogger>("logger");
	private $mobileHelper = inject<Mobile.IMobileHelper>("mobileHelper");
	private $options = inject<IOptions>("options");
	private $projectData = inject<IProjectData>("projectData");
	private $prompter = inject<IPrompter>("prompter");
	private $staticConfig = inject<IStaticConfig>("staticConfig");

	public canExecute(): boolean {
		this.$mobileHelper.validatePlatformName(this.args[0]);
		return true;
	}

	public async run(): Promise<void> {
		const platform = this.args[0];
		let result;
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			result = await this.handleAndroidTypings();
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			result = await this.handleiOSTypings();
		}
		let typingsFolder = "./typings";
		if (this.options.copyTo) {
			this.$fs.copyFile(
				path.resolve(this.$projectData.projectDir, "typings"),
				this.options.copyTo,
			);
			typingsFolder = this.options.copyTo;
		}

		if (result !== false) {
			this.$logger.info(
				"Typings have been generated in the following directory:",
				typingsFolder,
			);
		}
	}

	private async resolveGradleDependencies(target: string) {
		const gradleHome = path.resolve(
			process.env.GRADLE_USER_HOME ?? path.join(homedir(), `/.gradle`),
		);
		const gradleFiles = path.resolve(gradleHome, "caches/modules-2/files-2.1/");

		if (!this.$fs.exists(gradleFiles)) {
			this.$logger.warn("No gradle files found");
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
			this.$logger.warn("No files found");
			return [];
		}

		this.$logger.clearScreen();

		const choices = await this.$prompter.promptForChoice(
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

		this.$logger.clearScreen();

		return items
			.filter((item) => choices.includes(item.id))
			.map((item) => item.path);
	}

	private async handleAndroidTypings() {
		// The gradle targets are positional arguments this command reads off the
		// raw argv rather than declaring, so that they keep working alongside the
		// --jar and --aar flags.
		const targets = this.$options.argv._.slice(2) ?? [];
		const paths: string[] = [];

		if (targets.length) {
			for (const target of targets) {
				try {
					paths.push(...(await this.resolveGradleDependencies(target)));
				} catch (err) {
					this.$logger.trace(
						`Failed to resolve gradle dependencies for target "${target}"`,
						err,
					);
				}
			}
		}

		if (!paths.length && !(this.options.jar || this.options.aar)) {
			this.$logger.warn(
				[
					"No .jar or .aar file specified. Please specify at least one of the following:",
					"  - path to .jar file with --jar <jar>",
					"  - path to .aar file with --aar <aar>",
				].join("\n"),
			);
			return false;
		}

		this.$fs.ensureDirectoryExists(
			path.resolve(this.$projectData.projectDir, "typings", "android"),
		);

		const dtsGeneratorPath = path.resolve(
			this.$projectData.platformsDir,
			"android",
			"build-tools",
			"dts-generator.jar",
		);
		if (!this.$fs.exists(dtsGeneratorPath)) {
			this.$logger.warn("No platforms folder found, preparing project now...");
			await this.$childProcess.spawnFromEvent(
				this.$hostInfo.isWindows ? "ns.cmd" : "ns",
				["prepare", "android"],
				"exit",
				{ stdio: "inherit", shell: this.$hostInfo.isWindows },
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
			...asArray(this.options.jar),
			...asArray(this.options.aar),
			...paths,
		];

		await this.$childProcess.spawnFromEvent(
			"java",
			[
				"-jar",
				dtsGeneratorPath,
				"-input",
				...inputs,
				"-output",
				path.resolve(this.$projectData.projectDir, "typings", "android"),
			],
			"exit",
			{ stdio: "inherit" },
		);
	}

	private async handleiOSTypings() {
		if (this.options.filter !== undefined) {
			this.$logger.warn("--filter flag is not supported yet.");
		}

		this.$fs.ensureDirectoryExists(
			path.resolve(this.$projectData.projectDir, "typings", "ios"),
		);

		await this.$childProcess.spawnFromEvent(
			"node",
			[this.$staticConfig.cliBinPath, "build", "ios"],
			"exit",
			{
				env: {
					...process.env,
					TNS_TYPESCRIPT_DECLARATIONS_PATH: path.resolve(
						this.$projectData.projectDir,
						"typings",
						"ios",
					),
				},
				stdio: "inherit",
			},
		);
	}
}
