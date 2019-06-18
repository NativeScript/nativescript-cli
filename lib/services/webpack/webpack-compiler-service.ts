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
		public $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $pluginsService: IPluginsService,
		private $mobileHelper: Mobile.IMobileHelper
	) { super(); }

	public async compileWithWatch(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<any> {
		return new Promise(async (resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			let isFirstWebpackWatchCompilation = true;
			prepareData.watch = true;
			const childProcess = await this.startWebpackProcess(platformData, projectData, prepareData);

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

					const result = this.getUpdatedEmittedFiles(message.emittedFiles, message.webpackRuntimeFiles, message.entryPointFiles);

					const files = result.emittedFiles
						.map((file: string) => path.join(platformData.appDestinationDirectoryPath, "app", file));
					const fallbackFiles = result.fallbackFiles
						.map((file: string) => path.join(platformData.appDestinationDirectoryPath, "app", file));

					const data = {
						files,
						hmrData: {
							hash: result.hash,
							fallbackFiles
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

	public async compileWithoutWatch(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<void> {
		return new Promise(async (resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			const childProcess = await this.startWebpackProcess(platformData, projectData, prepareData);
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
	private async startWebpackProcess(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<child_process.ChildProcess> {
		const envData = this.buildEnvData(platformData.platformNameLowerCase, projectData, prepareData);
		const envParams = this.buildEnvCommandLineParams(envData, platformData, prepareData);

		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);

		const args = [
			path.join(projectData.projectDir, "node_modules", "webpack", "bin", "webpack.js"),
			"--preserve-symlinks",
			`--config=${path.join(projectData.projectDir, "webpack.config.js")}`,
			...envParams
		];

		if (process.arch === "x64") {
			args.push("--max_old_space_size=4096");
		}

		if (prepareData.watch) {
			args.push("--watch");
		}

		const stdio = prepareData.watch ? ["inherit", "inherit", "inherit", "ipc"] : "inherit";
		const childProcess = this.$childProcess.spawn("node", args, { cwd: projectData.projectDir, stdio });

		this.webpackProcesses[platformData.platformNameLowerCase] = childProcess;

		return childProcess;
	}

	private buildEnvData(platform: string, projectData: IProjectData, prepareData: IPrepareData) {
		const { env } = prepareData;
		const envData = Object.assign({},
			env,
			{ [platform.toLowerCase()]: true }
		);

		const appPath = projectData.getAppDirectoryRelativePath();
		const appResourcesPath = projectData.getAppResourcesRelativeDirectoryPath();

		Object.assign(envData,
			appPath && { appPath },
			appResourcesPath && { appResourcesPath },
		);

		envData.verbose = this.$logger.isVerbose();
		envData.production = prepareData.release;
		if (prepareData.env && (prepareData.env.sourceMap === false || prepareData.env.sourceMap === 'false')) {
			delete envData.sourceMap;
		} else if (!prepareData.release) {
			envData.sourceMap = true;
		}

		return envData;
	}

	private buildEnvCommandLineParams(envData: any, platformData: IPlatformData, prepareData: IPrepareData) {
		const envFlagNames = Object.keys(envData);
		const shouldSnapshot = prepareData.release && !this.$hostInfo.isWindows && this.$mobileHelper.isAndroidPlatform(platformData.normalizedPlatformName);
		if (envData && envData.snapshot && !shouldSnapshot) {
			this.$logger.warn("Stripping the snapshot flag. " +
				"Bear in mind that snapshot is only available in release builds and " +
				"is NOT available on Windows systems.");
			envFlagNames.splice(envFlagNames.indexOf("snapshot"), 1);
		}

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

	private getUpdatedEmittedFiles(emittedFiles: string[], webpackRuntimeFiles: string[], entryPointFiles: string[]) {
		let fallbackFiles: string[] = [];
		let hotHash;
		if (emittedFiles.some(x => x.endsWith('.hot-update.json'))) {
			let result = emittedFiles.slice();
			const hotUpdateScripts = emittedFiles.filter(x => x.endsWith('.hot-update.js'));
			if (webpackRuntimeFiles && webpackRuntimeFiles.length) {
				result = result.filter(file => webpackRuntimeFiles.indexOf(file) === -1);
			}
			if (entryPointFiles && entryPointFiles.length) {
				result = result.filter(file => entryPointFiles.indexOf(file) === -1);
			}
			hotUpdateScripts.forEach(hotUpdateScript => {
				const { name, hash } = this.parseHotUpdateChunkName(hotUpdateScript);
				hotHash = hash;
				// remove bundle/vendor.js files if there's a bundle.XXX.hot-update.js or vendor.XXX.hot-update.js
				result = result.filter(file => file !== `${name}.js`);
			});
			// if applying of hot update fails, we must fallback to the full files
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
