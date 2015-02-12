///<reference path=".d.ts"/>
"use strict";

import Future = require("fibers/future");
import npm = require("npm");
import path = require("path");
import semver = require("semver");
import shell = require("shelljs");
import helpers = require("./common/helpers");
import constants = require("./constants");
import options = require("./common/options");

export class NodePackageManager implements INodePackageManager {
	private static NPM_LOAD_FAILED = "Failed to retrieve data from npm. Please try again a little bit later.";
	private static NPM_REGISTRY_URL = "http://registry.npmjs.org/";

	private versionsCache: IDictionary<string[]>;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $httpClient: Server.IHttpClient,
		private $fs: IFileSystem,
		private $lockfile: ILockFile) {
		this.versionsCache = {};
		this.load().wait();
	}

	public getCacheRootPath(): string {
		return npm.cache;
	}

	public addToCache(packageName: string, version: string): IFuture<void> {
		return this.addToCacheCore(packageName, version);
	}

	public load(config?: any): IFuture<void> {
		var future = new Future<void>();
		npm.load(config, (err) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
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
				this.$errors.fail("%s. Error: %s", NodePackageManager.NPM_LOAD_FAILED, error);
			} finally {
				this.$lockfile.unlock().wait();
			}

		}).future<string>()();
	}

	public getLatestVersion(packageName: string): IFuture<string> {
		return (() => {
			var versions = this.getAvailableVersions(packageName).wait();
			versions = _.sortBy(versions, (ver: string) => { return ver; });
			return versions.reverse()[0];
		}).future<string>()();
	}

	private installCore(packageName: string, pathToSave: string, version: string): IFuture<string> {
		return (() => {
			if (options.frameworkPath) {
				if (this.$fs.getFsStats(options.frameworkPath).wait().isFile()) {
					this.npmInstall(packageName, pathToSave, version).wait();
					var pathToNodeModules = path.join(pathToSave, "node_modules");
					var folders = this.$fs.readDirectory(pathToNodeModules).wait();
					return path.join(pathToNodeModules, folders[0]);
				}
				return options.frameworkPath;
			} else {
				var version: string = version || this.getLatestVersion(packageName).wait();
				var packagePath = path.join(npm.cache, packageName, version, "package");
				if (!this.isPackageCached(packagePath).wait()) {
					this.addToCacheCore(packageName, version).wait();
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
		if (!options.frameworkPath && packageName.indexOf("@") < 0) {
			packageName = packageName + "@<" + incrementedVersion;
		}

		var future = new Future<void>();
		npm.commands["install"](pathToSave, packageName, (err: Error, data: any) => {
			if(err) {
				future.throw(err);
			} else {
				this.$logger.out("Installed ", packageName);
				future.return(data);
			}
		});
		return future;
	}

	private isPackageCached(packagePath: string): IFuture<boolean> {
		return this.$fs.exists(packagePath);
	}

	private isPackageUnpacked(packagePath: string): IFuture<boolean> {
		return (() => {
			return this.$fs.getFsStats(packagePath).wait().isDirectory() &&
				helpers.enumerateFilesInDirectorySync(packagePath).length > 1;
		}).future<boolean>()();
	}

	private addToCacheCore(packageName: string, version: string): IFuture<void> {
		var future = new Future<void>();
		npm.commands["cache"].add(packageName, version, undefined, (err: Error, data: any) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}

	public cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void> {
		var future = new Future<void>();
		unpackTarget = unpackTarget || path.join(npm.cache, packageName, version, "package");
		npm.commands["cache"].unpack(packageName, version, unpackTarget, (err: Error, data: any) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}

	private getAvailableVersions(packageName: string): IFuture<string[]> {
		return (() => {
			if(!this.versionsCache[packageName]) {
				var url = NodePackageManager.NPM_REGISTRY_URL + packageName;
				var response = this.$httpClient.httpRequest(url).wait().body;
				var json = JSON.parse(response);
				this.versionsCache[packageName] = _.keys(json.versions);
			}

			return this.versionsCache[packageName];
		}).future<string[]>()();
	}
}
$injector.register("npm", NodePackageManager);
