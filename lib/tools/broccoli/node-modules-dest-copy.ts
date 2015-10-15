///<reference path="../../.d.ts"/>
"use strict";

import fs = require("fs");
import * as path from "path";
import semver = require("semver");
import * as shelljs from "shelljs";
import {wrapBroccoliPlugin} from './broccoli-plugin-wrapper-factory';
import constants = require("../../constants");

/**
 * Intercepts each directory as it is copied to the destination tempdir,
 * and tees a copy to the given path outside the tmp dir.
 */
export class DestCopy implements IBroccoliPlugin {
	private dependencies:  IDictionary<any>  = null;
	private devDependencies:  IDictionary<any>  = null;

	constructor(
		private inputPath: string,
		private cachePath: string,
		private outputRoot: string,
		private projectDir: string,
		private platform: string,
		private $fs: IFileSystem,
		private $projectFilesManager: IProjectFilesManager,
		private $pluginsService: IPluginsService
	) {
		this.dependencies = Object.create(null);
		this.devDependencies = this.getDevDependencies(projectDir);
	}

  public rebuildChangedDirectories(changedDirectories: string[], platform: string): void {
	_.each(changedDirectories, changedDirectoryAbsolutePath => {
		if(!this.devDependencies[path.basename(changedDirectoryAbsolutePath)]) {
			let pathToPackageJson = path.join(changedDirectoryAbsolutePath, constants.PACKAGE_JSON_FILE_NAME);
			let packageJsonFiles = fs.existsSync(pathToPackageJson) ? [pathToPackageJson] : [];
			let nodeModulesFolderPath = path.join(changedDirectoryAbsolutePath, constants.NODE_MODULES_FOLDER_NAME);
			packageJsonFiles = packageJsonFiles.concat(this.enumeratePackageJsonFilesSync(nodeModulesFolderPath));

			_.each(packageJsonFiles, packageJsonFilePath => {
				let fileContent = require(packageJsonFilePath);

				if(!this.devDependencies[fileContent.name]) { // Don't flatten dev dependencies
					let currentDependency = {
						name: fileContent.name,
						version: fileContent.version,
						directory: path.dirname(packageJsonFilePath),
						nativescript: fileContent.nativescript
					};

					let addedDependency = this.dependencies[currentDependency.name];
					if (addedDependency) {
						if (semver.gt(currentDependency.version, addedDependency.version)) {
							let currentDependencyMajorVersion = semver.major(currentDependency.version);
							let addedDependencyMajorVersion = semver.major(addedDependency.version);

							let message = `The depedency located at ${addedDependency.directory} with version  ${addedDependency.version} will be replaced with dependency located at ${currentDependency.directory} with version ${currentDependency.version}`;
							let logger = $injector.resolve("$logger");
							currentDependencyMajorVersion === addedDependencyMajorVersion ? logger.out(message) : logger.warn(message);

							this.dependencies[currentDependency.name] = currentDependency;
						}
					} else {
						this.dependencies[currentDependency.name] = currentDependency;
					}
				}
			});
		}
	});

	_.each(this.dependencies, dependency => {
		this.copyDependencyDir(dependency);

		let isPlugin = !!dependency.nativescript;
		if(isPlugin) {
			this.$pluginsService.prepare(dependency).wait();
		}

		if (dependency.name === constants.TNS_CORE_MODULES_NAME) {
			let tnsCoreModulesResourcePath = path.join(this.outputRoot, constants.TNS_CORE_MODULES_NAME);
			shelljs.cp("-Rf", path.join(tnsCoreModulesResourcePath, "*"), this.outputRoot);
			this.$fs.deleteDirectory(tnsCoreModulesResourcePath).wait();
		}
	});

	if(!_.isEmpty(this.dependencies)) {
		this.$pluginsService.afterPrepareAllPlugins().wait();
	}
  }

  private copyDependencyDir(dependency: any): void {
		let dependencyDir = path.dirname(dependency.name || "");
		let insideNpmScope = /^@/.test(dependencyDir);
		let targetDir = this.outputRoot;
		if (insideNpmScope) {
			targetDir = path.join(this.outputRoot, dependencyDir);
		}
		shelljs.mkdir("-p", targetDir);
		shelljs.cp("-Rf", dependency.directory, targetDir);
		shelljs.rm("-rf", path.join(targetDir, dependency.name, "node_modules"));
  }

  public rebuild(treeDiff: IDiffResult): void {
	this.rebuildChangedDirectories(treeDiff.changedDirectories, "");

	// Cache input tree
	let projectFilePath = path.join(this.projectDir, constants.PACKAGE_JSON_FILE_NAME);
	let projectFileContent = require(projectFilePath);
	projectFileContent[constants.NATIVESCRIPT_KEY_NAME][constants.NODE_MODULE_CACHE_PATH_KEY_NAME] = this.inputPath;
	fs.writeFileSync(projectFilePath, JSON.stringify(projectFileContent, null, "\t"), { encoding: "utf8" });
  }

  private getDevDependencies(projectDir: string): IDictionary<any> {
	let projectFilePath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
	let projectFileContent = require(projectFilePath);
	return projectFileContent.devDependencies || {};
  }

  private enumeratePackageJsonFilesSync(nodeModulesDirectoryPath: string, foundFiles?: string[]): string[] {
		foundFiles = foundFiles || [];
		if(fs.existsSync(nodeModulesDirectoryPath)) {
			let contents = fs.readdirSync(nodeModulesDirectoryPath);
			for (let i = 0; i < contents.length; ++i) {
				let packageJsonFilePath = path.join(nodeModulesDirectoryPath, contents[i], constants.PACKAGE_JSON_FILE_NAME);
				if (fs.existsSync(packageJsonFilePath)) {
					foundFiles.push(packageJsonFilePath);
				}

				let directoryPath = path.join(nodeModulesDirectoryPath, contents[i], constants.NODE_MODULES_FOLDER_NAME);
				if (fs.existsSync(directoryPath)) {
					this.enumeratePackageJsonFilesSync(directoryPath, foundFiles);
				}
			}
		}
		return foundFiles;
  }
}

export default wrapBroccoliPlugin(DestCopy);
