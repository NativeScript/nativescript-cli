import * as constants from "../../../lib/constants";
import * as path from "path";
import * as shelljs from "shelljs";
import Future = require("fibers/future");
import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";
import { NodeModulesDependenciesBuilder } from "./node-modules-dependencies-builder";
import * as fiberBootstrap from "../../common/fiber-bootstrap";
import { sleep } from "../../../lib/common/helpers";

let glob = require("glob");

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $fs: IFileSystem,
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
								match.statCache[resolvedPath] = stat = this.$fs.getFsStats(resolvedPath);
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

			if (isNodeModulesModified && this.$fs.exists(absoluteOutputPath)) {
				let currentPreparedTnsModules = this.$fs.readDirectory(absoluteOutputPath);
				let tnsModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_CORE_MODULES_NAME);
				let tnsModulesInApp = this.$fs.readDirectory(tnsModulesPath);
				let modulesToDelete = _.difference(currentPreparedTnsModules, tnsModulesInApp);
				_.each(modulesToDelete, moduleName => this.$fs.deleteDirectory(path.join(absoluteOutputPath, moduleName)));
			}

			if (!lastModifiedTime || isNodeModulesModified) {
				this.expandScopedModules(nodeModulesPath, nodeModules);
			}

			return nodeModules;
		}).future<any>()();
	}

	private expandScopedModules(nodeModulesPath: string, nodeModules: IStringDictionary): void {
		let nodeModulesDirectories = this.$fs.exists(nodeModulesPath) ? this.$fs.readDirectory(nodeModulesPath) : [];
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
			if (!this.$fs.exists(absoluteOutputPath)) {
				// Force copying if the destination doesn't exist.
				lastModifiedTime = null;
			}

			let dependenciesBuilder = this.$injector.resolve(NodeModulesDependenciesBuilder, {});
			let productionDependencies = dependenciesBuilder.getProductionDependencies(this.$projectData.projectDir);

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

	public cleanNodeModules(absoluteOutputPath: string, platform: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
