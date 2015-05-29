///<reference path="../../.d.ts"/>
"use strict";

import fs = require("fs");
import path = require('path');
import semver = require("semver");
import util = require("util");
import shelljs = require("shelljs");
import {wrapBroccoliPlugin} from './broccoli-plugin-wrapper-factory';
import constants = require("./../../constants");

/**
 * Intercepts each directory as it is copied to the destination tempdir,
 * and tees a copy to the given path outside the tmp dir.
 */
export class DestCopy implements IBroccoliPlugin {
  constructor(private inputPath: string, private cachePath: string, private outputRoot: string, private projectDir: string) {}

  public rebuild(treeDiff: IDiffResult): void {	  
	let dependencies = this.getDependencies();	  
	let devDependencies = this.getDevDependencies(this.projectDir);
	
	treeDiff.changedDirectories.forEach(changedDirectory => {
		let changedDirectoryAbsolutePath = path.join(this.inputPath, constants.NODE_MODULES_FOLDER_NAME, changedDirectory);
		let packageJsonFiles = [path.join(changedDirectoryAbsolutePath, "package.json")];
		let nodeModulesFolderPath = path.join(changedDirectoryAbsolutePath, "node_modules");
		packageJsonFiles = packageJsonFiles.concat(this.enumeratePackageJsonFilesSync(nodeModulesFolderPath));
		
		_.each(packageJsonFiles, packageJsonFilePath => {
			let fileContent = require(packageJsonFilePath);
			let isPlugin = fileContent.nativescript;
	
			if(!devDependencies[fileContent.name]) { // Don't flatten dev dependencies
		
				let currentDependency = {
					name: fileContent.name,
					version: fileContent.version,
					directory: path.dirname(packageJsonFilePath),
					isPlugin: isPlugin
				};
				
				let addedDependency = dependencies[currentDependency.name];
				if (addedDependency) {
					if (semver.gt(currentDependency.version, addedDependency.version)) {
						let currentDependencyMajorVersion = semver.major(currentDependency.version);
						let addedDependencyMajorVersion = semver.major(addedDependency.version);
		
						let message = util.format("Old version %s, new version %s. Old location %s, new location %s.", addedDependency.version, currentDependency.version, addedDependency.directory, currentDependency.directory);
						currentDependencyMajorVersion === addedDependencyMajorVersion ? console.log(message) : console.log(message);
		
						dependencies[currentDependency.name] = currentDependency;
					}
				} else {
					dependencies[currentDependency.name] = currentDependency;
				}
			}
		});
	});
	
	_.each(dependencies, dependency => {
		shelljs.cp("-R", dependency.directory, this.outputRoot);
		shelljs.rm("-rf", path.join(this.outputRoot, dependency.name, "node_modules"));
		if(dependency.isPlugin) {
			shelljs.rm("-rf", path.join(this.outputRoot, dependency.name, "platforms"));
		}
	});
	
	// Cache input tree
	let projectFilePath = path.join(this.projectDir, constants.PACKAGE_JSON_FILE_NAME);	
	let projectFileContent = require(projectFilePath);
	projectFileContent[constants.NATIVESCRIPT_KEY_NAME][constants.NODE_MODULE_CACHE_PATH_KEY_NAME] = this.inputPath;	
	fs.writeFileSync(projectFilePath, JSON.stringify(projectFileContent, null, "\t"), { encoding: "utf8" });	
  }
  
  private getDependencies(): IDictionary<any> {
	  let result = Object.create(null);
	  try {
		  let dirs = fs.readdirSync(this.outputRoot);
		  _.each(dirs, dir => {
			  let fileContent = require(path.join(dir, constants.PACKAGE_JSON_FILE_NAME));
			  result[fileContent.name] = fileContent;
			 });
	  } catch(err) {
		  result = Object.create(null);
	  }
	  
	  return result;
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
				foundFiles.push(path.join(nodeModulesDirectoryPath, contents[i], "package.json"));
                
                var directoryPath = path.join(nodeModulesDirectoryPath, contents[i], "node_modules");
                if (fs.existsSync(directoryPath)) {
                    this.enumeratePackageJsonFilesSync(directoryPath, foundFiles);
                }
			}
		}
		return foundFiles;
  }
}

export default wrapBroccoliPlugin(DestCopy);
