import * as path from "path";
import * as semver from "semver";
import * as constants from "./constants";

export class PackageInstallationManager implements IPackageInstallationManager {
	constructor(
		private $packageManager: IPackageManager,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $settingsService: ISettingsService,
		private $fs: IFileSystem,
    private $staticConfig: IStaticConfig,
		private $projectDataService: IProjectDataService) {
	}

	public async getLatestVersion(packageName: string): Promise<string> {
		return await this.getVersion(packageName, constants.PackageVersion.LATEST);
	}

	public async getNextVersion(packageName: string): Promise<string> {
		return await this.getVersion(packageName, constants.PackageVersion.NEXT);
	}

	public async getLatestCompatibleVersion(packageName: string, referenceVersion?: string): Promise<string> {
		referenceVersion = referenceVersion || this.$staticConfig.version;
		const isPreReleaseVersion = semver.prerelease(referenceVersion) !== null;
		// if the user has some v.v.v-prerelease-xx.xx pre-release version, include pre-release versions in the search query.
		const compatibleVersionRange = isPreReleaseVersion
			? `~${referenceVersion}`
			: `~${semver.major(referenceVersion)}.${semver.minor(referenceVersion)}.0`;
		const latestVersion = await this.getLatestVersion(packageName);
		if (semver.satisfies(latestVersion, compatibleVersionRange)) {
			return latestVersion;
		}

		return await this.getMaxSatisfyingVersion(packageName, compatibleVersionRange) || latestVersion;
	}

	public async getMaxSatisfyingVersion(packageName: string, versionRange: string): Promise<string> {
		const data = await this.$packageManager.view(packageName, { "versions": true });

		return semver.maxSatisfying(data, versionRange);
	}

	public async getMaxSatisfyingVersionSafe(packageName: string, versionIdentifier: string): Promise<string> {
		let maxDependencyVersion;
		if (semver.valid(versionIdentifier)) {
			maxDependencyVersion = versionIdentifier;
		} else if (semver.validRange(versionIdentifier)) {
			maxDependencyVersion = await this.getMaxSatisfyingVersion(packageName, versionIdentifier);
		} else {
			maxDependencyVersion = await this.$packageManager.getTagVersion(packageName, versionIdentifier);
		}

		return maxDependencyVersion;
	}

	public async getInstalledDependencyVersion(packageName: string, projectDir?: string): Promise<string> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const devDependencies = projectData.devDependencies || {};
		const dependencies = projectData.dependencies || {};
		const referencedVersion = dependencies[packageName] || devDependencies[packageName];
		const installedVersion = await this.getMaxSatisfyingVersionSafe(packageName, referencedVersion);

		return installedVersion;
	}

	public async getLatestCompatibleVersionSafe(packageName: string, referenceVersion?: string): Promise<string> {
		let version = "";
		const canGetVersionFromNpm = await this.$packageManager.isRegistered(packageName);
		if (canGetVersionFromNpm) {
			version = await this.getLatestCompatibleVersion(packageName, referenceVersion);
		}

		return version;
	}

	public async install(packageToInstall: string, projectDir: string, opts?: INpmInstallOptions): Promise<any> {
		try {
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
		if (this.inspectorAlreadyInstalled(inspectorPath)) {
			return inspectorPath;
		}

		const cachePath = this.getInspectorCachePath();
		this.prepareCacheDir(cachePath);
		const pathToPackageInCache = path.join(cachePath, constants.NODE_MODULES_FOLDER_NAME, inspectorNpmPackageName);
    const iOSFrameworkNSValue = this.$projectDataService.getRuntimePackage(projectDir, Platforms.ios);
		const version = await this.getLatestCompatibleVersion(inspectorNpmPackageName, iOSFrameworkNSValue.version);
		let shouldInstall = !this.$fs.exists(pathToPackageInCache);

		if (!shouldInstall) {
			try {
				const installedVersion = this.$fs.readJson(path.join(pathToPackageInCache, constants.PACKAGE_JSON_FILE_NAME)).version;
				shouldInstall = version !== installedVersion;
			} catch (err) {
				shouldInstall = true;
			}
		}

		if (shouldInstall) {
			await this.$childProcess.exec(`npm install ${inspectorNpmPackageName}@${version} --prefix ${cachePath}`, { maxBuffer: 250 * 1024 });
		}

		this.$logger.info("Using inspector from cache.");
		return pathToPackageInCache;
	}

	public clearInspectorCache(): void {
		this.$fs.deleteDirectorySafe(this.getInspectorCachePath());
	}

	private getInspectorCachePath(): string {
		return path.join(this.$settingsService.getProfileDir(), constants.INSPECTOR_CACHE_DIRNAME);
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

		version = version || await this.getLatestCompatibleVersionSafe(packageName);
		const installResultInfo = await this.npmInstall(packageName, pathToSave, version, dependencyType);
		const installedPackageName = installResultInfo.name;

		const pathToInstalledPackage = path.join(pathToSave, "node_modules", installedPackageName);

		return pathToInstalledPackage;
	}

	private async npmInstall(packageName: string, pathToSave: string, version: string, dependencyType: string): Promise<INpmInstallResultInfo> {
		this.$logger.info(`Installing ${packageName}`);

		packageName = packageName + (version ? `@${version}` : "");

		const npmOptions: any = { silent: true, "save-exact": true };

		if (dependencyType) {
			npmOptions[dependencyType] = true;
		}

		return await this.$packageManager.install(packageName, pathToSave, npmOptions);
	}

	/**
	 * This function must not be used with packageName being a URL or local file,
	 * because npm view doens't work with those
	 */
	private async getVersion(packageName: string, version: string): Promise<string> {
		const data: any = await this.$packageManager.view(packageName, { "dist-tags": true });
		this.$logger.trace("Using version %s. ", data[version]);

		return data[version];
	}
}
$injector.register("packageInstallationManager", PackageInstallationManager);
