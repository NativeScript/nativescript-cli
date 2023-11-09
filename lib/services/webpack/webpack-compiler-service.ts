import * as path from "path";
import * as child_process from "child_process";
import * as semver from "semver";
import * as _ from "lodash";
import { EventEmitter } from "events";
import { performanceLog } from "../../common/decorators";
import {
	WEBPACK_COMPILATION_COMPLETE,
	WEBPACK_PLUGIN_NAME,
	PackageManagers,
	CONFIG_FILE_NAME_DISPLAY,
} from "../../constants";
import {
	IPackageManager,
	IPackageInstallationManager,
	IOptions,
} from "../../declarations";
import { IPlatformData } from "../../definitions/platform";
import { IProjectData } from "../../definitions/project";
import {
	IDictionary,
	IErrors,
	IStringDictionary,
	IChildProcess,
	IFileSystem,
	IHooksService,
	IHostInfo,
} from "../../common/declarations";
import { ICleanupService } from "../../definitions/cleanup-service";
import { injector } from "../../common/yok";
import {
	resolvePackagePath,
	resolvePackageJSONPath,
} from "../../helpers/package-path-helper";

// todo: move out of here
interface IWebpackMessage<T = any> {
	type: "compilation" | "hmr-status";
	version?: number;
	hash?: string;
	data?: T;
}

interface IWebpackCompilation {
	emittedAssets: string[];
	staleAssets: string[];
}

export class WebpackCompilerService
	extends EventEmitter
	implements IWebpackCompilerService
{
	private webpackProcesses: IDictionary<child_process.ChildProcess> = {};
	private expectedHashes: IStringDictionary = {};

	constructor(
		private $options: IOptions,
		private $errors: IErrors,
		private $childProcess: IChildProcess,
		public $fs: IFileSystem,
		public $hooksService: IHooksService,
		public $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $cleanupService: ICleanupService,
		private $packageManager: IPackageManager,
		private $packageInstallationManager: IPackageInstallationManager // private $sharedEventBus: ISharedEventBus
	) {
		super();
	}

	public async compileWithWatch(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	): Promise<any> {
		return new Promise(async (resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve(void 0);
				return;
			}

			let isFirstWebpackWatchCompilation = true;
			prepareData.watch = true;
			try {
				const childProcess = await this.startWebpackProcess(
					platformData,
					projectData,
					prepareData
				);

				childProcess.stdout.on("data", function (data) {
					process.stdout.write(data);
				});

				childProcess.stderr.on("data", function (data) {
					process.stderr.write(data);
				});

				childProcess.on("message", (message: string | IWebpackEmitMessage) => {
					this.$logger.trace("Message from webpack", message);

					// if we are on webpack5 - we handle HMR in a  slightly different way
					if (
						typeof message === "object" &&
						"version" in message &&
						"type" in message
					) {
						// first compilation can be ignored because it will be synced regardless
						// handling it here would trigger 2 syncs
						if (isFirstWebpackWatchCompilation) {
							isFirstWebpackWatchCompilation = false;
							resolve(childProcess);
							return;
						}

						// if ((message as IWebpackMessage).type === "hmr-status") {
						// 	// we pass message through our event-bus to be handled wherever needed
						// 	// in this case webpack-hmr-status-service listens for this event
						// 	this.$sharedEventBus.emit("webpack:hmr-status", message);
						// 	return;
						// }

						return this.handleHMRMessage(
							message as IWebpackMessage<IWebpackCompilation>,
							platformData,
							projectData,
							prepareData
						);
					}

					if (message === "Webpack compilation complete.") {
						this.$logger.info("Webpack build done!");
						resolve(childProcess);
					}

					message = message as IWebpackEmitMessage;
					if (message.emittedFiles) {
						if (isFirstWebpackWatchCompilation) {
							isFirstWebpackWatchCompilation = false;
							this.expectedHashes[platformData.platformNameLowerCase] =
								prepareData.hmr ? message.hash : "";
							return;
						}

						// Persist the previousHash value before calling `this.getUpdatedEmittedFiles` as it will modify the expectedHashes object with the current hash
						const previousHash =
							this.expectedHashes[platformData.platformNameLowerCase];
						let result;

						if (prepareData.hmr) {
							result = this.getUpdatedEmittedFiles(
								message.emittedFiles,
								message.chunkFiles,
								message.hash,
								platformData.platformNameLowerCase
							);
						} else {
							result = {
								emittedFiles: message.emittedFiles,
								fallbackFiles: <string[]>[],
								hash: "",
							};
						}
						const files = result.emittedFiles.map((file: string) =>
							path.join(platformData.appDestinationDirectoryPath, "app", file)
						);
						const fallbackFiles = result.fallbackFiles.map((file: string) =>
							path.join(platformData.appDestinationDirectoryPath, "app", file)
						);

						const data = {
							files,
							hasOnlyHotUpdateFiles: files.every(
								(f) => f.indexOf("hot-update") > -1
							),
							hmrData: {
								hash: result.hash,
								fallbackFiles,
							},
							platform: platformData.platformNameLowerCase,
						};

						this.$logger.trace("Generated data from webpack message:", data);

						// the hash of the compilation is the same as the previous one and there are only hot updates produced
						if (data.hasOnlyHotUpdateFiles && previousHash === message.hash) {
							return;
						}

						if (data.files.length) {
							this.emit(WEBPACK_COMPILATION_COMPLETE, data);
						}
					}
				});

				childProcess.on("error", (err) => {
					this.$logger.trace(
						`Unable to start webpack process in watch mode. Error is: ${err}`
					);
					delete this.webpackProcesses[platformData.platformNameLowerCase];
					reject(err);
				});

				childProcess.on("close", async (arg: any) => {
					await this.$cleanupService.removeKillProcess(
						childProcess.pid.toString()
					);

					const exitCode = typeof arg === "number" ? arg : arg && arg.code;
					this.$logger.trace(
						`Webpack process exited with code ${exitCode} when we expected it to be long living with watch.`
					);
					const error: any = new Error(
						`Executing webpack failed with exit code ${exitCode}.`
					);
					error.code = exitCode;
					delete this.webpackProcesses[platformData.platformNameLowerCase];
					reject(error);
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	public async compileWithoutWatch(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	): Promise<void> {
		return new Promise(async (resolve, reject) => {
			if (this.webpackProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			try {
				const childProcess = await this.startWebpackProcess(
					platformData,
					projectData,
					prepareData
				);

				childProcess.on("error", (err) => {
					this.$logger.trace(
						`Unable to start webpack process in non-watch mode. Error is: ${err}`
					);
					delete this.webpackProcesses[platformData.platformNameLowerCase];
					reject(err);
				});

				childProcess.on("close", async (arg: any) => {
					await this.$cleanupService.removeKillProcess(
						childProcess.pid.toString()
					);

					delete this.webpackProcesses[platformData.platformNameLowerCase];
					const exitCode = typeof arg === "number" ? arg : arg && arg.code;
					if (exitCode === 0) {
						resolve();
					} else {
						const error: any = new Error(
							`Executing webpack failed with exit code ${exitCode}.`
						);
						error.code = exitCode;
						reject(error);
					}
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	public async stopWebpackCompiler(platform: string): Promise<void> {
		if (platform) {
			await this.stopWebpackForPlatform(platform);
		} else {
			const webpackedPlatforms = Object.keys(this.webpackProcesses);

			for (let i = 0; i < webpackedPlatforms.length; i++) {
				await this.stopWebpackForPlatform(webpackedPlatforms[i]);
			}
		}
	}

	private async shouldUsePreserveSymlinksOption(): Promise<boolean> {
		// pnpm does not require symlink (https://github.com/nodejs/node-eps/issues/46#issuecomment-277373566)
		// and it also does not work in some cases.
		// Check https://github.com/NativeScript/nativescript-cli/issues/5259 for more information
		const currentPackageManager =
			await this.$packageManager.getPackageManagerName();
		const res = currentPackageManager !== PackageManagers.pnpm;
		return res;
	}

	@performanceLog()
	private async startWebpackProcess(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	): Promise<child_process.ChildProcess> {
		if (!this.$fs.exists(projectData.webpackConfigPath)) {
			this.$errors.fail(
				`The webpack configuration file ${projectData.webpackConfigPath} does not exist. Ensure the file exists, or update the path in ${CONFIG_FILE_NAME_DISPLAY}.`
			);
		}

		const envData = this.buildEnvData(
			platformData.platformNameLowerCase,
			projectData,
			prepareData
		);
		const envParams = await this.buildEnvCommandLineParams(
			envData,
			platformData,
			projectData,
			prepareData
		);
		const additionalNodeArgs =
			semver.major(process.version) <= 8 ? ["--harmony"] : [];

		if (await this.shouldUsePreserveSymlinksOption()) {
			additionalNodeArgs.push("--preserve-symlinks");
		}

		if (process.arch === "x64") {
			additionalNodeArgs.unshift("--max_old_space_size=4096");
		}

		const args = [
			...additionalNodeArgs,
			this.getWebpackExecutablePath(projectData),
			this.isWebpack5(projectData) ? `build` : null,
			`--config=${projectData.webpackConfigPath}`,
			...envParams,
		].filter(Boolean);

		if (prepareData.watch) {
			args.push("--watch");
		}

		const stdio = prepareData.watch ? ["ipc"] : "inherit";
		const childProcess = this.$childProcess.spawn(process.execPath, args, {
			cwd: projectData.projectDir,
			stdio,
		});

		this.webpackProcesses[platformData.platformNameLowerCase] = childProcess;
		await this.$cleanupService.addKillProcess(childProcess.pid.toString());

		return childProcess;
	}

	private buildEnvData(
		platform: string,
		projectData: IProjectData,
		prepareData: IPrepareData
	) {
		const { env } = prepareData;
		const envData = Object.assign({}, env, { [platform.toLowerCase()]: true });

		const appPath = projectData.getAppDirectoryRelativePath();
		const appResourcesPath = projectData.getAppResourcesRelativeDirectoryPath();

		Object.assign(
			envData,
			appPath && { appPath },
			appResourcesPath && { appResourcesPath },
			{
				nativescriptLibPath: path.resolve(
					__dirname,
					"..",
					"..",
					"nativescript-cli-lib.js"
				),
			}
		);

		envData.verbose = envData.verbose || this.$logger.isVerbose();
		envData.production = envData.production || prepareData.release;

		// add the config file name to the env data so the webpack process can read the
		// correct config file when resolving the CLI lib and the config service
		// we are explicitly setting it to false to force using the defaults
		envData.config =
			process.env.NATIVESCRIPT_CONFIG_NAME ?? this.$options.config ?? "false";

		// explicitly set the env variable
		process.env.NATIVESCRIPT_CONFIG_NAME = envData.config;

		// The snapshot generation is wrongly located in the Webpack plugin.
		// It should be moved in the Native Prepare of the CLI or a Gradle task in the Runtime.
		// As a workaround, we skip the mksnapshot, xxd and android-ndk calls based on skipNativePrepare.
		// In this way the plugin will prepare only the snapshot JS entry without any native prepare and
		// we will able to execute cloud builds with snapshot without having any local snapshot or Docker setup.
		// TODO: Remove this flag when we remove the native part from the plugin.
		envData.skipSnapshotTools =
			prepareData.nativePrepare && prepareData.nativePrepare.skipNativePrepare;

		// only set sourceMap if not explicitly set through a flag
		if (typeof prepareData?.env?.sourceMap === "undefined") {
			if (!prepareData.release) {
				envData.sourceMap = true;
			}
		}

		// convert string to boolean
		if (envData.sourceMap === "true" || envData.sourceMap === "false") {
			envData.sourceMap = envData.sourceMap === "true";
		}

		return envData;
	}

	private async buildEnvCommandLineParams(
		envData: any,
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	) {
		const envFlagNames = Object.keys(envData);
		const canSnapshot =
			prepareData.release &&
			this.$mobileHelper.isAndroidPlatform(platformData.normalizedPlatformName);
		if (envData && envData.snapshot) {
			if (!canSnapshot) {
				this.$logger.warn(
					"Stripping the snapshot flag. " +
						"Bear in mind that snapshot is only available in Android release builds."
				);
				envFlagNames.splice(envFlagNames.indexOf("snapshot"), 1);
			} else if (this.$hostInfo.isWindows) {
				const minWebpackPluginWithWinSnapshotsVersion = "1.3.0";
				const installedWebpackPluginVersion =
					await this.$packageInstallationManager.getInstalledDependencyVersion(
						WEBPACK_PLUGIN_NAME,
						projectData.projectDir
					);
				const hasWebpackPluginWithWinSnapshotsSupport =
					!!installedWebpackPluginVersion
						? semver.gte(
								semver.coerce(installedWebpackPluginVersion),
								minWebpackPluginWithWinSnapshotsVersion
						  )
						: true;
				if (!hasWebpackPluginWithWinSnapshotsSupport) {
					this.$errors.fail(
						`In order to generate Snapshots on Windows, please upgrade your Webpack plugin version (npm i ${WEBPACK_PLUGIN_NAME}@latest).`
					);
				}
			}
		}

		const args: any[] = [];
		envFlagNames.map((item) => {
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

	public getUpdatedEmittedFiles(
		allEmittedFiles: string[],
		chunkFiles: string[],
		nextHash: string,
		platform: string
	) {
		const currentHash = this.getCurrentHotUpdateHash(allEmittedFiles);

		// This logic is needed as there are already cases when webpack doesn't emit any files physically.
		// We've set noEmitOnErrors in webpack.config.js based on noEmitOnError from tsconfig.json,
		// so webpack doesn't emit any files when noEmitOnErrors: true is set in webpack.config.js and
		// there is a compilation error in the source code. On the other side, hmr generates new hot-update files
		// on every change and the hash of the next hmr update is written inside hot-update.json file.
		// Although webpack doesn't emit any files, hmr hash is still generated. The hash is generated per compilation no matter
		// if files will be emitted or not. This way, the first successful compilation after fixing the compilation error generates
		// a hash that is not the same as the one expected in the latest emitted hot-update.json file.
		// As a result, the hmr chain is broken and the changes are not applied.
		const isHashValid = nextHash
			? this.expectedHashes[platform] === currentHash
			: true;
		this.expectedHashes[platform] = nextHash;

		const emittedHotUpdatesAndAssets = isHashValid
			? _.difference(allEmittedFiles, chunkFiles)
			: allEmittedFiles;
		const fallbackFiles = chunkFiles.concat(
			emittedHotUpdatesAndAssets.filter((f) => f.indexOf("hot-update") === -1)
		);

		return {
			emittedFiles: emittedHotUpdatesAndAssets,
			fallbackFiles,
			hash: currentHash,
		};
	}

	private getCurrentHotUpdateHash(emittedFiles: string[]) {
		let hotHash;
		const hotUpdateScripts = emittedFiles.filter((x) =>
			x.endsWith(".hot-update.js")
		);
		if (hotUpdateScripts && hotUpdateScripts.length) {
			// the hash is the same for each hot update in the current compilation
			const hotUpdateName = hotUpdateScripts[0];
			const matcher = /^(.+)\.(.+)\.hot-update/gm;
			const matches = matcher.exec(hotUpdateName);
			hotHash = matches[2];
		}

		return hotHash || "";
	}

	private async stopWebpackForPlatform(platform: string) {
		this.$logger.trace(`Stopping webpack watch for platform ${platform}.`);
		const webpackProcess = this.webpackProcesses[platform];
		await this.$cleanupService.removeKillProcess(webpackProcess.pid.toString());
		if (webpackProcess) {
			webpackProcess.kill("SIGINT");
			delete this.webpackProcesses[platform];
		}
	}

	private handleHMRMessage(
		message: IWebpackMessage,
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData
	) {
		// handle new webpack hmr packets
		this.$logger.trace("Received message from webpack process:", message);

		if (message.type !== "compilation") {
			return;
		}

		this.$logger.trace("Webpack build done!");

		const files = message.data.emittedAssets.map((asset: string) =>
			path.join(platformData.appDestinationDirectoryPath, "app", asset)
		);
		const staleFiles = message.data.staleAssets.map((asset: string) =>
			path.join(platformData.appDestinationDirectoryPath, "app", asset)
		);

		// extract last hash from emitted filenames
		const lastHash = (() => {
			const absoluteFileNameWithLastHash = files.find((fileName: string) =>
				fileName.endsWith("hot-update.js")
			);

			if (!absoluteFileNameWithLastHash) {
				return null;
			}
			const fileNameWithLastHash = path.basename(absoluteFileNameWithLastHash);
			const matches = fileNameWithLastHash.match(/\.(.+).hot-update\.js/);

			if (matches) {
				return matches[1];
			}
		})();

		if (!files.length) {
			// ignore compilations if no new files are emitted
			return;
		}

		this.emit(WEBPACK_COMPILATION_COMPLETE, {
			files,
			staleFiles,
			hasOnlyHotUpdateFiles: prepareData.hmr,
			hmrData: {
				hash: lastHash || message.hash,
				fallbackFiles: [],
			},
			platform: platformData.platformNameLowerCase,
		});
	}

	private getWebpackExecutablePath(projectData: IProjectData): string {
		if (this.isWebpack5(projectData)) {
			const packagePath = resolvePackagePath("@nativescript/webpack", {
				paths: [projectData.projectDir],
			});

			if (packagePath) {
				return path.resolve(packagePath, "dist", "bin", "index.js");
			}
		}

		const packagePath = resolvePackagePath("webpack", {
			paths: [projectData.projectDir],
		});

		if (!packagePath) {
			return "";
		}

		return path.resolve(packagePath, "bin", "webpack.js");
	}

	private isWebpack5(projectData: IProjectData): boolean {
		const packageJSONPath = resolvePackageJSONPath("@nativescript/webpack", {
			paths: [projectData.projectDir],
		});

		if (packageJSONPath) {
			const packageData = this.$fs.readJson(packageJSONPath);
			const ver = semver.coerce(packageData.version);

			if (semver.satisfies(ver, ">= 5.0.0")) {
				return true;
			}
		}

		return false;
	}
}

injector.register("webpackCompilerService", WebpackCompilerService);
