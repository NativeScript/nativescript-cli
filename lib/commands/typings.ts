import { IOptions } from "../declarations";
import { IChildProcess, IFileSystem, IHostInfo } from "../common/declarations";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import { IProjectData } from "../definitions/project";
import * as path from "path";

export class TypingsCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];
	constructor(
		private $logger: ILogger,
		private $options: IOptions,
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $mobileHelper: Mobile.IMobileHelper,
		private $childProcess: IChildProcess,
		private $hostInfo: IHostInfo
	) {}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0];
		let result;
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			result = await this.handleAndroidTypings();
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			result = await this.handleiOSTypings();
		}
		let typingsFolder = "./typings";
		if (this.$options.copyTo) {
			this.$fs.copyFile(
				path.resolve(this.$projectData.projectDir, "typings"),
				this.$options.copyTo
			);
			typingsFolder = this.$options.copyTo;
		}

		if (result !== false) {
			this.$logger.info(
				"Typings have been generated in the following directory:",
				typingsFolder
			);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = args[0];
		this.$mobileHelper.validatePlatformName(platform);
		return true;
	}

	private async handleAndroidTypings() {
		if (!(this.$options.jar || this.$options.aar)) {
			this.$logger.warn(
				[
					"No .jar or .aar file specified. Please specify at least one of the following:",
					"  - path to .jar file with --jar <jar>",
					"  - path to .aar file with --aar <aar>",
				].join("\n")
			);
			return false;
		}

		this.$fs.ensureDirectoryExists(
			path.resolve(this.$projectData.projectDir, "typings", "android")
		);

		const dtsGeneratorPath = path.resolve(
			this.$projectData.projectDir,
			this.$projectData.getBuildRelativeDirectoryPath(),
			"android",
			"build-tools",
			"dts-generator.jar"
		);
		if (!this.$fs.exists(dtsGeneratorPath)) {
			this.$logger.warn("No platforms folder found, preparing project now...");
			await this.$childProcess.spawnFromEvent(
				this.$hostInfo.isWindows ? "ns.cmd" : "ns",
				["prepare", "android"],
				"exit",
				{ stdio: "inherit" }
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
			...asArray(this.$options.jar),
			...asArray(this.$options.aar),
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
			{ stdio: "inherit" }
		);
	}

	private async handleiOSTypings() {
		if (this.$options.filter !== undefined) {
			this.$logger.warn("--filter flag is not supported yet.");
		}

		this.$fs.ensureDirectoryExists(
			path.resolve(this.$projectData.projectDir, "typings", "ios")
		);

		const nsPath = path.resolve(__dirname, "../../bin/nativescript.js");

		await this.$childProcess.spawnFromEvent(
			"node",
			[nsPath, "build", "ios"],
			"exit",
			{
				env: {
					...process.env,
					TNS_TYPESCRIPT_DECLARATIONS_PATH: path.resolve(
						this.$projectData.projectDir,
						"typings",
						"ios"
					),
				},
				stdio: "inherit",
			}
		);
	}
}

injector.registerCommand("typings", TypingsCommand);
