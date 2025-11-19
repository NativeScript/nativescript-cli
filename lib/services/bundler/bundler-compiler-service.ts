import * as path from "path";
import * as child_process from "child_process";
import * as semver from "semver";
import * as _ from "lodash";
import { EventEmitter } from "events";
import { performanceLog } from "../../common/decorators";
import {
	WEBPACK_PLUGIN_NAME,
	BUNDLER_COMPILATION_COMPLETE,
	PackageManagers,
	CONFIG_FILE_NAME_DISPLAY,
} from "../../constants";
import {
	IPackageManager,
	IPackageInstallationManager,
	IOptions,
} from "../../declarations";
import { IPlatformData } from "../../definitions/platform";
import {
	BundlerType,
	IProjectConfigService,
	IProjectData,
} from "../../definitions/project";
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
interface IBundlerMessage<T = any> {
	type: "compilation" | "hmr-status";
	version?: number;
	hash?: string;
	data?: T;
}

interface IBundlerCompilation {
	emittedAssets: string[];
	staleAssets: string[];
}

/* for specific bundling debugging separate from logger */
const debugLog = false;

export class BundlerCompilerService
	extends EventEmitter
	implements IBundlerCompilerService
{
	private bundlerProcesses: IDictionary<child_process.ChildProcess> = {};
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
		private $packageInstallationManager: IPackageInstallationManager, // private $sharedEventBus: ISharedEventBus
		private $projectConfigService: IProjectConfigService,
	) {
		super();
	}

	public async compileWithWatch(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData,
	): Promise<any> {
		return new Promise(async (resolve, reject) => {
			if (this.bundlerProcesses[platformData.platformNameLowerCase]) {
				resolve(void 0);
				return;
			}

			let isFirstBundlerWatchCompilation = true;
			prepareData.watch = true;
			try {
				const childProcess = await this.startBundleProcess(
					platformData,
					projectData,
					prepareData,
				);

				// Handle Vite differently from webpack
				const isVite = this.getBundler() === "vite";

				childProcess.stdout.on("data", function (data) {
					process.stdout.write(data);
				});

				childProcess.stderr.on("data", function (data) {
					process.stderr.write(data);
				});

				// For both Vite and webpack, we wait for the first build to complete
				// Don't resolve immediately for Vite - wait for first IPC message

				childProcess.on("message", (message: string | IBundlerEmitMessage) => {
					this.$logger.trace(`Message from ${projectData.bundler}`, message);

					// Handle Vite messages
					if (
						isVite &&
						message &&
						(message as IBundlerEmitMessage).emittedFiles
					) {
						message = message as IBundlerEmitMessage;
						if (debugLog) {
							console.log("Received Vite IPC message:", message);
						}

						// Copy Vite output files directly to platform destination
						const distOutput = path.join(
							projectData.projectDir,
							".ns-vite-build",
						);
						const destDir = path.join(
							platformData.appDestinationDirectoryPath,
							this.$options.hostProjectModuleName,
						);

						if (debugLog) {
							console.log(`Copying from ${distOutput} to ${destDir}.`);
						}

						// Determine which files to copy based on build type and changes
						if (
							message.buildType === "incremental" &&
							message.emittedFiles &&
							message.emittedFiles.length > 0
						) {
							// Incremental builds: only copy files that are likely affected by the changes
							const filesToCopy = this.getIncrementalFilesToCopy(
								message.emittedFiles,
							);
							if (debugLog) {
								console.log("Incremental build - files to copy:", filesToCopy);
							}

							this.copyViteBundleToNative(distOutput, destDir, filesToCopy);
						} else {
							if (debugLog) {
								console.log("Full build - copying all files.");
							}
							this.copyViteBundleToNative(distOutput, destDir);
						}

						// Resolve the promise on first build completion
						if (isFirstBundlerWatchCompilation) {
							isFirstBundlerWatchCompilation = false;
							if (debugLog) {
								console.log(
									"Vite first build completed, resolving compileWithWatch",
								);
							}
							resolve(childProcess);
						}

						// Transform Vite message to match webpack format
						const files = (message as IBundlerEmitMessage).emittedFiles.map(
							(file) =>
								path.join(
									platformData.appDestinationDirectoryPath,
									this.$options.hostProjectModuleName,
									file,
								),
						);

						const data = {
							files,
							hasOnlyHotUpdateFiles: message.isHMR || false,
							hmrData: {
								hash: (message as IBundlerEmitMessage).hash || "",
								fallbackFiles: [] as string[],
							},
							platform: platformData.platformNameLowerCase,
						};

						this.$logger.info(
							`Vite build completed! Files copied to native platform.`,
						);

						if (debugLog) {
							console.log(
								"Emitting BUNDLER_COMPILATION_COMPLETE for full build.",
							);
						}
						this.emit(BUNDLER_COMPILATION_COMPLETE, data);

						return;
					}

					// if we are on webpack5 - we handle HMR in a  slightly different way
					if (
						typeof message === "object" &&
						"version" in message &&
						"type" in message
					) {
						// first compilation can be ignored because it will be synced regardless
						// handling it here would trigger 2 syncs
						if (isFirstBundlerWatchCompilation) {
							isFirstBundlerWatchCompilation = false;
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
							message as IBundlerMessage<IBundlerCompilation>,
							platformData,
							projectData,
							prepareData,
						);
					}

					if (
						message ===
						`${capitalizeFirstLetter(projectData.bundler)} compilation complete.`
					) {
						this.$logger.info(
							`${capitalizeFirstLetter(projectData.bundler)} build done!`,
						);
						resolve(childProcess);
					}

					message = message as IBundlerEmitMessage;
					if (message.emittedFiles) {
						if (isFirstBundlerWatchCompilation) {
							isFirstBundlerWatchCompilation = false;
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
								platformData.platformNameLowerCase,
							);
						} else {
							result = {
								emittedFiles: message.emittedFiles,
								fallbackFiles: <string[]>[],
								hash: "",
							};
						}
						const files = result.emittedFiles.map((file: string) =>
							path.join(
								platformData.appDestinationDirectoryPath,
								this.$options.hostProjectModuleName,
								file,
							),
						);
						const fallbackFiles = result.fallbackFiles.map((file: string) =>
							path.join(
								platformData.appDestinationDirectoryPath,
								this.$options.hostProjectModuleName,
								file,
							),
						);

						const data = {
							files,
							hasOnlyHotUpdateFiles: files.every(
								(f) => f.indexOf("hot-update") > -1,
							),
							hmrData: {
								hash: result.hash,
								fallbackFiles,
							},
							platform: platformData.platformNameLowerCase,
						};

						this.$logger.trace(
							`Generated data from ${projectData.bundler} message:`,
							data,
						);

						// the hash of the compilation is the same as the previous one and there are only hot updates produced
						if (data.hasOnlyHotUpdateFiles && previousHash === message.hash) {
							return;
						}

						if (data.files.length) {
							this.emit(BUNDLER_COMPILATION_COMPLETE, data);
						}
					}
				});

				childProcess.on("error", (err) => {
					this.$logger.trace(
						`Unable to start ${projectData.bundler} process in watch mode. Error is: ${err}`,
					);
					delete this.bundlerProcesses[platformData.platformNameLowerCase];
					reject(err);
				});

				childProcess.on("close", async (arg: any) => {
					const exitCode = typeof arg === "number" ? arg : arg && arg.code;
					this.$logger.trace(
						`${capitalizeFirstLetter(projectData.bundler)} process exited with code ${exitCode} when we expected it to be long living with watch.`,
					);

					await this.$cleanupService.removeKillProcess(
						childProcess.pid.toString(),
					);
					const error: any = new Error(
						`Executing ${projectData.bundler} failed with exit code ${exitCode}.`,
					);
					error.code = exitCode;
					delete this.bundlerProcesses[platformData.platformNameLowerCase];
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
		prepareData: IPrepareData,
	): Promise<void> {
		return new Promise(async (resolve, reject) => {
			if (this.bundlerProcesses[platformData.platformNameLowerCase]) {
				resolve();
				return;
			}

			try {
				const childProcess = await this.startBundleProcess(
					platformData,
					projectData,
					prepareData,
				);

				childProcess.on("error", (err) => {
					this.$logger.trace(
						`Unable to start ${projectData.bundler} process in non-watch mode. Error is: ${err}`,
					);
					delete this.bundlerProcesses[platformData.platformNameLowerCase];
					reject(err);
				});

				childProcess.on("close", async (arg: any) => {
					await this.$cleanupService.removeKillProcess(
						childProcess.pid.toString(),
					);

					delete this.bundlerProcesses[platformData.platformNameLowerCase];
					const exitCode = typeof arg === "number" ? arg : arg && arg.code;
					if (exitCode === 0) {
						resolve();
					} else {
						const error: any = new Error(
							`Executing ${projectData.bundler} failed with exit code ${exitCode}.`,
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

	public async stopBundlerCompiler(platform: string): Promise<void> {
		if (platform) {
			await this.stopBundlerForPlatform(platform);
		} else {
			const bundlerPlatforms = Object.keys(this.bundlerProcesses);

			for (let i = 0; i < bundlerPlatforms.length; i++) {
				await this.stopBundlerForPlatform(bundlerPlatforms[i]);
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
	private async startBundleProcess(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData,
	): Promise<child_process.ChildProcess> {
		if (projectData.bundlerConfigPath) {
			if (!this.$fs.exists(projectData.bundlerConfigPath)) {
				this.$errors.fail(
					`The bundler configuration file ${projectData.bundlerConfigPath} does not exist. Ensure the file exists, or update the path in ${CONFIG_FILE_NAME_DISPLAY}.`,
				);
			}
		} else {
			if (!this.$fs.exists(projectData.bundlerConfigPath)) {
				this.$errors.fail(
					`The ${projectData.bundler} configuration file ${projectData.bundlerConfigPath} does not exist. Ensure the file exists, or update the path in ${CONFIG_FILE_NAME_DISPLAY}.`,
				);
			}
		}

		const envData = this.buildEnvData(
			platformData.platformNameLowerCase,
			projectData,
			prepareData,
		);
		const isVite = this.getBundler() === "vite";
		const cliArgs = await this.buildEnvCommandLineParams(
			envData,
			platformData,
			projectData,
			prepareData,
		);
		// Note: With Vite, we need `--` to prevent vite cli from erroring on unknown options.
		const envParams = isVite
			? [
					`--mode=${prepareData.release ? "production" : "development"}`,
					`--watch`,
					"--",
					...cliArgs,
				]
			: cliArgs;
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
			this.getBundlerExecutablePath(projectData),
			isVite || this.isModernBundler(projectData) ? "build" : null,
			`--config=${projectData.bundlerConfigPath}`,
			...envParams,
		].filter(Boolean);

		if (!isVite) {
			if (prepareData.watch) {
				args.push("--watch");
			}
		}

		const stdio = prepareData.watch || isVite ? ["ipc"] : "inherit";
		const options: { [key: string]: any } = {
			cwd: projectData.projectDir,
			stdio,
		};
		options.env = {
			...process.env,
			NATIVESCRIPT_WEBPACK_ENV: JSON.stringify(envData),
			NATIVESCRIPT_BUNDLER_ENV: JSON.stringify(envData),
		};
		if (this.$hostInfo.isWindows) {
			Object.assign(options.env, { APPDATA: process.env.appData });
		}
		if (this.$options.hostProjectPath) {
			Object.assign(options.env, {
				USER_PROJECT_PLATFORMS_ANDROID: this.$options.hostProjectPath,
				USER_PROJECT_PLATFORMS_ANDROID_MODULE:
					this.$options.hostProjectModuleName,
				USER_PROJECT_PLATFORMS_IOS: this.$options.hostProjectPath,
			});
		}

		if (debugLog) {
			console.log("args:", args);
		}

		const childProcess = this.$childProcess.spawn(
			process.execPath,
			args,
			options,
		);

		this.bundlerProcesses[platformData.platformNameLowerCase] = childProcess;
		await this.$cleanupService.addKillProcess(childProcess.pid.toString());

		return childProcess;
	}

	private buildEnvData(
		platform: string,
		projectData: IProjectData,
		prepareData: IPrepareData,
	) {
		const { env } = prepareData;
		const envData = Object.assign({}, env, { [platform.toLowerCase()]: true });

		const appId = projectData.projectIdentifiers[platform];
		const appPath = projectData.getAppDirectoryRelativePath();
		const appResourcesPath = projectData.getAppResourcesRelativeDirectoryPath();
		const buildPath = projectData.getBuildRelativeDirectoryPath();

		Object.assign(
			envData,
			appId && { appId },
			appPath && { appPath },
			appResourcesPath && { appResourcesPath },
			buildPath && { buildPath },
			{
				nativescriptLibPath: path.resolve(
					__dirname,
					"..",
					"..",
					"nativescript-cli-lib.js",
				),
			},
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

		if (prepareData.uniqueBundle > 0) {
			envData.uniqueBundle = prepareData.uniqueBundle;
		}

		return envData;
	}

	private async buildEnvCommandLineParams(
		envData: any,
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData,
	) {
		const envFlagNames = Object.keys(envData);
		const canSnapshot =
			prepareData.release &&
			this.$mobileHelper.isAndroidPlatform(platformData.normalizedPlatformName);
		if (envData && envData.snapshot) {
			if (!canSnapshot) {
				this.$logger.warn(
					"Stripping the snapshot flag. " +
						"Bear in mind that snapshot is only available in Android release builds.",
				);
				envFlagNames.splice(envFlagNames.indexOf("snapshot"), 1);
			} else if (this.$hostInfo.isWindows) {
				if (projectData.bundler === "webpack") {
					//TODO: check this use case for webpack5 WEBPACK_PLUGIN_NAME
					const minWebpackPluginWithWinSnapshotsVersion = "1.3.0";
					const installedWebpackPluginVersion =
						await this.$packageInstallationManager.getInstalledDependencyVersion(
							WEBPACK_PLUGIN_NAME,
							projectData.projectDir,
						);
					const hasWebpackPluginWithWinSnapshotsSupport =
						!!installedWebpackPluginVersion
							? semver.gte(
									semver.coerce(installedWebpackPluginVersion),
									minWebpackPluginWithWinSnapshotsVersion,
								)
							: true;
					if (!hasWebpackPluginWithWinSnapshotsSupport) {
						this.$errors.fail(
							`In order to generate Snapshots on Windows, please upgrade your Webpack plugin version (npm i ${WEBPACK_PLUGIN_NAME}@latest).`,
						);
					}
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
		platform: string,
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
			emittedHotUpdatesAndAssets.filter((f) => f.indexOf("hot-update") === -1),
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
			x.endsWith(".hot-update.js"),
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

	private async stopBundlerForPlatform(platform: string) {
		this.$logger.trace(
			`Stopping ${this.getBundler()} watch for platform ${platform}.`,
		);
		const bundlerProcess = this.bundlerProcesses[platform];
		await this.$cleanupService.removeKillProcess(bundlerProcess.pid.toString());
		if (bundlerProcess) {
			bundlerProcess.kill("SIGINT");
			delete this.bundlerProcesses[platform];
		}
	}

	private handleHMRMessage(
		message: IBundlerMessage,
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData,
	) {
		// handle new bundler hmr packets
		this.$logger.trace(
			`Received message from ${projectData.bundler} process:`,
			message,
		);

		if (message.type !== "compilation") {
			return;
		}

		this.$logger.trace(
			`${capitalizeFirstLetter(projectData.bundler)} build done!`,
		);

		const files = message.data.emittedAssets.map((asset: string) =>
			path.join(
				platformData.appDestinationDirectoryPath,
				this.$options.hostProjectModuleName,
				asset,
			),
		);
		const staleFiles = message.data.staleAssets.map((asset: string) =>
			path.join(
				platformData.appDestinationDirectoryPath,
				this.$options.hostProjectModuleName,
				asset,
			),
		);

		// extract last hash from emitted filenames
		const lastHash = (() => {
			const absoluteFileNameWithLastHash = files.find((fileName: string) =>
				fileName.endsWith("hot-update.js"),
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

		this.emit(BUNDLER_COMPILATION_COMPLETE, {
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

	private getBundlerExecutablePath(projectData: IProjectData): string {
		const bundler = this.getBundler();

		if (bundler === "vite") {
			const packagePath = resolvePackagePath(`vite`, {
				paths: [projectData.projectDir],
			});

			if (packagePath) {
				return path.resolve(packagePath, "bin", "vite.js");
			}
		} else if (this.isModernBundler(projectData)) {

			const webpackPluginName = this.$projectConfigService.getValue(`webpackPackageName`, WEBPACK_PLUGIN_NAME);
			const packagePath = resolvePackagePath(webpackPluginName, {
				paths: [projectData.projectDir],
			});

			if (packagePath) {
				return path.resolve(packagePath, "dist", "bin", "index.js");
			}
		}
		throw new Error('could not find bundler executable');
	}

	private isModernBundler(projectData: IProjectData): boolean {
		const bundler = this.getBundler();
		switch (bundler) {
			case "rspack":
				return true;
			default:
				const webpackPluginName = this.$projectConfigService.getValue(`webpackPackageName`, WEBPACK_PLUGIN_NAME);
				const packageJSONPath = resolvePackageJSONPath(webpackPluginName, {
					paths: [projectData.projectDir],
				});

				if (packageJSONPath) {
					const packageData = this.$fs.readJson(packageJSONPath);
					const ver = semver.coerce(packageData.version);

					if (semver.satisfies(ver, ">= 5.0.0")) {
						return true;
					}
				}
				break;
		}

		return false;
	}

	public getBundler(): BundlerType {
		return this.$projectConfigService.getValue(`bundler`, "webpack");
	}

	private copyViteBundleToNative(
		distOutput: string,
		destDir: string,
		specificFiles: string[] = null,
	) {
		// Clean and copy Vite output to native platform folder
		if (debugLog) {
			console.log(`Copying Vite bundle from "${distOutput}" to "${destDir}".`);
		}

		try {
			if (specificFiles) {
				// Selective mode: only copy specific files (incremental)
				if (debugLog) {
					console.log(
						"Selective copy - copying specific files:",
						specificFiles,
					);
				}

				// Ensure destination directory exists
				this.$fs.createDirectory(destDir);

				// Copy only the specified files
				for (const file of specificFiles) {
					const srcPath = path.join(distOutput, file);
					const destPath = path.join(destDir, file);

					if (!this.$fs.exists(srcPath)) continue;

					// create parent dirs
					this.$fs.createDirectory(path.dirname(destPath));

					this.$fs.copyFile(srcPath, destPath);

					if (debugLog) {
						console.log(`Copied ${file}`);
					}
				}
			} else {
				// Full build mode: clean and copy everything
				if (debugLog) {
					console.log("Full build: Copying all files.");
				}

				// Clean destination directory
				if (this.$fs.exists(destDir)) {
					this.$fs.deleteDirectory(destDir);
				}
				this.$fs.createDirectory(destDir);

				// Copy all files from dist to platform destination
				if (this.$fs.exists(distOutput)) {
					this.copyRecursiveSync(distOutput, destDir);
				} else {
					this.$logger.warn(
						`Vite output directory does not exist: ${distOutput}`,
					);
				}
			}
		} catch (error) {
			this.$logger.warn(`Failed to copy Vite bundle: ${error.message}`);
		}
	}

	private getIncrementalFilesToCopy(emittedFiles: string[]): string[] {
		// For incremental builds, we need to determine which emitted files are likely affected
		// by the source file changes

		const filesToCopy: string[] = [];

		// default to ignoring vendor files as they are less likely to change during live reloads
		const bundleFiles = emittedFiles.filter(
			(file) =>
				!file.includes("vendor") &&
				(file.endsWith(".mjs") ||
					file.endsWith(".js") ||
					file.endsWith(".map")),
		);
		filesToCopy.push(...bundleFiles);

		// Only copy assets if there are explicit asset-related changes
		const assetFiles = emittedFiles.filter(
			(file) =>
				file.includes("assets/") ||
				file.includes("static/") ||
				file.includes("fonts/") ||
				file.includes("images/"),
		);
		if (assetFiles.length > 0) {
			filesToCopy.push(...assetFiles);
		}

		// Remove duplicates and return
		return [...new Set(filesToCopy)];
	}

	private copyRecursiveSync(src: string, dest: string) {
		// Ensure destination exists
		this.$fs.createDirectory(dest);

		const entries = this.$fs.readDirectory(src);
		for (const name of entries) {
			const srcPath = path.join(src, name);
			const destPath = path.join(dest, name);
			const lstats = this.$fs.getLsStats(srcPath);

			if (lstats.isDirectory()) {
				this.copyRecursiveSync(srcPath, destPath);
			} else if (lstats.isFile() || lstats.isSymbolicLink()) {
				// create parent directory (copyFile will also ensure it, but keep explicit)
				this.$fs.createDirectory(path.dirname(destPath));
				this.$fs.copyFile(srcPath, destPath);
			}
		}
	}
}

function capitalizeFirstLetter(val: string) {
	return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

injector.register("bundlerCompilerService", BundlerCompilerService);
