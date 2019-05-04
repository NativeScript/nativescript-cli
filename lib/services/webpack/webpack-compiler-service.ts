import * as path from "path";
import * as child_process from "child_process";
import { EventEmitter } from "events";

export class WebpackCompilerService extends EventEmitter implements IWebpackCompilerService {
	private webpackProcesses: IDictionary<child_process.ChildProcess> = {};

	constructor(
		private $childProcess: IChildProcess,
		private $projectData: IProjectData
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
		const envData = this.buildEnvData(platformData.platformNameLowerCase, config.env);
		const envParams = this.buildEnvCommandLineParams(envData);

		const args = [
			path.join(projectData.projectDir, "node_modules", "webpack", "bin", "webpack.js"),
			"--preserve-symlinks",
			`--config=${path.join(projectData.projectDir, "webpack.config.js")}`,
			...envParams
		];

		if (config.watch) {
			args.push("--watch");
		}

		const stdio = config.watch ? ["inherit", "inherit", "inherit", "ipc"] : "inherit";
		const childProcess = this.$childProcess.spawn("node", args, { cwd: projectData.projectDir, stdio });

		this.webpackProcesses[platformData.platformNameLowerCase] = childProcess;

		return childProcess;
	}

	private buildEnvData(platform: string, env: any) {
		const envData = Object.assign({},
			env,
			{ [platform.toLowerCase()]: true }
		);

		const appPath = this.$projectData.getAppDirectoryRelativePath();
		const appResourcesPath = this.$projectData.getAppResourcesRelativeDirectoryPath();
		Object.assign(envData,
			appPath && { appPath },
			appResourcesPath && { appResourcesPath }
		);

		return envData;
	}

	private buildEnvCommandLineParams(envData: any) {
		const envFlagNames = Object.keys(envData);
		// const snapshotEnvIndex = envFlagNames.indexOf("snapshot");
		// if (snapshotEnvIndex > -1 && !utils.shouldSnapshot(config)) {
		// 	logSnapshotWarningMessage($logger);
		// 	envFlagNames.splice(snapshotEnvIndex, 1);
		// }

		const args: any[] = [];
		envFlagNames.map(item => {
			let envValue = envData[item];
			if (typeof envValue === "undefined") {
				return;
			}
			if (typeof envValue === "boolean") {
				if (envValue) {
					args.push(`--env.${item}`);
				}
			} else {
				if (!Array.isArray(envValue)) {
					envValue = [envValue];
				}

				envValue.map((value: any) => args.push(`--env.${item}=${value}`))
			}
		});

		return args;
	}
}
$injector.register("webpackCompilerService", WebpackCompilerService);
