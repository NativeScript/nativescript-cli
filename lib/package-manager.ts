
import { cache, exported, invokeInit } from './common/decorators';
import { performanceLog } from "./common/decorators";
export class PackageManager implements IPackageManager {
	private packageManager: INodePackageManager;

	constructor(
		private $errors: IErrors,
		private $npm: INodePackageManager,
		private $options: IOptions,
		private $yarn: INodePackageManager,
		private $logger: ILogger,
		private $userSettingsService: IUserSettingsService
	) { }

	@cache()
	protected async init(): Promise<void> {
		this.packageManager = await this._determinePackageManager();
	}

	@exported("packageManager")
	@performanceLog()
	@invokeInit()
	public install(packageName: string, pathToSave: string, config: INodePackageManagerInstallOptions): Promise<INpmInstallResultInfo> {
		return this.packageManager.install(packageName, pathToSave, config);
	}
	@exported("packageManager")
	@invokeInit()
	public uninstall(packageName: string, config?: IDictionary<string | boolean>, path?: string): Promise<string> {
		return this.packageManager.uninstall(packageName, config, path);
	}
	@exported("packageManager")
	@invokeInit()
	public view(packageName: string, config: Object): Promise<any> {
		return this.packageManager.view(packageName, config);
	}
	@exported("packageManager")
	@invokeInit()
	public search(filter: string[], config: IDictionary<string | boolean>): Promise<string> {
		return this.packageManager.search(filter, config);
	}

	@invokeInit()
	public searchNpms(keyword: string): Promise<INpmsResult> {
		return this.packageManager.searchNpms(keyword);
	}

	@invokeInit()
	public async isRegistered(packageName: string): Promise<boolean> {
		return this.packageManager.isRegistered(packageName);
	}

	@invokeInit()
	public async getPackageFullName(packageNameParts: INpmPackageNameParts): Promise<string> {
		return this.packageManager.getPackageFullName(packageNameParts);
	}

	@invokeInit()
	public async getPackageNameParts(fullPackageName: string): Promise<INpmPackageNameParts> {
		return this.packageManager.getPackageNameParts(fullPackageName);
	}

	@invokeInit()
	public getRegistryPackageData(packageName: string): Promise<any> {
		return this.packageManager.getRegistryPackageData(packageName);
	}

	@invokeInit()
	public getCachePath(): Promise<string> {
		return this.packageManager.getCachePath();
	}

	public async getTagVersion(packageName: string, tag: string): Promise<string> {
		let version: string = null;

		try {
			const result = await this.view(packageName, { "dist-tags": true });
			version = result[tag];
		} catch (err) {
			this.$logger.trace(`Error while getting tag version from view command: ${err}`);
			const registryData = await this.getRegistryPackageData(packageName);
			version = registryData["dist-tags"][tag];
		}

		return version;
	}

	private async _determinePackageManager(): Promise<INodePackageManager> {
		let pm = null;
		try {
			pm = await this.$userSettingsService.getSettingValue('packageManager');
		} catch (err) {
			this.$errors.fail(`Unable to read package manager config from user settings ${err}`);
		}

		if (pm === 'yarn' || this.$options.yarn) {
			return this.$yarn;
		} else {
			return this.$npm;
		}
	}
}

$injector.register('packageManager', PackageManager);
