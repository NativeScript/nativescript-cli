import * as path from "path";
import * as semver from "semver";
import * as constants from "./constants";

export class NpmInstallationManager implements INpmInstallationManager {
	constructor(private $npm: INodePackageManager,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $errors: IErrors,
		private $options: IOptions,
		private $fs: IFileSystem,
		private $staticConfig: IStaticConfig) {
	}

	public getLatestVersion(packageName: string): IFuture<string> {
		return (() => {
			return this.getVersion(packageName, constants.PackageVersion.LATEST).wait();
		}).future<string>()();
	}

	public getNextVersion(packageName: string): IFuture<string> {
		return (() => {
			return this.getVersion(packageName, constants.PackageVersion.NEXT).wait();
		}).future<string>()();
	}

	public getLatestCompatibleVersion(packageName: string): IFuture<string> {
		return (() => {

			let cliVersionRange = `~${this.$staticConfig.version}`;
			let latestVersion = this.getLatestVersion(packageName).wait();
			if (semver.satisfies(latestVersion, cliVersionRange)) {
				return latestVersion;
			}
			let data = this.$npm.view(packageName, { json: true, "versions": true }).wait();

			return semver.maxSatisfying(data, cliVersionRange) || latestVersion;
		}).future<string>()();
	}

	public install(packageName: string, projectDir: string, opts?: INpmInstallOptions): IFuture<any> {
		return (() => {

			try {
				let packageToInstall = this.$options.frameworkPath || packageName;
				let pathToSave = projectDir;
				let version = (opts && opts.version) || null;
				let dependencyType = (opts && opts.dependencyType) || null;

				return this.installCore(packageToInstall, pathToSave, version, dependencyType).wait();
			} catch (error) {
				this.$logger.debug(error);

				throw new Error(error);
			}

		}).future<string>()();
	}

	public getInspectorFromCache(inspectorNpmPackageName: string, projectDir: string): IFuture<string> {
		return (() => {
			let inspectorPath = path.join(projectDir, "node_modules", inspectorNpmPackageName);

			// local installation takes precedence over cache
			if (!this.inspectorAlreadyInstalled(inspectorPath)) {
				let cachepath = this.$childProcess.exec("npm get cache").wait().trim();
				let version = this.getLatestCompatibleVersion(inspectorNpmPackageName).wait();
				let pathToPackageInCache = path.join(cachepath, inspectorNpmPackageName, version);
				let pathToUnzippedInspector = path.join(pathToPackageInCache, "package");

				if (!this.$fs.exists(pathToPackageInCache)) {
					this.$childProcess.exec(`npm cache add ${inspectorNpmPackageName}@${version}`).wait();
					let inspectorTgzPathInCache = path.join(pathToPackageInCache, "package.tgz");
					this.$childProcess.exec(`tar -xf ${inspectorTgzPathInCache} -C ${pathToPackageInCache}`).wait();
					this.$childProcess.exec(`npm install --prefix ${pathToUnzippedInspector}`).wait();
				}
				this.$logger.out("Using inspector from cache.");
				return pathToUnzippedInspector;
			}
			return inspectorPath;
		}).future<string>()();
	}

	private inspectorAlreadyInstalled(pathToInspector: string): Boolean {
		if (this.$fs.exists(pathToInspector)) {
			return true;
		}
		return false;
	}

	private installCore(packageName: string, pathToSave: string, version: string, dependencyType: string): IFuture<string> {
		return (() => {
			const possiblePackageName = path.resolve(packageName);
			if (this.$fs.exists(possiblePackageName)) {
				packageName = possiblePackageName;
			}
			if (packageName.indexOf(".tgz") >= 0) {
				version = null;
			}
			// check if the packageName is url or local file and if it is, let npm install deal with the version
			if (this.isURL(packageName) || this.$fs.exists(packageName)) {
				version = null;
			} else {
				version = version || this.getLatestCompatibleVersion(packageName).wait();
			}

			let installedModuleNames = this.npmInstall(packageName, pathToSave, version, dependencyType).wait();
			let installedPackageName = installedModuleNames[0];

			let pathToInstalledPackage = path.join(pathToSave, "node_modules", installedPackageName);
			return pathToInstalledPackage;
		}).future<string>()();
	}

	private isURL(str: string) {
		let urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
		let url = new RegExp(urlRegex, 'i');
		return str.length < 2083 && url.test(str);
	}

	private npmInstall(packageName: string, pathToSave: string, version: string, dependencyType: string): IFuture<any> {
		return (() => {
			this.$logger.out("Installing ", packageName);

			packageName = packageName + (version ? `@${version}` : "");

			let npmOptions: any = { silent: true };

			if (dependencyType) {
				npmOptions[dependencyType] = true;
			}

			return this.$npm.install(packageName, pathToSave, npmOptions).wait();
		}).future<any>()();
	}

	/**
	 * This function must not be used with packageName being a URL or local file,
	 * because npm view doens't work with those
	 */
	private getVersion(packageName: string, version: string): IFuture<string> {
		return (() => {
			let data: any = this.$npm.view(packageName, { json: true, "dist-tags": true }).wait();
			this.$logger.trace("Using version %s. ", data[version]);

			return data[version];
		}).future<string>()();
	}
}
$injector.register("npmInstallationManager", NpmInstallationManager);
