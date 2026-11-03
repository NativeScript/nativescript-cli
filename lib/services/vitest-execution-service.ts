import * as path from "path";
import { IProjectData, IVitestExecutionService } from "../definitions/project";
import { IOptions, IPackageManager } from "../declarations";
import { IChildProcess, IErrors, IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";

const VITEST_CONFIG_FILES = [
	"vitest.config.mts",
	"vitest.config.ts",
	"vitest.config.mjs",
	"vitest.config.js",
];

export class VitestExecutionService implements IVitestExecutionService {
	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $options: IOptions,
		private $packageManager: IPackageManager,
	) {}

	public isVitestProject(projectData: IProjectData): boolean {
		return !!this.getConfigPath(projectData);
	}

	public canStartTestRun(projectData: IProjectData): boolean {
		return (
			this.isVitestProject(projectData) &&
			!!this.getVitestPackagePath(projectData)
		);
	}

	public async startTestRun(
		platform: string,
		projectData: IProjectData,
	): Promise<void> {
		const vitestPackagePath = this.getVitestPackagePath(projectData);
		if (!vitestPackagePath) {
			this.$errors.fail(
				"Unable to find 'vitest' in the project. Run '$ ns test init --framework vitest' first.",
			);
		}

		if (this.$options.watch) {
			this.$logger.warn(
				"'--watch' is not supported for on-device Vitest runs yet; running once.",
			);
		}

		const args = [path.join(vitestPackagePath, "vitest.mjs"), "run"];
		if (this.$options.env && this.$options.env.codeCoverage) {
			args.push("--coverage");
		}

		const env: NodeJS.ProcessEnv = {
			...process.env,
			NS_PLATFORM: platform.toLowerCase(),
		};
		if (this.$options.device) {
			env.NS_DEVICE = this.$options.device;
		}

		const result = await this.$childProcess.spawnFromEvent(
			process.execPath,
			args,
			"close",
			{
				cwd: projectData.projectDir,
				stdio: "inherit",
				env,
			},
			{ throwError: false },
		);

		if (result.exitCode !== 0) {
			this.$errors.fail("Test run failed.");
		}
	}

	private getConfigPath(projectData: IProjectData): string {
		for (const configFile of VITEST_CONFIG_FILES) {
			const configPath = path.join(projectData.projectDir, configFile);
			if (this.$fs.exists(configPath)) {
				return configPath;
			}
		}
		return null;
	}

	private getVitestPackagePath(projectData: IProjectData): string {
		return this.$packageManager.getInstalledPackagePath(
			"vitest",
			projectData.projectDir,
		);
	}

}

injector.register("vitestExecutionService", VitestExecutionService);
