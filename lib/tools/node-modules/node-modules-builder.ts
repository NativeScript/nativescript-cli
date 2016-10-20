import * as constants from "../../../lib/constants";
import * as fs from "fs";
import * as path from "path";
import * as shelljs from "shelljs";
import Future = require("fibers/future");
import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";
import * as fiberBootstrap from "../../common/fiber-bootstrap";
import { sleep } from "../../../lib/common/helpers";

let glob = require("glob");

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $lockfile: ILockFile,
		private $options: IOptions
	) { }

	public getChangedNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime?: Date): IFuture<any> {
		return (() => {
			let projectDir = this.$projectData.projectDir;
			let isNodeModulesModified = false;
			let nodeModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME);
			let nodeModules: any = {};

			if (lastModifiedTime) {
				let future = new Future();

				let match = new glob.Glob("node_modules/**", {
					cwd: projectDir,
					follow: true,
					stat: true
				}, (er: Error, files: string[]) => {
					fiberBootstrap.run(() => {

						while (this.$lockfile.check().wait()) {
							sleep(10);
						}

						this.$lockfile.lock().wait();
						if (er) {
							if (!future.isResolved()) {
								future.throw(er);
							}

							this.$lockfile.unlock().wait();
							match.abort();
							return;
						}
						for (let i = 0, l = files.length; i < l; i++) {
							let file = files[i],
								resolvedPath = path.join(projectDir, file),
								relativePath = path.relative(projectDir, resolvedPath);
							let stat = match.statCache[resolvedPath] || match.statCache[relativePath];
							if (!stat) {
								match.statCache[resolvedPath] = stat = this.$fs.getFsStats(resolvedPath).wait();
							}

							if (stat.mtime <= lastModifiedTime) {
								continue;
							}
							if (file === constants.NODE_MODULES_FOLDER_NAME) {
								isNodeModulesModified = true;
								this.$lockfile.unlock().wait();
								match.abort();
								if (!future.isResolved()) {
									future.return();
								}
								return;
							}
							let rootModuleName = path.normalize(file).split(path.sep)[1];
							let rootModuleFullPath = path.join(nodeModulesPath, rootModuleName);
							nodeModules[rootModuleFullPath] = rootModuleFullPath;
						}

						this.$lockfile.unlock().wait();
					});
				});
				match.on("end", () => {
					if (!future.isResolved()) {
						let intervalId = setInterval(() => {
							fiberBootstrap.run(() => {
								if (!this.$lockfile.check().wait() || future.isResolved()) {
									if (!future.isResolved()) {
										future.return();
									}
									clearInterval(intervalId);
								}
							});
						}, 100);
					}
				});

				future.wait();
			}

			if (isNodeModulesModified && this.$fs.exists(absoluteOutputPath).wait()) {
				let currentPreparedTnsModules = this.$fs.readDirectory(absoluteOutputPath).wait();
				let tnsModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_CORE_MODULES_NAME);
				let tnsModulesInApp = this.$fs.readDirectory(tnsModulesPath).wait();
				let modulesToDelete = _.difference(currentPreparedTnsModules, tnsModulesInApp);
				_.each(modulesToDelete, moduleName => this.$fs.deleteDirectory(path.join(absoluteOutputPath, moduleName)).wait());
			}

			if (!lastModifiedTime || isNodeModulesModified) {
				this.expandScopedModules(nodeModulesPath, nodeModules);
			}

			return nodeModules;
		}).future<any>()();
	}

	private expandScopedModules(nodeModulesPath: string, nodeModules: IStringDictionary): void {
		let nodeModulesDirectories = this.$fs.exists(nodeModulesPath).wait() ? this.$fs.readDirectory(nodeModulesPath).wait() : [];
		_.each(nodeModulesDirectories, nodeModuleDirectoryName => {
			let isNpmScope = /^@/.test(nodeModuleDirectoryName);
			let nodeModuleFullPath = path.join(nodeModulesPath, nodeModuleDirectoryName);
			if (isNpmScope) {
				this.expandScopedModules(nodeModuleFullPath, nodeModules);
			} else {
				nodeModules[nodeModuleFullPath] = nodeModuleFullPath;
			}
		});
	}

	public prepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime: Date): IFuture<void> {
		return (() => {
			if (!fs.existsSync(absoluteOutputPath)) {
				// Force copying if the destination doesn't exist.
				lastModifiedTime = null;
			}

			let productionDependencies = this.getProductionDependencies(this.$projectData.projectDir);

			// console.log(productionDependencies);

			// TODO: Pip3r4o - result is not used currently
			// let nodeModules = this.getChangedNodeModules(absoluteOutputPath, platform, lastModifiedTime).wait();

			if (!this.$options.bundle) {
				const tnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
					outputRoot: absoluteOutputPath
				});
				tnsModulesCopy.copyModules(productionDependencies, platform);
			} else {
				this.cleanNodeModules(absoluteOutputPath, platform);
			}

			const npmPluginPrepare = this.$injector.resolve(NpmPluginPrepare, {});
			npmPluginPrepare.preparePlugins(productionDependencies, platform);
		}).future<void>()();
	}

	public getProductionDependencies(projectPath: string) {
		var deps: any = [];
		var seen: any = {};

		var pJson = path.join(projectPath, "package.json");
		var nodeModulesDir = path.join(projectPath, "node_modules");

		var content = require(pJson);

		Object.keys(content.dependencies).forEach((key) => {
			var depth = 0;
			var directory = path.join(nodeModulesDir, key);

			// find and traverse child with name `key`, parent's directory -> dep.directory
			traverseChild(key, directory, depth);
		});

		return filterUniqueDirectories(deps);

		function traverseChild(name: string, currentModulePath: string, depth: number) {
			// check if key appears in a scoped module dependency
			var isScoped = name.indexOf('@') === 0;

			if (!isScoped) {
				// Check if child has been extracted in the parent's node modules, AND THEN in `node_modules`
				// Slower, but prevents copying wrong versions if multiple of the same module are installed
				// Will also prevent copying project's devDependency's version if current module depends on another version
				var modulePath = path.join(currentModulePath, "node_modules", name); // /node_modules/parent/node_modules/<package>
				var exists = ensureModuleExists(modulePath);

				if (exists) {
					var dep = addDependency(deps, name, modulePath, depth + 1);

					traverseModule(modulePath, depth + 1, dep);
				} else {
					modulePath = path.join(nodeModulesDir, name); // /node_modules/<package>
					exists = ensureModuleExists(modulePath);

					if(!exists) {
						return;
					}

					var dep = addDependency(deps, name, modulePath, 0);

					traverseModule(modulePath, 0, dep);
				}

			}
			// module is scoped 
			else {
				var scopeSeparatorIndex = name.indexOf('/');
				var scope = name.substring(0, scopeSeparatorIndex);
				var moduleName = name.substring(scopeSeparatorIndex + 1, name.length);
				var scopedModulePath = path.join(nodeModulesDir, scope, moduleName);

				var exists = ensureModuleExists(scopedModulePath);

				if (exists) {
					var dep = addDependency(deps, name, scopedModulePath, 0);
					traverseModule(scopedModulePath, depth, dep);
				}
				else {
					scopedModulePath = path.join(currentModulePath, "node_modules", scope, moduleName);

					exists = ensureModuleExists(scopedModulePath);

					if (!exists) {
						return;
					}

					var dep = addDependency(deps, name, scopedModulePath, depth + 1);
					traverseModule(scopedModulePath, depth + 1, dep);
				}
			}

			function traverseModule(modulePath: string, depth: number, currentDependency: any) {
				var packageJsonPath = path.join(modulePath, 'package.json');
				var packageJsonExists = fs.lstatSync(packageJsonPath).isFile();

				if (packageJsonExists) {
					var packageJsonContents = require(packageJsonPath);

					if (!!packageJsonContents.nativescript) {
						// add `nativescript` property, necessary for resolving plugins
						currentDependency.nativescript = packageJsonContents.nativescript;
					}

					if (packageJsonContents.dependencies) {
						Object.keys(packageJsonContents.dependencies).forEach((key) => {

							traverseChild(key, modulePath, depth);
						});
					}
				}
			}

			function addDependency(deps: any[], name: string, directory: string, depth: number) {
				var dep: any = {};
				dep.name = name;
				dep.directory = directory;
				dep.depth = depth;

				deps.push(dep);

				return dep;
			}

			function ensureModuleExists(modulePath: string): boolean {
				try {
					var exists = fs.lstatSync(modulePath);
					return exists.isDirectory();
				} catch (e) {
					return false;
				}
			}
		}

		function filterUniqueDirectories(dependencies: any) {
			var unique: any = [];
			var distinct: any = [];
			for (var i in dependencies) {
				var dep = dependencies[i];
				if (distinct.indexOf(dep.directory) > -1) {
					continue;
				}

				distinct.push(dep.directory);
				unique.push(dep);
			}

			return unique;
		}
	}

	public cleanNodeModules(absoluteOutputPath: string, platform: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
