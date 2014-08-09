///<reference path=".d.ts"/>

import Future = require("fibers/future");
import npm = require("npm");
import path = require("path");
import semver = require("semver");
import shell = require("shelljs");
import helpers = require("./common/helpers");
import constants = require("./constants");

export class NodePackageManager implements INodePackageManager {
	private static NPM_LOAD_FAILED = "Failed to retrieve data from npm. Please try again a little bit later.";
	private static NPM_REGISTRY_URL = "http://registry.npmjs.org/";

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $httpClient: Server.IHttpClient,
		private $staticConfig: IStaticConfig) { }

	public get cache(): string {
		return npm.cache;
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

	public install(packageName: string, pathToSave?: string, version?: string): IFuture<string> {
		return (() => {
			try {
				this.load().wait(); // It's obligatory to execute load before whatever npm function
				pathToSave = pathToSave || npm.cache;
				var packageToInstall = packageName;

				if(version) {
					this.validateVersion(packageName, version).wait();
					packageToInstall = packageName + "@" + version;
				}

				this.installCore(packageToInstall, pathToSave).wait();
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail(NodePackageManager.NPM_LOAD_FAILED);
			}

			return path.join(pathToSave, "node_modules", packageName);

		}).future<string>()();
	}

	private installCore(packageName: string, pathToSave: string): IFuture<void> {
		var currentVersion = this.$staticConfig.version;
		if(!semver.valid(currentVersion)) {
			this.$errors.fail("Invalid version.");
		}

		var incrementedVersion = semver.inc(currentVersion, constants.ReleaseType.MINOR);
		packageName = packageName + "@" + "<" + incrementedVersion;
		this.$logger.trace("Installing", packageName);

		var future = new Future<void>();
		npm.commands["install"](pathToSave, packageName, (err, data) => {
			if(err) {
				future.throw(err);
			} else {
				future.return(data);
			}
		});
		return future;
	}

	private getAvailableVersions(packageName: string): IFuture<string[]> {
		return (() => {
			var url = NodePackageManager.NPM_REGISTRY_URL + packageName;
			var response = this.$httpClient.httpRequest(url).wait().body;
			var json = JSON.parse(response);
			return _.keys(json.versions);
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
