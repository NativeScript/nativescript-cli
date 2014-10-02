///<reference path=".d.ts"/>

import Future = require("fibers/future");
import npm = require("npm");
import path = require("path");
import semver = require("semver");
import shell = require("shelljs");
import helpers = require("./common/helpers");
import constants = require("./constants");
import options = require("./options");

export class NodePackageManager implements INodePackageManager {
	private static NPM_LOAD_FAILED = "Failed to retrieve data from npm. Please try again a little bit later.";
	private static NPM_REGISTRY_URL = "http://registry.npmjs.org/";

	private versionsCache: IDictionary<string[]>;
	private isLoaded: boolean;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $httpClient: Server.IHttpClient,
		private $staticConfig: IStaticConfig,
		private $fs: IFileSystem) {
		this.versionsCache = {};
	}

	public getCacheRootPath(): IFuture<string> {
		return (() => {
			this.load().wait();
			return npm.cache;
		}).future<string>()();
	}

	public addToCache(packageName: string, version: string): IFuture<void> {
		return (() => {
			this.load().wait();
			this.addToCacheCore(packageName, version).wait();
		}).future<void>()();
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
			try {
				this.load().wait(); // It's obligatory to execute load before whatever npm function

				var packageToInstall = packageName;
				var pathToSave = (opts && opts.pathToSave) || npm.cache;
				var version = (opts && opts.version) || null;
				var isSemanticVersioningDisabled = options.frameworkPath ? true : false; // We need to disable sem versioning for local packages

				if(version) {
					this.validateVersion(packageName, version).wait();
					packageToInstall = packageName + "@" + version;
				}

				this.installCore(packageToInstall, pathToSave, isSemanticVersioningDisabled).wait();
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail(NodePackageManager.NPM_LOAD_FAILED);
			}

			var pathToNodeModules = path.join(pathToSave, "node_modules");
			var folders = this.$fs.readDirectory(pathToNodeModules).wait();
			return path.join(pathToNodeModules, folders[0]);

		}).future<string>()();
	}

	public getLatestVersion(packageName: string): IFuture<string> {
		return (() => {
			var versions = this.getAvailableVersions(packageName).wait();
			versions = _.sortBy(versions, (ver: string) => { return ver; });
			return versions.reverse()[0];
		}).future<string>()();
	}

	private installCore(packageName: string, pathToSave: string, isSemanticVersioningDisabled: boolean): IFuture<void> {
		var currentVersion = this.$staticConfig.version;
		if(!semver.valid(currentVersion)) {
			this.$errors.fail("Invalid version.");
		}

		if(!isSemanticVersioningDisabled) {
			var incrementedVersion = semver.inc(currentVersion, constants.ReleaseType.MINOR);
			if(packageName.indexOf("@") < 0) {
				packageName = packageName + "@<" + incrementedVersion;
			}
		}

		this.$logger.out("Installing ", packageName);

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

	private validateVersion(packageName: string, version: string): IFuture<void> {
		return (() => {
			var versions = this.getAvailableVersions(packageName).wait();
			if(!_.contains(versions, version)) {
				this.$errors.fail("Invalid version. Valid versions are: %s", helpers.formatListOfNames(versions, "and"));
			}
		}).future<void>()();
	}
}
$injector.register("npm", NodePackageManager);
