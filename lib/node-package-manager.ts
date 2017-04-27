import * as path from "path";
import { exported } from "./common/decorators";

export class NodePackageManager implements INodePackageManager {
	constructor(private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $errors: IErrors,
		private $childProcess: IChildProcess,
		private $logger: ILogger) { }

	@exported("npm")
	public async install(packageName: string, pathToSave: string, config: INodePackageManagerInstallOptions): Promise<INpmInstallResultInfo> {
		if (config.disableNpmInstall) {
			return;
		}
		if (config.ignoreScripts) {
			config["ignore-scripts"] = true;
		}

		let packageJsonPath = path.join(pathToSave, "package.json");
		let jsonContentBefore = this.$fs.readJson(packageJsonPath);

		let flags = this.getFlagsString(config, true);
		let params = ["install"];
		const isInstallingAllDependencies = packageName === pathToSave;
		if (!isInstallingAllDependencies) {
			params.push(packageName);
		}

		params = params.concat(flags);
		let cwd = pathToSave;
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
			let spawnResult: ISpawnResult = await this.$childProcess.spawnFromEvent(this.getNpmExecutableName(), params, "close", { cwd, stdio: "inherit" });
			if (!etcExistsPriorToInstallation) {
				this.$fs.deleteDirectory(etcDirectoryLocation);
			}

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
			spawnResult = await this.$childProcess.spawnFromEvent(this.getNpmExecutableName(), params, "close");
			return this.parseNpmInstallResult(spawnResult.stdout);
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

		let flags = this.getFlagsString(wrappedConfig, false);
		let viewResult: any;
		try {
			viewResult = await this.$childProcess.exec(`npm view ${packageName} ${flags}`);
		} catch (e) {
			this.$errors.failWithoutHelp(e);
		}
		return JSON.parse(viewResult);
	}

	private getNpmExecutableName(): string {
		let npmExecutableName = "npm";

		if (this.$hostInfo.isWindows) {
			npmExecutableName += ".cmd";
		}

		return npmExecutableName;
	}

	private getFlagsString(config: any, asArray: boolean): any {
		let array: Array<string> = [];
		for (let flag in config) {
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

	private parseNpmInstallResult(npmInstallOutput: string): INpmInstallResultInfo {
		const originalOutput: INpmInstallCLIResult = JSON.parse(npmInstallOutput);
		const name = _.head(_.keys(originalOutput.dependencies));
		const dependency = _.pick<INpmDependencyInfo, INpmDependencyInfo | INpmPeerDependencyInfo>(originalOutput.dependencies, name);
		return {
			name,
			originalOutput,
			version: dependency[name].version
		};
	}
}

$injector.register("npm", NodePackageManager);
