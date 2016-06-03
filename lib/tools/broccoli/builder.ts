import * as constants from "../../../lib/constants";
import * as fs from "fs";
import * as path from "path";
import * as shelljs from "shelljs";
import Future = require("fibers/future");
import * as destCopyLib from "./node-modules-dest-copy";
import * as fiberBootstrap from "../../common/fiber-bootstrap";

let glob = require("glob");

export class Builder implements IBroccoliBuilder {
	constructor(
		private $fs: IFileSystem,
		private $nodeModulesTree: INodeModulesTree,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $lockfile: ILockFile) { }

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
									if(!future.isResolved()) {
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
				let tnsModulesPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.TNS_MODULES_FOLDER_NAME);
				if (!this.$fs.exists(tnsModulesPath).wait()) {
					tnsModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_CORE_MODULES_NAME);
				}
				let tnsModulesInApp = this.$fs.readDirectory(tnsModulesPath).wait();
				let modulesToDelete = _.difference(currentPreparedTnsModules, tnsModulesInApp);
				_.each(modulesToDelete, moduleName => this.$fs.deleteDirectory(path.join(absoluteOutputPath, moduleName)).wait());
			}

			if (!lastModifiedTime || isNodeModulesModified) {
				this.listModules(nodeModulesPath, nodeModules);
			}

			return nodeModules;
		}).future<any>()();
	}

	private listModules(nodeModulesPath: string, nodeModules: any): void {
		let nodeModulesDirectories = this.$fs.exists(nodeModulesPath).wait() ? this.$fs.readDirectory(nodeModulesPath).wait() : [];
		_.each(nodeModulesDirectories, nodeModuleDirectoryName => {
			let isNpmScope = /^@/.test(nodeModuleDirectoryName);
			let nodeModuleFullPath = path.join(nodeModulesPath, nodeModuleDirectoryName);
			if (isNpmScope) {
				this.listModules(nodeModuleFullPath, nodeModules);
			} else {
				nodeModules[nodeModuleFullPath] = nodeModuleFullPath;
			}
		});
	}

	public prepareNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime?: Date): IFuture<void> {
		return (() => {
			if (!fs.existsSync(absoluteOutputPath)) {
				// Force copying if the destination doesn't exist.
				lastModifiedTime = null;
			}
			let nodeModules = this.getChangedNodeModules(absoluteOutputPath, platform, lastModifiedTime).wait();
			let destCopy = this.$injector.resolve(destCopyLib.DestCopy, {
				inputPath: this.$projectData.projectDir,
				cachePath: "",
				outputRoot: absoluteOutputPath,
				projectDir: this.$projectData.projectDir,
				platform: platform
			});

			destCopy.rebuildChangedDirectories(_.keys(nodeModules), platform);

		}).future<void>()();
	}

	public cleanNodeModules(absoluteOutputPath: string, platform: string): void {
		shelljs.rm("-rf", absoluteOutputPath);
    }
}
$injector.register("broccoliBuilder", Builder);
