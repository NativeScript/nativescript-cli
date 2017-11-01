import * as path from "path";
import * as semver from "semver";
import * as constants from "./constants";
import * as helpers from "./common/helpers";

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
			const packageToInstall = this.$options.frameworkPath || packageName;
			const pathToSave = projectDir;
			const version = (opts && opts.version) || null;
			const dependencyType = (opts && opts.dependencyType) || null;

			return await this.installCore(packageToInstall, pathToSave, version, dependencyType);
		} catch (error) {
			this.$logger.debug(error);

			throw error;
		}
	}

	public async getInspectorFromCache(inspectorNpmPackageName: string, projectDir: string): Promise<string> {
		const inspectorPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, inspectorNpmPackageName);

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
		if (helpers.isURL(packageName) || this.$fs.exists(packageName) || helpers.isTgz(packageName)) {
			version = null;
		} else {
			version = version || await this.getLatestCompatibleVersion(packageName);
		}

		const installResultInfo = await this.npmInstall(packageName, pathToSave, version, dependencyType);
		const installedPackageName = installResultInfo.name;

		const pathToInstalledPackage = path.join(pathToSave, "node_modules", installedPackageName);
		return pathToInstalledPackage;
	}

	private async npmInstall(packageName: string, pathToSave: string, version: string, dependencyType: string): Promise<INpmInstallResultInfo> {
		this.$logger.out("Installing ", packageName);

		packageName = packageName + (version ? `@${version}` : "");

		const npmOptions: any = { silent: true, "save-exact": true };

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
		const data: any = await this.$npm.view(packageName, { "dist-tags": true });
		this.$logger.trace("Using version %s. ", data[version]);

		return data[version];
	}
}
$injector.register("npmInstallationManager", NpmInstallationManager);
