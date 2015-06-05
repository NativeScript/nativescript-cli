///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import semver = require("semver");
import npm = require("npm");
import constants = require("./constants");

export class NpmInstallationManager {
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
			this.$npm.cache(packageName, version).wait();
			let packagePath = path.join(npm.cache, name, version, "package");
			if(!this.isPackageUnpacked(packagePath).wait()) {
				this.cacheUnpack(packageName, version).wait();
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
				var packageToInstall = packageName;
				var pathToSave = (opts && opts.pathToSave) || npm.cache;
				var version = (opts && opts.version) || null;

				return this.installCore(packageToInstall, pathToSave, version).wait();
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail("%s. Error: %s", NpmInstallationManager.NPM_LOAD_FAILED, error);
			} finally {
				this.$lockfile.unlock().wait();
			}

		}).future<string>()();
	}

	private installCore(packageName: string, pathToSave: string, version: string): IFuture<string> {
		return (() => {
			if (this.$options.frameworkPath) {
				if (this.$fs.getFsStats(this.$options.frameworkPath).wait().isFile()) {
					this.npmInstall(packageName, pathToSave, version).wait();
					var pathToNodeModules = path.join(pathToSave, "node_modules");
					var folders = this.$fs.readDirectory(pathToNodeModules).wait();
					return path.join(pathToNodeModules, folders[0]);
				}
				return this.$options.frameworkPath;
			} else {
				version = version || this.getLatestVersion(packageName).wait();
				var packagePath = this.getCachedPackagePath(packageName, version);
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

		var incrementedVersion = semver.inc(version, constants.ReleaseType.MINOR);
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
				this.$fs.enumerateFilesInDirectorySync(packagePath).length > 1;
		}).future<boolean>()();
	}	
}
$injector.register("npmInstallationManager", NpmInstallationManager);