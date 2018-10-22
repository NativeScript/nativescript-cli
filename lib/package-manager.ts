
import { exported } from './common/decorators';
export class PackageManager implements INodePackageManager {
	private packageManager: INodePackageManager;

	constructor(
		private $errors: IErrors,
		private $npm: INodePackageManager,
		private $options: IOptions,
		private $yarn: INodePackageManager,
		private $userSettingsService: IUserSettingsService
	) {
		this._determinePackageManager();
	}
	@exported("packageManager")
	public install(packageName: string, pathToSave: string, config: INodePackageManagerInstallOptions): Promise<INpmInstallResultInfo> {
		return this.packageManager.install(packageName, pathToSave, config);
	}
	@exported("packageManager")
	public uninstall(packageName: string, config?: IDictionary<string | boolean>, path?: string): Promise<string> {
		return this.packageManager.uninstall(packageName, config, path);
	}
	@exported("packageManager")
	public view(packageName: string, config: Object): Promise<any> {
		return this.packageManager.view(packageName, config);
	}
	@exported("packageManager")
	public search(filter: string[], config: IDictionary<string | boolean>): Promise<string> {
		return this.packageManager.search(filter, config);
	}
	public searchNpms(keyword: string): Promise<INpmsResult> {
		return this.packageManager.searchNpms(keyword);
	}
	public getRegistryPackageData(packageName: string): Promise<any> {
		return this.packageManager.getRegistryPackageData(packageName);
	}
	public getCachePath(): Promise<string> {
		return this.packageManager.getCachePath();
	}

	private _determinePackageManager(): void {
		this.$userSettingsService.getSettingValue('packageManager').then ( (pm: string) => {
			if (pm === 'yarn' || this.$options.yarn) {
				this.packageManager = this.$yarn;
			} else {
				this.packageManager = this.$npm;
			}
		}, (err) => {
			this.$errors.fail(`Unable to read package manager config from user settings ${err}`);
		});
	}
}

$injector.register('packageManager', PackageManager);
