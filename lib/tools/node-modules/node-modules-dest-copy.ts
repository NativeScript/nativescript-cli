import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import * as shelljs from "shelljs";
import * as constants from "../../constants";
import * as minimatch from "minimatch";
import Future = require("fibers/future");

export interface ILocalDependencyData extends IDependencyData {
	directory: string;
}

export class NpmDependencyResolver {
	constructor(
		private projectDir: string
	) {
	}

	private getDevDependencies(projectDir: string): IDictionary<any> {
		let projectFilePath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
		let projectFileContent = require(projectFilePath);
		return projectFileContent.devDependencies || {};
	}

    public resolveDependencies(changedDirectories: string[], platform: string): IDictionary<ILocalDependencyData> {
		const devDependencies = this.getDevDependencies(this.projectDir);
		const dependencies: IDictionary<ILocalDependencyData> = Object.create(null);

		_.each(changedDirectories, changedDirectoryAbsolutePath => {
			if (!devDependencies[path.basename(changedDirectoryAbsolutePath)]) {
				let pathToPackageJson = path.join(changedDirectoryAbsolutePath, constants.PACKAGE_JSON_FILE_NAME);
				let packageJsonFileExists = fs.existsSync(pathToPackageJson);
				if(packageJsonFileExists) {
					let fileContent = require(pathToPackageJson);
					let currentDependency: ILocalDependencyData = {
						name: fileContent.name,
						version: fileContent.version,
						directory: path.dirname(pathToPackageJson),
						nativescript: fileContent.nativescript
					};
					dependencies[currentDependency.name] = currentDependency;
				}
			}
		});
		return dependencies;
    }

	private enumeratePackageJsonFilesSync(nodeModulesDirectoryPath: string, foundFiles?: string[]): string[] {
		foundFiles = foundFiles || [];
		if (fs.existsSync(nodeModulesDirectoryPath)) {
			let contents = fs.readdirSync(nodeModulesDirectoryPath);
			for (let i = 0; i < contents.length; ++i) {
				let moduleName = contents[i];
				let moduleDirectoryInNodeModules = path.join(nodeModulesDirectoryPath, moduleName);
				let packageJsonFilePath = path.join(moduleDirectoryInNodeModules, constants.PACKAGE_JSON_FILE_NAME);
				if (fs.existsSync(packageJsonFilePath)) {
					foundFiles.push(packageJsonFilePath);
				}

				let directoryPath = path.join(moduleDirectoryInNodeModules, constants.NODE_MODULES_FOLDER_NAME);
				if (fs.existsSync(directoryPath)) {
					this.enumeratePackageJsonFilesSync(directoryPath, foundFiles);
				} else if (fs.statSync(moduleDirectoryInNodeModules).isDirectory()) {
					// Scoped modules (e.g. @angular) are grouped in a subfolder and we need to enumerate them too.
					this.enumeratePackageJsonFilesSync(moduleDirectoryInNodeModules, foundFiles);
				}
			}
		}
		return foundFiles;
	}
}

export class TnsModulesCopy {
	constructor(
		private outputRoot: string,
		private $fs: IFileSystem
	) {
	}

	public copyModules(dependencies: IDictionary<ILocalDependencyData>, platform: string): void {
		_.each(dependencies, dependency => {
			this.copyDependencyDir(dependency);

			//TODO: plamen5kov: this logic for all plugins (remove .ts files and remove platforms/ folder from plugins)
			if (dependency.name === constants.TNS_CORE_MODULES_NAME) {
				let tnsCoreModulesResourcePath = path.join(this.outputRoot, constants.TNS_CORE_MODULES_NAME);

				// Remove .ts files
				let allFiles = this.$fs.enumerateFilesInDirectorySync(tnsCoreModulesResourcePath);
				let deleteFilesFutures = allFiles.filter(file => minimatch(file, "**/*.ts", { nocase: true })).map(file => this.$fs.deleteFile(file));
				Future.wait(deleteFilesFutures);

				shelljs.rm("-rf", path.join(this.outputRoot, dependency.name, "node_modules"));
			}
		});
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
	}
}

export class NpmPluginPrepare {
	constructor(
		private $fs: IFileSystem,
		private $pluginsService: IPluginsService,
		private $platformsData: IPlatformsData
	) {
	}

	public preparePlugins(dependencies: IDictionary<IDependencyData>, platform: string): void {
		if (_.isEmpty(dependencies)) {
			return;
		}

		this.$platformsData.getPlatformData(platform).platformProjectService.beforePrepareAllPlugins().wait();
		_.each(dependencies, dependency => {
			let isPlugin = !!dependency.nativescript;
			if (isPlugin) {
				console.log("preparing: " + dependency.name);
				this.$pluginsService.prepare(dependency, platform).wait();
			}
		});
		this.$platformsData.getPlatformData(platform).platformProjectService.afterPrepareAllPlugins().wait();
	}
}
