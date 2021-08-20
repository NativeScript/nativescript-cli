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
		private $hostInfo: IHostInfo,
	) {}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0];

		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			await this.handleAndroidTypings();
		}

		if (this.$mobileHelper.isiOSPlatform(platform)) {
			await this.handleiOSTypings();
		}
		let typingsFolder = "./typings";
		if (this.$options.copyTo) {
			this.$fs.copyFile(
				path.resolve(this.$projectData.projectDir, "typings"),
				this.$options.copyTo
			);
			typingsFolder = this.$options.copyTo;
		}
		this.$logger.info(
			"Typings have been generated in the following directory:",
			typingsFolder
		);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const platform = args[0];
		this.$mobileHelper.validatePlatformName(platform);
		return true;
	}

	private async handleAndroidTypings() {
		if (this.$options.aar) {
			return this.$logger.warn(`Open the .aar archive
Extract the classes.jar and any dependencies it may have inside libs/
Rename classes.jar if necessary

ns typings android --jar classes.jar --jar dependency-of-classes-jar.jar
			`);
		} else if (!this.$options.jar) {
			return this.$logger.warn(
				"No .jar file specified. Please specify a .jar file with --jar <Jar>."
			);
		}

		this.$fs.ensureDirectoryExists(
			path.resolve(this.$projectData.projectDir, "typings", "android")
		);

		const dtsGeneratorPath = path.resolve(
			this.$projectData.projectDir,
			"platforms",
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

		if (this.$options.jar) {
			const jars: string[] =
				typeof this.$options.jar === "string"
					? [this.$options.jar]
					: this.$options.jar;
			await this.$childProcess.spawnFromEvent(
				"java",
				[
					"-jar",
					dtsGeneratorPath,
					"-input",
					...jars,
					"-output",
					path.resolve(this.$projectData.projectDir, "typings", "android"),
				],
				"exit",
				{ stdio: "inherit" }
			);
		}
	}

	private async handleiOSTypings() {
		if (this.$options.filter !== undefined) {
			this.$logger.warn("--filter flag is not supported yet.");
		}

		this.$fs.ensureDirectoryExists(
			path.resolve(this.$projectData.projectDir, "typings", "ios")
		);

		await this.$childProcess.spawnFromEvent("ns", ["build", "ios"], "exit", {
			env: {
				...process.env,
				TNS_TYPESCRIPT_DECLARATIONS_PATH: path.resolve(
					this.$projectData.projectDir,
					"typings",
					"ios"
				),
			},
			stdio: "inherit",
		});
	}
}

injector.registerCommand("typings", TypingsCommand);
