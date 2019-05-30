import * as path from "path";
import * as child_process from "child_process";
import { EventEmitter } from "events";
import { performanceLog } from "../../common/decorators";
import { hook } from "../../common/helpers";
import { WEBPACK_COMPILATION_COMPLETE } from "../../constants";

export class WebpackCompilerService extends EventEmitter implements IWebpackCompilerService {
	private webpackProcesses: IDictionary<child_process.ChildProcess> = {};

	constructor(
		private $childProcess: IChildProcess,
		public $hooksService: IHooksService,
		private $logger: ILogger
	) { super(); }

	public async compileWithWatch(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<any> {
		return new Promise(async (resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			let isFirstWebpackWatchCompilation = true;
			config.watch = true;
			const childProcess = await this.startWebpackProcess(platformData, projectData, config);

			childProcess.on("message", (message: any) => {
				if (message === "Webpack compilation complete.") {
					this.$logger.info("Webpack build done!");
					resolve(childProcess);
				}

				if (message.emittedFiles) {
					if (isFirstWebpackWatchCompilation) {
						isFirstWebpackWatchCompilation = false;
						return;
					}

					const result = this.getUpdatedEmittedFiles(message.emittedFiles);

					const files = result.emittedFiles
						.filter((file: string) => file.indexOf("App_Resources") === -1)
						.map((file: string) => path.join(platformData.appDestinationDirectoryPath, "app", file));

					const data = {
						files,
						hmrData: {
							hash: result.hash,
							fallbackFiles: result.fallbackFiles
						}
					};

					this.emit(WEBPACK_COMPILATION_COMPLETE, data);
				}
			});

			childProcess.on("close", (arg: any) => {
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;
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
		return new Promise(async (resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			const childProcess = await this.startWebpackProcess(platformData, projectData, config);
			childProcess.on("close", (arg: any) => {
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;
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

	public stopWebpackCompiler(platform: string): void {
		if (platform) {
			this.stopWebpackForPlatform(platform);
		} else {
			Object.keys(this.webpackProcesses).forEach(pl => this.stopWebpackForPlatform(pl));
		}
	}

	@performanceLog()
	@hook('prepareJSApp')
	private async startWebpackProcess(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<child_process.ChildProcess> {
		const envData = this.buildEnvData(platformData.platformNameLowerCase, config.env, projectData);
		const envParams = this.buildEnvCommandLineParams(envData, platformData);

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

	private buildEnvData(platform: string, env: any, projectData: IProjectData) {
		const envData = Object.assign({},
			env,
			{ [platform.toLowerCase()]: true }
		);

		const appPath = projectData.getAppDirectoryRelativePath();
		const appResourcesPath = projectData.getAppResourcesRelativeDirectoryPath();

		Object.assign(envData,
			appPath && { appPath },
			appResourcesPath && { appResourcesPath }
		);

		return envData;
	}

	private buildEnvCommandLineParams(envData: any, platformData: IPlatformData) {
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

				envValue.map((value: any) => args.push(`--env.${item}=${value}`));
			}
		});

		return args;
	}

	private getUpdatedEmittedFiles(emittedFiles: string[]) {
		let fallbackFiles: string[] = [];
		let hotHash;
		if (emittedFiles.some(x => x.endsWith('.hot-update.json'))) {
			let result = emittedFiles.slice();
			const hotUpdateScripts = emittedFiles.filter(x => x.endsWith('.hot-update.js'));
			hotUpdateScripts.forEach(hotUpdateScript => {
				const { name, hash } = this.parseHotUpdateChunkName(hotUpdateScript);
				hotHash = hash;
				// remove bundle/vendor.js files if there's a bundle.XXX.hot-update.js or vendor.XXX.hot-update.js
				result = result.filter(file => file !== `${name}.js`);
			});
			//if applying of hot update fails, we must fallback to the full files
			fallbackFiles = emittedFiles.filter(file => result.indexOf(file) === -1);
			return { emittedFiles: result, fallbackFiles, hash: hotHash };
		}

		return { emittedFiles, fallbackFiles };
	}

	private parseHotUpdateChunkName(name: string) {
		const matcher = /^(.+)\.(.+)\.hot-update/gm;
		const matches = matcher.exec(name);
		return {
			name: matches[1] || "",
			hash: matches[2] || "",
		};
	}

	private stopWebpackForPlatform(platform: string) {
		this.$logger.trace(`Stopping webpack watch for platform ${platform}.`);
		const webpackProcess = this.webpackProcesses[platform];
		if (webpackProcess) {
			webpackProcess.kill("SIGINT");
			delete this.webpackProcesses[platform];
		}
	}
}
$injector.register("webpackCompilerService", WebpackCompilerService);
