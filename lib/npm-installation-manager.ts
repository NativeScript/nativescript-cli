///<reference path=".d.ts"/>
"use strict";

import * as path from "path";
import semver = require("semver");
import * as npm from "npm";
import * as constants from "./constants";

export class NpmInstallationManager implements INpmInstallationManager {
	private static NPM_LOAD_FAILED = "Failed to retrieve data from npm. Please try again a little bit later.";	
	private versionsCache: IDictionary<string[]>;	
	
	constructor(private $npm: INodePackageManager,
		private $logger: ILogger,
		private $lockfile: ILockFile,
		private $errors: IErrors,
		private $options: IOptions,
		private $fs: IFileSystem) {
		this.versionsCache = {};		
		this.$npm.load().wait(); 
	}
	
	public getCacheRootPath(): string {
		return this.$npm.getCache();
	}
	
	public getCachedPackagePath(packageName: string, version: string): string {
		return path.join(this.getCacheRootPath(), packageName, version, "package");
	}

	public addToCache(packageName: string, version: string): IFuture<void> {
		return (() => {
			let cachedPackagePath = this.getCachedPackagePath(packageName, version);
			if(!this.$fs.exists(cachedPackagePath).wait()) {
				this.addToCacheCore(packageName, version).wait();
			}

			if(!this.isShasumOfPackageCorrect(packageName, version).wait()) {
				// In some cases the package is not fully downloaded and the framework directory is missing
				// Try removing the old package and add the real one to cache again
				this.addCleanCopyToCache(packageName, version).wait();
			}
		}).future<void>()();
	}

	public cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void> {
		unpackTarget = unpackTarget || path.join(npm.cache, packageName, version, "package");
		return this.$npm.cacheUnpack(packageName, version, unpackTarget);
	}
	
	public getLatestVersion(packageName: string): IFuture<string> {
		return (() => {
			let data = this.$npm.view(packageName, "dist-tags").wait();			
			let latestVersion = _.first(_.keys(data));
			this.$logger.trace("Using version %s. ", latestVersion);
			
			return latestVersion;
		}).future<string>()();
	}
	
	public install(packageName: string, opts?: INpmInstallOptions): IFuture<string> {
		return (() => {
			this.$lockfile.lock().wait();

			try {
				let packageToInstall = packageName;
				let pathToSave = (opts && opts.pathToSave) || npm.cache;
				let version = (opts && opts.version) || null;

				return this.installCore(packageToInstall, pathToSave, version).wait();
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail("%s. Error: %s", NpmInstallationManager.NPM_LOAD_FAILED, error);
			} finally {
				this.$lockfile.unlock().wait();
			}

		}).future<string>()();
	}

	public addCleanCopyToCache(packageName: string, version: string): IFuture<void> {
		return (() => {
			let packagePath = path.join(this.getCacheRootPath(), packageName, version);
			this.$logger.trace(`Deleting: ${packagePath}.`);
			this.$fs.deleteDirectory(packagePath).wait();
			this.addToCacheCore(packageName, version).wait();
			if(!this.isShasumOfPackageCorrect(packageName, version).wait()) {
				this.$errors.failWithoutHelp(`Unable to add package ${packageName} with version ${version} to npm cache. Try cleaning your cache and execute the command again.`);
			}
		}).future<void>()();
	}

	private addToCacheCore(packageName: string, version: string): IFuture<void> {
		return (() => {
			this.$npm.cache(packageName, version).wait();
			let packagePath = path.join(this.getCacheRootPath(), packageName, version, "package");
			if(!this.isPackageUnpacked(packagePath).wait()) {
				this.cacheUnpack(packageName, version).wait();
			}
		}).future<void>()();
	}

	private isShasumOfPackageCorrect(packageName: string, version: string): IFuture<boolean> {
		return ((): boolean => {
			let shasumProperty = "dist.shasum";
			let cachedPackagePath = this.getCachedPackagePath(packageName, version);
			let realShasum = this.$npm.view(`${packageName}@${version}`, shasumProperty).wait()[version][shasumProperty];
			let packageTgz = cachedPackagePath + ".tgz";
			let currentShasum = "";
			if(this.$fs.exists(packageTgz).wait()) {
				currentShasum = this.$fs.getFileShasum(packageTgz).wait();
			}
			this.$logger.trace(`Checking shasum of package: ${packageName}@${version}: expected ${realShasum}, actual ${currentShasum}.`);
			return realShasum === currentShasum;
		}).future<boolean>()();
	}

	private installCore(packageName: string, pathToSave: string, version: string): IFuture<string> {
		return (() => {
			if (this.$options.frameworkPath) {
				if (this.$fs.getFsStats(this.$options.frameworkPath).wait().isFile()) {
					this.npmInstall(packageName, pathToSave, version).wait();
					let pathToNodeModules = path.join(pathToSave, "node_modules");
					let folders = this.$fs.readDirectory(pathToNodeModules).wait();
					return path.join(pathToNodeModules, folders[0]);
				}
				return this.$options.frameworkPath;
			} else {
				version = version || this.getLatestVersion(packageName).wait();
				let packagePath = this.getCachedPackagePath(packageName, version);
				if (!this.isPackageCached(packagePath).wait()) {
					this.$npm.cache(packageName, version).wait();
				}

				if(!this.isPackageUnpacked(packagePath).wait()) {
					this.cacheUnpack(packageName, version).wait();
				}
				return packagePath;
			}
		}).future<string>()();
	}
	
	private npmInstall(packageName: string, pathToSave: string, version: string): IFuture<void> {
		this.$logger.out("Installing ", packageName);

		let incrementedVersion = semver.inc(version, constants.ReleaseType.MINOR);
		if (!this.$options.frameworkPath && packageName.indexOf("@") < 0) {
			packageName = packageName + "@<" + incrementedVersion;
		}

		return this.$npm.install(packageName, pathToSave);
	}
	
	private isPackageCached(packagePath: string): IFuture<boolean> {
		return this.$fs.exists(packagePath);
	}

	private isPackageUnpacked(packagePath: string): IFuture<boolean> {
		return (() => {
			return this.$fs.getFsStats(packagePath).wait().isDirectory() &&
				this.$fs.exists(path.join(packagePath, "framework")).wait() && 
				this.$fs.enumerateFilesInDirectorySync(path.join(packagePath, "framework")).length > 1;
		}).future<boolean>()();
	}	
}
$injector.register("npmInstallationManager", NpmInstallationManager);
