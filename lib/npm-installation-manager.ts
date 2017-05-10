import * as path from "path";
import * as semver from "semver";
import * as constants from "./constants";

export class NpmInstallationManager implements INpmInstallationManager {
	constructor(private $npm: INodePackageManager,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $options: IOptions,
		private $fs: IFileSystem,
		private $staticConfig: IStaticConfig) {
	}

	public async getLatestVersion(packageName: string): Promise<string> {
		return await this.getVersion(packageName, constants.PackageVersion.LATEST);
	}

	public async getNextVersion(packageName: string): Promise<string> {
		return await this.getVersion(packageName, constants.PackageVersion.NEXT);
	}

	public async getLatestCompatibleVersion(packageName: string): Promise<string> {
		const configVersion = this.$staticConfig.version;
		const isPreReleaseVersion = semver.prerelease(configVersion) !== null;
		let cliVersionRange = `~${semver.major(configVersion)}.${semver.minor(configVersion)}.0`;
		if (isPreReleaseVersion) {
			// if the user has some 0-19 pre-release version, include pre-release versions in the search query.
			cliVersionRange = `~${configVersion}`;
		}

		const latestVersion = await this.getLatestVersion(packageName);
		if (semver.satisfies(latestVersion, cliVersionRange)) {
			return latestVersion;
		}

		const data = await this.$npm.view(packageName, { "versions": true });

		const maxSatisfying = semver.maxSatisfying(data, cliVersionRange);
		return maxSatisfying || latestVersion;
	}

	public async install(packageName: string, projectDir: string, opts?: INpmInstallOptions): Promise<any> {
		try {
			let packageToInstall = this.$options.frameworkPath || packageName;
			let pathToSave = projectDir;
			let version = (opts && opts.version) || null;
			let dependencyType = (opts && opts.dependencyType) || null;

			return await this.installCore(packageToInstall, pathToSave, version, dependencyType);
		} catch (error) {
			this.$logger.debug(error);

			throw error;
		}
	}

	public async getInspectorFromCache(inspectorNpmPackageName: string, projectDir: string): Promise<string> {
		let inspectorPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, inspectorNpmPackageName);

		// local installation takes precedence over cache
		if (!this.inspectorAlreadyInstalled(inspectorPath)) {
			const cachePath = path.join(this.$options.profileDir, constants.INSPECTOR_CACHE_DIRNAME);
			this.prepareCacheDir(cachePath);
			const pathToPackageInCache = path.join(cachePath, constants.NODE_MODULES_FOLDER_NAME, inspectorNpmPackageName);

			if (!this.$fs.exists(pathToPackageInCache)) {
				const version = await this.getLatestCompatibleVersion(inspectorNpmPackageName);
				await this.$childProcess.exec(`npm install ${inspectorNpmPackageName}@${version} --prefix ${cachePath}`);
			}

			this.$logger.out("Using inspector from cache.");
			return pathToPackageInCache;
		}

		return inspectorPath;
	}

	private prepareCacheDir(cacheDirName: string): void {
		this.$fs.ensureDirectoryExists(cacheDirName);

		const cacheDirPackageJsonLocation = path.join(cacheDirName, constants.PACKAGE_JSON_FILE_NAME);
		if (!this.$fs.exists(cacheDirPackageJsonLocation)) {
			this.$fs.writeJson(cacheDirPackageJsonLocation, {
				name: constants.INSPECTOR_CACHE_DIRNAME,
				version: "0.1.0"
			});
		}
	}

	private inspectorAlreadyInstalled(pathToInspector: string): Boolean {
		if (this.$fs.exists(pathToInspector)) {
			return true;
		}
		return false;
	}

	private async installCore(packageName: string, pathToSave: string, version: string, dependencyType: string): Promise<string> {
		const possiblePackageName = path.resolve(packageName);
		if (this.$fs.exists(possiblePackageName)) {
			packageName = possiblePackageName;
		}

		// check if the packageName is url or local file and if it is, let npm install deal with the version
		if (this.isURL(packageName) || this.$fs.exists(packageName) || this.isTgz(packageName)) {
			version = null;
		} else {
			version = version || await this.getLatestCompatibleVersion(packageName);
		}

		let installResultInfo = await this.npmInstall(packageName, pathToSave, version, dependencyType);
		let installedPackageName = installResultInfo.name;

		let pathToInstalledPackage = path.join(pathToSave, "node_modules", installedPackageName);
		return pathToInstalledPackage;
	}

	private isTgz(packageName: string): boolean {
		return packageName.indexOf(".tgz") >= 0;
	}

	private isURL(str: string): boolean {
		let urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
		let url = new RegExp(urlRegex, 'i');
		return str.length < 2083 && url.test(str);
	}

	private async npmInstall(packageName: string, pathToSave: string, version: string, dependencyType: string): Promise<INpmInstallResultInfo> {
		this.$logger.out("Installing ", packageName);

		packageName = packageName + (version ? `@${version}` : "");

		let npmOptions: any = { silent: true, "save-exact": true };

		if (dependencyType) {
			npmOptions[dependencyType] = true;
		}

		return await this.$npm.install(packageName, pathToSave, npmOptions);
	}

	/**
	 * This function must not be used with packageName being a URL or local file,
	 * because npm view doens't work with those
	 */
	private async getVersion(packageName: string, version: string): Promise<string> {
		let data: any = await this.$npm.view(packageName, { "dist-tags": true });
		this.$logger.trace("Using version %s. ", data[version]);

		return data[version];
	}
}
$injector.register("npmInstallationManager", NpmInstallationManager);
