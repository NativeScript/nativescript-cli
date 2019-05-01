import * as path from "path";
import * as child_process from "child_process";
import { EventEmitter } from "events";

export class WebpackCompilerService extends EventEmitter implements IWebpackCompilerService {
	private webpackProcesses: IDictionary<child_process.ChildProcess> = {};

	constructor(
		private $childProcess: IChildProcess
	) { super(); }

	public async compileWithWatch(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<any> {
		return new Promise((resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			let isFirstWebpackWatchCompilation = true;
			config.watch = true;
			const childProcess = this.startWebpackProcess(platformData, projectData, config);

			childProcess.on("message", (message: any) => {
				if (message === "Webpack compilation complete.") {
					resolve(childProcess);
				}

				if (message.emittedFiles) {
					if (isFirstWebpackWatchCompilation) {
						isFirstWebpackWatchCompilation = false;
						return;
					}

					const files = message.emittedFiles
						.filter((file: string) => file.indexOf("App_Resources") === -1)
						.map((file: string) => path.join(platformData.appDestinationDirectoryPath, "app", file));
					console.log("===================== BEFORE EMIT webpack files ", files);
					this.emit("webpackEmittedFiles", files);
				}
			});

			childProcess.on("close", (arg: any) => {
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;
				console.log("=========== WEBPACK EXIT WITH CODE ========== ", exitCode);
				if (exitCode === 0) {
					resolve(childProcess);
				} else {
					const error = new Error(`Executing webpack failed with exit code ${exitCode}.`);
					error.code = exitCode;
					reject(error);
				}
			});
		});
	}

	public async compileWithoutWatch(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			const childProcess = this.startWebpackProcess(platformData, projectData, config);
			childProcess.on("close", (arg: any) => {
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;
				console.log("=========== WEBPACK EXIT WITH CODE ========== ", exitCode);
				if (exitCode === 0) {
					resolve();
				} else {
					const error = new Error(`Executing webpack failed with exit code ${exitCode}.`);
					error.code = exitCode;
					reject(error);
				}
			});
		});
	}

	private startWebpackProcess(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): child_process.ChildProcess {
		const args = [
			path.join(projectData.projectDir, "node_modules", "webpack", "bin", "webpack.js"),
			"--preserve-symlinks",
			`--config=${path.join(projectData.projectDir, "webpack.config.js")}`,
			`--env.${platformData.normalizedPlatformName.toLowerCase()}`
		];

		if (config.watch) {
			args.push("--watch");
		}

		// TODO: provide env variables

		const stdio = config.watch ? ["inherit", "inherit", "inherit", "ipc"] : "inherit";
		const childProcess = this.$childProcess.spawn("node", args, { cwd: projectData.projectDir, stdio });

		this.webpackProcesses[platformData.platformNameLowerCase] = childProcess;

		return childProcess;
	}
}
$injector.register("webpackCompilerService", WebpackCompilerService);
