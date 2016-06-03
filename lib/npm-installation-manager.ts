import * as path from "path";
import * as semver from "semver";
import * as npm from "npm";
import * as constants from "./constants";

export class NpmInstallationManager implements INpmInstallationManager {
	private static NPM_LOAD_FAILED = "Failed to retrieve data from npm. Please try again a little bit later.";
	private versionsCache: IDictionary<string[]>;
	private packageSpecificDirectories: IStringDictionary = {
		"tns-android": constants.PROJECT_FRAMEWORK_FOLDER_NAME,
		"tns-ios": constants.PROJECT_FRAMEWORK_FOLDER_NAME,
		"tns-ios-inspector": "WebInspectorUI",
		"tns-template-hello-world": constants.APP_RESOURCES_FOLDER_NAME,
		"tns-template-hello-world-ts": constants.APP_RESOURCES_FOLDER_NAME,
		"tns-template-hello-world-ng": constants.APP_RESOURCES_FOLDER_NAME
	};

	constructor(private $npm: INodePackageManager,
		private $logger: ILogger,
		private $lockfile: ILockFile,
		private $errors: IErrors,
		private $options: IOptions,
		private $fs: IFileSystem,
		private $staticConfig: IStaticConfig) {
		this.versionsCache = {};
		this.$npm.load().wait();
	}

	public getCacheRootPath(): string {
		return this.$npm.getCache();
	}

	public getCachedPackagePath(packageName: string, version: string): string {
		return path.join(this.getCacheRootPath(), packageName, version, "package");
	}

	public addToCache(packageName: string, version: string): IFuture<any> {
		return (() => {
			let cachedPackagePath = this.getCachedPackagePath(packageName, version);
			let cachedPackageData: any;
			if(!this.$fs.exists(cachedPackagePath).wait() || !this.$fs.exists(path.join(cachedPackagePath, "framework")).wait()) {
				cachedPackageData = this.addToCacheCore(packageName, version).wait();
			}

			// In case the version is tag (for example `next`), we need the real version number from the cache.
			// In these cases the cachePackageData is populated when data is added to the cache.
			// Also whenever the version is tag, we always get inside the above `if` and the cachedPackageData is populated.
			let realVersion = (cachedPackageData && cachedPackageData.version) || version;
			if(!this.isShasumOfPackageCorrect(packageName, realVersion).wait()) {
				// In some cases the package is not fully downloaded and there are missing directories
				// Try removing the old package and add the real one to cache again
				cachedPackageData = this.addCleanCopyToCache(packageName, version).wait();
			}

			return cachedPackageData;
		}).future<any>()();
	}

	public cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void> {
		unpackTarget = unpackTarget || path.join(npm.cache, packageName, version, "package");
		return this.$npm.cacheUnpack(packageName, version, unpackTarget);
	}

	public getLatestVersion(packageName: string): IFuture<string> {
		return (() => {
			let data = this.$npm.view(packageName, "dist-tags").wait();
			// data is something like :
			// { '1.0.1': { 'dist-tags': { latest: '1.0.1', next: '1.0.2-2016-02-25-181', next1: '1.0.2' } }
			// There's only one key and it's always the @latest tag.
			let latestVersion = _.first(_.keys(data));
			this.$logger.trace("Using version %s. ", latestVersion);

			return latestVersion;
		}).future<string>()();
	}

	public getLatestCompatibleVersion(packageName: string): IFuture<string> {
		return (() => {
			let cliVersionRange = `~${this.$staticConfig.version}`;
			let latestVersion = this.getLatestVersion(packageName).wait();
			if(semver.satisfies(latestVersion, cliVersionRange)) {
				return latestVersion;
			}

			let data: any = this.$npm.view(packageName, "versions").wait();
			/* data is something like:
				{
					"1.1.0":{
						"versions":[
							"1.0.0",
							"1.0.1-2016-02-25-181",
							"1.0.1",
							"1.0.2-2016-02-25-182",
							"1.0.2",
							"1.1.0-2016-02-25-183",
							"1.1.0",
							"1.2.0-2016-02-25-184"
						]
					}
				}
			*/
			let versions: string[] = data && data[latestVersion] && data[latestVersion].versions;
			return semver.maxSatisfying(versions, cliVersionRange) || latestVersion;
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

	private addCleanCopyToCache(packageName: string, version: string): IFuture<any> {
		return (() => {
			let packagePath = path.join(this.getCacheRootPath(), packageName, version);
			this.$logger.trace(`Deleting: ${packagePath}.`);
			this.$fs.deleteDirectory(packagePath).wait();
			let cachedPackageData = this.addToCacheCore(packageName, version).wait();
			if(!this.isShasumOfPackageCorrect(packageName, cachedPackageData.version).wait()) {
				this.$errors.failWithoutHelp(`Unable to add package ${packageName} with version ${cachedPackageData.version} to npm cache. Try cleaning your cache and execute the command again.`);
			}

			return cachedPackageData;
		}).future<any>()();
	}

	private addToCacheCore(packageName: string, version: string): IFuture<any> {
		return (() => {
			let cachedPackageData = this.$npm.cache(packageName, version).wait();
			let packagePath = path.join(this.getCacheRootPath(), packageName, cachedPackageData.version, "package");
			if(!this.isPackageUnpacked(packagePath, packageName).wait()) {
				this.cacheUnpack(packageName, cachedPackageData.version).wait();
			}
			return cachedPackageData;
		}).future<any>()();
	}

	private isShasumOfPackageCorrect(packageName: string, version: string): IFuture<boolean> {
		return ((): boolean => {
			let shasumProperty = "dist.shasum";
			let cachedPackagePath = this.getCachedPackagePath(packageName, version);
			let packageInfo = this.$npm.view(`${packageName}@${version}`, shasumProperty).wait();

			if (_.isEmpty(packageInfo)) {
				// this package has not been published to npmjs.org yet - perhaps manually added via --framework-path
				this.$logger.trace(`Checking shasum of package ${packageName}@${version}: skipped because the package was not found in npmjs.org`);
				return true;
			}

			let realShasum = packageInfo[version][shasumProperty];
			let packageTgz = cachedPackagePath + ".tgz";
			let currentShasum = "";
			if(this.$fs.exists(packageTgz).wait()) {
				currentShasum = this.$fs.getFileShasum(packageTgz).wait();
			}
			this.$logger.trace(`Checking shasum of package ${packageName}@${version}: expected ${realShasum}, actual ${currentShasum}.`);
			return realShasum === currentShasum;
		}).future<boolean>()();
	}

	private installCore(packageName: string, pathToSave: string, version: string): IFuture<string> {
		return (() => {
			if (this.$options.frameworkPath) {
				this.npmInstall(packageName, pathToSave, version).wait();
				let pathToNodeModules = path.join(pathToSave, "node_modules");
				let folders = this.$fs.readDirectory(pathToNodeModules).wait();

				let data = this.$fs.readJson(path.join(pathToNodeModules, folders[0], "package.json")).wait();
				if(!this.isPackageUnpacked(this.getCachedPackagePath(data.name, data.version), data.name).wait()) {
					this.cacheUnpack(data.name, data.version).wait();
				}

				return path.join(pathToNodeModules, folders[0]);
			} else {
				version = version || this.getLatestCompatibleVersion(packageName).wait();
				let cachedData = this.addToCache(packageName, version).wait();
				let packageVersion = (cachedData && cachedData.version) || version;
				return this.getCachedPackagePath(packageName, packageVersion);
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

	private isPackageUnpacked(packagePath: string, packageName: string): IFuture<boolean> {
		return (() => {
			let additionalDirectoryToCheck = this.packageSpecificDirectories[packageName];
			return this.$fs.getFsStats(packagePath).wait().isDirectory() &&
					(!additionalDirectoryToCheck || this.hasFilesInDirectory(path.join(packagePath, additionalDirectoryToCheck)).wait());
		}).future<boolean>()();
	}

	private hasFilesInDirectory(directory: string): IFuture<boolean> {
		return ((): boolean => {
			return this.$fs.exists(directory).wait() &&	this.$fs.enumerateFilesInDirectorySync(directory).length > 0;
		}).future<boolean>()();
	}
}
$injector.register("npmInstallationManager", NpmInstallationManager);
