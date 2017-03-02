import * as constants from "../../../lib/constants";
import * as path from "path";
import * as shelljs from "shelljs";
import { TnsModulesCopy, NpmPluginPrepare } from "./node-modules-dest-copy";
import { NodeModulesDependenciesBuilder } from "./node-modules-dependencies-builder";
import { sleep, deferPromise } from "../../../lib/common/helpers";

let glob = require("glob");

export class NodeModulesBuilder implements INodeModulesBuilder {
	constructor(private $fs: IFileSystem,
		private $injector: IInjector,
		private $lockfile: ILockFile,
		private $options: IOptions
	) { }

	public async getChangedNodeModules(absoluteOutputPath: string, platform: string, projectData: IProjectData, lastModifiedTime?: Date): Promise<any> {
		let projectDir = projectData.projectDir;
		let isNodeModulesModified = false;
		let nodeModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME);
		let nodeModules: any = {};

		if (lastModifiedTime) {
			let defer = deferPromise();

			let match = new glob.Glob("node_modules/**", {
				cwd: projectDir,
				follow: true,
				stat: true
			}, (er: Error, files: string[]) => {
				while (this.$lockfile.check()) {
					sleep(10);
				}

				this.$lockfile.lock();
				if (er) {
					if (!defer.isResolved()) {
						defer.reject(er);
					}

					this.$lockfile.unlock();
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
						this.$lockfile.unlock();
						match.abort();
						if (!defer.isResolved()) {
							defer.resolve();
						}

						return;
					}
					let rootModuleName = path.normalize(file).split(path.sep)[1];
					let rootModuleFullPath = path.join(nodeModulesPath, rootModuleName);
					nodeModules[rootModuleFullPath] = rootModuleFullPath;
				}

				this.$lockfile.unlock();
			});

			match.on("end", () => {
				if (!defer.isResolved()) {
					let intervalId = setInterval(() => {
						if (!this.$lockfile.check() || defer.isResolved()) {
							if (!defer.isResolved()) {
								defer.resolve();
							}
							clearInterval(intervalId);
						}
					}, 100);
				}
			});

			await defer.promise;
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

	public async prepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime: Date, projectData: IProjectData): Promise<void> {
		if (!this.$fs.exists(absoluteOutputPath)) {
			// Force copying if the destination doesn't exist.
			lastModifiedTime = null;
		}

		let dependenciesBuilder = this.$injector.resolve(NodeModulesDependenciesBuilder, {});
		let productionDependencies = dependenciesBuilder.getProductionDependencies(projectData.projectDir);

		if (!this.$options.bundle) {
			const tnsModulesCopy = this.$injector.resolve(TnsModulesCopy, {
				outputRoot: absoluteOutputPath
			});
			tnsModulesCopy.copyModules(productionDependencies, platform);
		} else {
			this.cleanNodeModules(absoluteOutputPath, platform);
		}

		const npmPluginPrepare: NpmPluginPrepare = this.$injector.resolve(NpmPluginPrepare);
		await npmPluginPrepare.preparePlugins(productionDependencies, platform, projectData);
	}

	public cleanNodeModules(absoluteOutputPath: string, platform: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
	}
}

$injector.register("nodeModulesBuilder", NodeModulesBuilder);
