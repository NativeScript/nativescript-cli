import * as path from "path";

interface INpmOpts {
	config?: any;
	subCommandName?: string;
	path?: string;
}

export class NodePackageManager implements INodePackageManager {
	constructor(private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $errors: IErrors,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $options: IOptions) { }

	public install(packageName: string, pathToSave: string, config?: any): IFuture<any> {
		return (() => {
			if (this.$options.disableNpmInstall) {
				return;
			}
			if (this.$options.ignoreScripts) {
				config = config || {};
				config["ignore-scripts"] = true;
			}

			let packageJsonPath = path.join(pathToSave, "package.json");
			let jsonContentBefore = this.$fs.readJson(packageJsonPath);
			let dependenciesBefore = _.keys(jsonContentBefore.dependencies).concat(_.keys(jsonContentBefore.devDependencies));

			let flags = this.getFlagsString(config, true);
			let params = ["install"];
			if(packageName !== pathToSave) {
				params.push(packageName); //because npm install ${pwd} on mac tries to install itself as a dependency (windows and linux have no such issues)
			}
			params = params.concat(flags);
			let pwd = pathToSave;
			//TODO: plamen5kov: workaround is here for a reason (remove whole file later)
			if(this.$options.path) {
				let relativePathFromCwdToSource = "";
				if(this.$options.frameworkPath) {
					relativePathFromCwdToSource = path.relative(this.$options.frameworkPath, pathToSave);
					if(this.$fs.exists(relativePathFromCwdToSource)) {
						packageName = relativePathFromCwdToSource;
					}
				}
			}
			try {
				let spawnResult:ISpawnResult = this.$childProcess.spawnFromEvent(this.getNpmExecutableName(), params, "close", { cwd: pwd, stdio: "inherit" }).wait();
				this.$logger.out(spawnResult.stdout);
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

			let jsonContentAfter = this.$fs.readJson(path.join(pathToSave, "package.json"));
			let dependenciesAfter = _.keys(jsonContentAfter.dependencies).concat(_.keys(jsonContentAfter.devDependencies));

			/** This diff is done in case the installed pakcage is a URL address, a path to local directory or a .tgz file
			 *  in these cases we don't have the package name and we can't rely on "npm install --json"" option
			 *  to get the project name because we have to parse the output from the stdout and we have no controll over it (so other messages may be mangled in stdout)
			 * 	The solution is to compare package.json project dependencies before and after install and get the name of the installed package,
			 * 	even if it's installed through local path or URL. If command installes more than one package, only the package originally installed is returned.
			 */
			let dependencyDiff = _(jsonContentAfter.dependencies)
				.omitBy((val: string, key: string) => jsonContentBefore && jsonContentBefore.dependencies && jsonContentBefore.dependencies[key] && jsonContentBefore.dependencies[key] === val)
				.keys()
				.value();

			let devDependencyDiff = _(jsonContentAfter.devDependencies)
				.omitBy((val: string, key: string) => jsonContentBefore && jsonContentBefore.devDependencies && jsonContentBefore.devDependencies[key] && jsonContentBefore.devDependencies[key] === val)
				.keys()
				.value();

			let diff = dependencyDiff.concat(devDependencyDiff);

			if(diff.length <= 0 && dependenciesBefore.length === dependenciesAfter.length && packageName !== pathToSave) {
				this.$errors.failWithoutHelp(`The plugin ${packageName} is already installed`);
			}
			if(diff.length <= 0 && dependenciesBefore.length !== dependenciesAfter.length) {
				this.$errors.failWithoutHelp(`Couldn't install package correctly`);
			}

			return diff;
		}).future<any>()();
	}

	public uninstall(packageName: string, config?: any, path?: string): IFuture<any> {
		let flags = this.getFlagsString(config, false);
		return this.$childProcess.exec(`npm uninstall ${packageName} ${flags}`, { cwd: path });
	}

	public search(filter: string[], config: any): IFuture<any> {
		let args = (<any[]>([filter] || [])).concat(config.silent);
		return this.$childProcess.exec(`npm search ${args.join(" ")}`);
	}

	public view(packageName: string, config: any): IFuture<any> {
		return (() => {
			let flags = this.getFlagsString(config, false);
			let viewResult: any;
			try {
				viewResult = this.$childProcess.exec(`npm view ${packageName} ${flags}`).wait();
			} catch(e) {
				this.$errors.failWithoutHelp(e);
			}
			return JSON.parse(viewResult);
		}).future<any>()();
	}

	private getNpmExecutableName(): string {
		let npmExecutableName = "npm";

		if (this.$hostInfo.isWindows) {
			npmExecutableName += ".cmd";
		}

		return npmExecutableName;
	}

	private getFlagsString(config: any, asArray: boolean) : any{
		let array:Array<string> = [];
		for(let flag in config) {
			if (flag === "global") {
				array.push(`--${flag}`);
				array.push(`${config[flag]}`);
			} else if(config[flag]) {
				if(flag==="dist-tags" || flag==="versions") {
					array.push(` ${flag}`);
					continue;
				}
				array.push(`--${flag}`);
			}
		}
		if(asArray) {
			return array;
		}

		return array.join(" ");
	}
}
$injector.register("npm", NodePackageManager);
