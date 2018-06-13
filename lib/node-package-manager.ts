import * as path from "path";
import { exported, cache } from "./common/decorators";
import { isInteractive } from "./common/helpers";

export class NodePackageManager implements INodePackageManager {
	private static SCOPED_DEPENDENCY_REGEXP = /^(@.+?)(?:@(.+?))?$/;
	private static DEPENDENCY_REGEXP = /^(.+?)(?:@(.+?))?$/;

	constructor(private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $errors: IErrors,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $httpClient: Server.IHttpClient) { }

	@exported("npm")
	public async install(packageName: string, pathToSave: string, config: INodePackageManagerInstallOptions): Promise<INpmInstallResultInfo> {
		if (config.disableNpmInstall) {
			return;
		}
		if (config.ignoreScripts) {
			config["ignore-scripts"] = true;
		}

		const packageJsonPath = path.join(pathToSave, "package.json");
		const jsonContentBefore = this.$fs.readJson(packageJsonPath);

		const flags = this.getFlagsString(config, true);
		let params = ["install"];
		const isInstallingAllDependencies = packageName === pathToSave;
		if (!isInstallingAllDependencies) {
			params.push(packageName);
		}

		params = params.concat(flags);
		const cwd = pathToSave;
		// Npm creates `etc` directory in installation dir when --prefix is passed
		// https://github.com/npm/npm/issues/11486
		// we should delete it if it was created because of us
		const etcDirectoryLocation = path.join(cwd, "etc");
		const etcExistsPriorToInstallation = this.$fs.exists(etcDirectoryLocation);

		//TODO: plamen5kov: workaround is here for a reason (remove whole file later)
		if (config.path) {
			let relativePathFromCwdToSource = "";
			if (config.frameworkPath) {
				relativePathFromCwdToSource = path.relative(config.frameworkPath, pathToSave);
				if (this.$fs.exists(relativePathFromCwdToSource)) {
					packageName = relativePathFromCwdToSource;
				}
			}
		}

		try {
			const spawnResult: ISpawnResult = await this.getNpmInstallResult(params, cwd);

			// Whenever calling npm install without any arguments (hence installing all dependencies) no output is emitted on stdout
			// Luckily, whenever you call npm install to install all dependencies chances are you won't need the name/version of the package you're installing because there is none.
			if (isInstallingAllDependencies) {
				return null;
			}

			params = params.concat(["--json", "--dry-run", "--prefix", cwd]);
			// After the actual install runs successfully execute a dry-run in order to get information about the package.
			// We cannot use the actual install with --json to get the information because of post-install scripts which may print on stdout
			// dry-run install is quite fast when the dependencies are already installed even for many dependencies (e.g. angular) so we can live with this approach
			// We need the --prefix here because without it no output is emitted on stdout because all the dependencies are already installed.
			const spawnNpmDryRunResult = await this.$childProcess.spawnFromEvent(this.getNpmExecutableName(), params, "close");
			return this.parseNpmInstallResult(spawnNpmDryRunResult.stdout, spawnResult.stdout, packageName);
		} catch (err) {
			if (err.message && err.message.indexOf("EPEERINVALID") !== -1) {
				// Not installed peer dependencies are treated by npm 2 as errors, but npm 3 treats them as warnings.
				// We'll show them as warnings and let the user install them in case they are needed.
				this.$logger.warn(err.message);
			} else {
				// All other errors should be handled by the caller code.
				// Revert package.json contents to preserve valid state
				this.$fs.writeJson(packageJsonPath, jsonContentBefore);
				throw err;
			}
		} finally {
			if (!etcExistsPriorToInstallation) {
				this.$fs.deleteDirectory(etcDirectoryLocation);
			}
		}
	}

	@exported("npm")
	public async uninstall(packageName: string, config?: any, path?: string): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`npm uninstall ${packageName} ${flags}`, { cwd: path });
	}

	@exported("npm")
	public async search(filter: string[], config: any): Promise<string> {
		const flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`npm search ${filter.join(" ")} ${flags}`);
	}

	@exported("npm")
	public async view(packageName: string, config: Object): Promise<any> {
		const wrappedConfig = _.extend({}, config, { json: true }); // always require view response as JSON

		const flags = this.getFlagsString(wrappedConfig, false);
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(`npm view ${packageName} ${flags}`);
		} catch (e) {
			this.$errors.failWithoutHelp(e.message);
		}
		return JSON.parse(viewResult);
	}

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		// TODO: Fix the generation of url - in case it contains @ or / , the call may fail.
		const httpRequestResult = await this.$httpClient.httpRequest(`https://api.npms.io/v2/search?q=keywords:${keyword}`);
		const result: INpmsResult = JSON.parse(httpRequestResult.body);
		return result;
	}

	public async getRegistryPackageData(packageName: string): Promise<any> {
		const url = `https://registry.npmjs.org/${packageName}`;
		this.$logger.trace(`Trying to get data from npm registry for package ${packageName}, url is: ${url}`);
		const responseData = (await this.$httpClient.httpRequest(url)).body;
		this.$logger.trace(`Successfully received data from npm registry for package ${packageName}. Response data is: ${responseData}`);
		const jsonData = JSON.parse(responseData);
		this.$logger.trace(`Successfully parsed data from npm registry for package ${packageName}.`);
		return jsonData;
	}

	@cache()
	public async getCachePath(): Promise<string> {
		const cachePath = await this.$childProcess.exec(`npm config get cache`);
		return path.join(cachePath.trim(), "_cacache");
	}

	private getNpmExecutableName(): string {
		let npmExecutableName = "npm";

		if (this.$hostInfo.isWindows) {
			npmExecutableName += ".cmd";
		}

		return npmExecutableName;
	}

	private getFlagsString(config: any, asArray: boolean): any {
		const array: Array<string> = [];
		for (const flag in config) {
			if (flag === "global") {
				array.push(`--${flag}`);
				array.push(`${config[flag]}`);
			} else if (config[flag]) {
				if (flag === "dist-tags" || flag === "versions") {
					array.push(` ${flag}`);
					continue;
				}
				array.push(`--${flag}`);
			}
		}
		if (asArray) {
			return array;
		}

		return array.join(" ");
	}

	private parseNpmInstallResult(npmDryRunInstallOutput: string, npmInstallOutput: string, userSpecifiedPackageName: string): INpmInstallResultInfo {
		// TODO: Add tests for this functionality
		try {
			const originalOutput: INpmInstallCLIResult | INpm5InstallCliResult = JSON.parse(npmDryRunInstallOutput);
			const npm5Output = <INpm5InstallCliResult> originalOutput;
			const npmOutput = <INpmInstallCLIResult> originalOutput;
			let name: string;
			_.forOwn(npmOutput.dependencies, (peerDependency: INpmPeerDependencyInfo, key: string) => {
				if (!peerDependency.required && !peerDependency.peerMissing) {
					name = key;
					return false;
				}
			});

			// Npm 5 return different object after performing `npm install --dry-run`.
			// We find the correct dependency by searching for the `userSpecifiedPackageName` in the
			// `npm5Output.updated` array and as a fallback, considering that the dependency is already installed,
			// we find it as the first element.
			if (!name && npm5Output.updated) {
				const packageNameWithoutVersion = userSpecifiedPackageName.split('@')[0];
				const updatedDependency = _.find(npm5Output.updated, ['name', packageNameWithoutVersion]) || npm5Output.updated[0];
				return {
					name: updatedDependency.name,
					originalOutput,
					version: updatedDependency.version
				};
			}
			const dependency = _.pick<INpmDependencyInfo, INpmDependencyInfo | INpmPeerDependencyInfo>(npmOutput.dependencies, name);
			return {
				name,
				originalOutput,
				version: dependency[name].version
			};
		} catch (err) {
			this.$logger.trace(`Unable to parse result of npm --dry-run operation. Output is: ${npmDryRunInstallOutput}.`);
			this.$logger.trace("Now we'll try to parse the real output of npm install command.");

			const npmOutputMatchRegExp = /^.--\s+(?!UNMET)(.*)@((?:\d+\.){2}\d+)/m;
			const match = npmInstallOutput.match(npmOutputMatchRegExp);
			if (match) {
				return {
					name: match[1],
					version: match[2]
				};
			}
		}

		this.$logger.trace("Unable to get information from npm installation, trying to return value specified by user.");
		return this.getDependencyInformation(userSpecifiedPackageName);
	}

	private getDependencyInformation(dependency: string): INpmInstallResultInfo {
		const scopeDependencyMatch = dependency.match(NodePackageManager.SCOPED_DEPENDENCY_REGEXP);
		let name: string = null;
		let version: string = null;

		if (scopeDependencyMatch) {
			name = scopeDependencyMatch[1];
			version = scopeDependencyMatch[2];
		} else {
			const matches = dependency.match(NodePackageManager.DEPENDENCY_REGEXP);
			if (matches) {
				name = matches[1];
				version = matches[2];
			}
		}

		return {
			name,
			version
		};
	}

	private async getNpmInstallResult(params: string[], cwd: string): Promise<ISpawnResult> {
		return new Promise<ISpawnResult>((resolve, reject) => {
			const npmExecutable = this.getNpmExecutableName();
			const stdioValue = isInteractive() ? "inherit" : "pipe";

			const childProcess = this.$childProcess.spawn(npmExecutable, params, { cwd, stdio: stdioValue });

			let isFulfilled = false;
			let capturedOut = "";
			let capturedErr = "";

			if (childProcess.stdout) {
				childProcess.stdout.on("data", (data: string) => {
					this.$logger.write(data.toString());
					capturedOut += data;
				});
			}

			if (childProcess.stderr) {
				childProcess.stderr.on("data", (data: string) => {
					capturedErr += data;
				});
			}

			childProcess.on("close", (arg: any) => {
				const exitCode = typeof arg === "number" ? arg : arg && arg.code;

				if (exitCode === 0) {
					isFulfilled = true;
					const result = {
						stdout: capturedOut,
						stderr: capturedErr,
						exitCode
					};

					resolve(result);
				} else {
					let errorMessage = `Command ${npmExecutable} ${params && params.join(" ")} failed with exit code ${exitCode}`;
					if (capturedErr) {
						errorMessage += ` Error output: \n ${capturedErr}`;
					}

					if (!isFulfilled) {
						isFulfilled = true;
						reject(new Error(errorMessage));
					}
				}
			});

			childProcess.on("error", (err: Error) => {
				if (!isFulfilled) {
					isFulfilled = true;
					reject(err);
				}
			});
		});
	}
}

$injector.register("npm", NodePackageManager);
