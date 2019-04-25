import * as path from "path";
import { EventEmitter } from "events";

export class WebpackCompilerService extends EventEmitter implements IWebpackCompilerService {
	constructor(
		private $childProcess: IChildProcess
	) {
		super();
	}

	// TODO: Consider to introduce two methods -> compile and startWebpackWatcher
	public async startWatcher(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void> {
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

		return new Promise((resolve, reject) => {
			const childProcess = this.$childProcess.spawn("node", args, { cwd: projectData.projectDir, stdio });
			if (config.watch) {
				childProcess.on("message", (message: any) => {
					if (message === "Webpack compilation complete.") {
						resolve();
					}

					if (message.emittedFiles) {
						const files = message.emittedFiles
							.filter((file: string) => file.indexOf("App_Resources") === -1)
							.map((file: string) => path.join(platformData.appDestinationDirectoryPath, "app", file))
						this.emit("webpackEmittedFiles", files);
					}
				});
			}

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
}
$injector.register("webpackCompilerService", WebpackCompilerService);
