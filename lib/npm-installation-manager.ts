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

		let cliVersionRange = `~${this.$staticConfig.version}`;
		let latestVersion = await this.getLatestVersion(packageName);
		if (semver.satisfies(latestVersion, cliVersionRange)) {
			return latestVersion;
		}
		let data = await this.$npm.view(packageName, { "versions": true });

		return semver.maxSatisfying(data, cliVersionRange) || latestVersion;
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

			throw new Error(error);
		}
	}

	public async getInspectorFromCache(inspectorNpmPackageName: string, projectDir: string): Promise<string> {
		let inspectorPath = path.join(projectDir, "node_modules", inspectorNpmPackageName);

		// local installation takes precedence over cache
		if (!this.inspectorAlreadyInstalled(inspectorPath)) {
			let cachepath = (await this.$childProcess.exec("npm get cache")).trim();
			let version = await this.getLatestCompatibleVersion(inspectorNpmPackageName);
			let pathToPackageInCache = path.join(cachepath, inspectorNpmPackageName, version);
			let pathToUnzippedInspector = path.join(pathToPackageInCache, "package");

			if (!this.$fs.exists(pathToPackageInCache)) {
				await this.$childProcess.exec(`npm cache add ${inspectorNpmPackageName}@${version}`);
				let inspectorTgzPathInCache = path.join(pathToPackageInCache, "package.tgz");
				await this.$childProcess.exec(`tar -xf ${inspectorTgzPathInCache} -C ${pathToPackageInCache}`);
				await this.$childProcess.exec(`npm install --prefix ${pathToUnzippedInspector}`);
			}
			this.$logger.out("Using inspector from cache.");
			return pathToUnzippedInspector;
		}
		return inspectorPath;
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
		if (packageName.indexOf(".tgz") >= 0) {
			version = null;
		}
		// check if the packageName is url or local file and if it is, let npm install deal with the version
		if (this.isURL(packageName) || this.$fs.exists(packageName)) {
			version = null;
		} else {
			version = version || await this.getLatestCompatibleVersion(packageName);
		}

		let installedModuleNames = await this.npmInstall(packageName, pathToSave, version, dependencyType);
		let installedPackageName = installedModuleNames.name;

		let pathToInstalledPackage = path.join(pathToSave, "node_modules", installedPackageName);
		return pathToInstalledPackage;
	}

	private isURL(str: string) {
		let urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
		let url = new RegExp(urlRegex, 'i');
		return str.length < 2083 && url.test(str);
	}

	private async npmInstall(packageName: string, pathToSave: string, version: string, dependencyType: string): Promise<INpmInstallResultInfo> {
		this.$logger.out("Installing ", packageName);

		packageName = packageName + (version ? `@${version}` : "");

		let npmOptions: any = { silent: true };

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
