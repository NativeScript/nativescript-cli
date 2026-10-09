import * as path from "path";
import { IChildProcess, IErrors, IFileSystem } from "../common/declarations";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import { IProjectData } from "../definitions/project";
import { CompiledReleaseService } from "../services/compiled-release-service";

/**
 * `ns compiled verify [ios]`: builds the JavaScript release and the compiled
 * release of the project, runs both the same way on one simulator and compares
 * them, a screenshot of each step pixel by pixel and whether either stops
 * running. The steps are the project's `verify.json`, when it has one
 * (`{ "screens": [{ "name": "home", "steps": [["shot", "start"], ["tap", 200, 400], ["shot", "tapped"]] }] }`);
 * without it, a screenshot once the app settles.
 */
export class CompiledVerifyCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $childProcess: IChildProcess,
		private $compiledReleaseService: CompiledReleaseService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectData: IProjectData,
	) {}

	public async execute(args: string[]): Promise<void> {
		const platform = (args[0] ?? "ios").toLowerCase();
		if (platform !== "ios") {
			this.$errors.fail(
				"ns compiled verify compares iOS builds; Android is to follow.",
			);
		}
		this.$projectData.initializeProjectData();
		const projectDir = this.$projectData.projectDir;
		const cli = process.argv[1];
		const ns = (...buildArgs: string[]) =>
			this.$childProcess.spawnFromEvent(
				process.execPath,
				[cli, "build", "ios", ...buildArgs],
				"close",
				{ cwd: projectDir, stdio: "inherit" },
			);

		this.$logger.info("Building the JavaScript release...");
		await ns("--release", "--no-compiled");
		this.$logger.info("Building the compiled release...");
		await ns("--compiled");

		const js = this.findApp(
			path.join(this.$projectData.platformsDir, "ios", "build", "Release-iphonesimulator"),
		);
		const compiled = this.findApp(
			path.join(this.$projectData.platformsDir, "compiled", "ios", "DerivedData", "Build", "Products", "Release-iphonesimulator"),
		);
		const steps = path.join(projectDir, "verify.json");
		const out = path.join(this.$projectData.platformsDir, "compiled", "verify");
		const verify = this.$compiledReleaseService.getCompilerBin(
			this.$projectData,
			"ns-compiled-verify",
		);
		try {
			await this.$childProcess.spawnFromEvent(
				process.execPath,
				[verify, "--js", js, "--compiled", compiled, "--out", out, ...(this.$fs.exists(steps) ? ["--steps", steps] : [])],
				"close",
				{ cwd: projectDir, stdio: "inherit" },
			);
		} catch {
			this.$errors.fail(
				`The compiled release differs from its JavaScript release: see ${out}`,
			);
		}
	}

	private findApp(dir: string): string {
		const app = this.$fs.exists(dir)
			? this.$fs.readDirectory(dir).find((f) => f.endsWith(".app"))
			: undefined;
		if (!app) {
			this.$errors.fail(`No simulator build in ${dir}.`);
		}

		return path.join(dir, app);
	}
}

injector.registerCommand("compiled|verify", CompiledVerifyCommand);
