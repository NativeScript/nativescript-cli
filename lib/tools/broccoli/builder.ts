///<reference path="../../.d.ts"/>
"use strict";

import * as constants from "../../../lib/constants";
import * as path from "path";
import Future = require("fibers/future");
import destCopyLib = require("./node-modules-dest-copy");

let gulp = require("gulp");
let vinylFilterSince = require("vinyl-filter-since");
let through = require("through2");

export class Builder implements IBroccoliBuilder {
	constructor(
		private $fs: IFileSystem,
		private $nodeModulesTree: INodeModulesTree,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $injector: IInjector,
		private $logger: ILogger
	) {
	}

	public getChangedNodeModules(absoluteOutputPath: string, platform: string, lastModifiedTime?: Date): IFuture<any> {
		return (() => {
			let projectDir = this.$projectData.projectDir;
			let isNodeModulesModified = false;
			let nodeModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME);
			let nodeModules: any = {};

			if(lastModifiedTime) {
				let pipeline = gulp.src(path.join(projectDir, "node_modules/**"))
				.pipe(vinylFilterSince(lastModifiedTime))
				.pipe(through.obj( (chunk: any, enc: any, cb: Function) => {
					if(chunk.path === nodeModulesPath) {
						isNodeModulesModified = true;
					}

					if(!isNodeModulesModified) {
						let rootModuleName = chunk.path.split(nodeModulesPath)[1].split(path.sep)[1];
						let rootModuleFullPath = path.join(nodeModulesPath, rootModuleName);
						nodeModules[rootModuleFullPath] = rootModuleFullPath;
					}

					cb(null);
				}))
				.pipe(gulp.dest(absoluteOutputPath));

				let future = new Future<void>();

				pipeline.on('end', (err: Error, data: any) => {
					if(err) {
						future.throw(err);
					} else {
						future.return();
					}
				});

				future.wait();
			}

			if(isNodeModulesModified && this.$fs.exists(absoluteOutputPath).wait()) {
				let currentPreparedTnsModules = this.$fs.readDirectory(absoluteOutputPath).wait();
				let tnsModulesPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.TNS_MODULES_FOLDER_NAME);
				if(!this.$fs.exists(tnsModulesPath).wait()) {
					tnsModulesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, constants.TNS_CORE_MODULES_NAME);
				}
				let tnsModulesInApp = this.$fs.readDirectory(tnsModulesPath).wait();
				let modulesToDelete = _.difference(currentPreparedTnsModules, tnsModulesInApp);
				_.each(modulesToDelete, moduleName => this.$fs.deleteDirectory(path.join(absoluteOutputPath, moduleName)).wait());
			}

			if(!lastModifiedTime || isNodeModulesModified) {
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
			let nodeModules = this.getChangedNodeModules(absoluteOutputPath, platform, lastModifiedTime).wait();
			let destCopy = this.$injector.resolve(destCopyLib.DestCopy, {
				inputPath: this.$projectData.projectDir,
				cachePath: "",
				outputRoot: absoluteOutputPath,
				projectDir: this.$projectData.projectDir,
				platform: platform
			});

			destCopy.rebuildChangedDirectories(_.keys(nodeModules));

		}).future<void>()();
	}
}
$injector.register("broccoliBuilder", Builder);
