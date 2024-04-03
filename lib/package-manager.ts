import { cache, exported, invokeInit } from "./common/decorators";
import { performanceLog } from "./common/decorators";
import { PackageManagers } from "./constants";
import {
	IPackageManager,
	INodePackageManager,
	IOptions,
	INodePackageManagerInstallOptions,
	INpmInstallResultInfo,
	INpmsResult,
	INpmPackageNameParts,
} from "./declarations";
import {
	IErrors,
	IUserSettingsService,
	IDictionary,
} from "./common/declarations";
import { injector } from "./common/yok";
import { IProjectConfigService } from "./definitions/project";
export class PackageManager implements IPackageManager {
	private packageManager: INodePackageManager;
	private _packageManagerName: string;

	constructor(
		private $errors: IErrors,
		private $npm: INodePackageManager,
		private $options: IOptions,
		private $yarn: INodePackageManager,
		private $yarn2: INodePackageManager,
		private $pnpm: INodePackageManager,
		private $bun: INodePackageManager,
		private $logger: ILogger,
		private $userSettingsService: IUserSettingsService,
		private $projectConfigService: IProjectConfigService
	) {}

	@cache()
	protected async init(): Promise<void> {
		this.packageManager = await this._determinePackageManager();
	}

	@invokeInit()
	public async getPackageManagerName(): Promise<string> {
		return this._packageManagerName;
	}

	@exported("packageManager")
	@performanceLog()
	@invokeInit()
	public install(
		packageName: string,
		pathToSave: string,
		config: INodePackageManagerInstallOptions
	): Promise<INpmInstallResultInfo> {
		return this.packageManager.install(packageName, pathToSave, config);
	}
	@exported("packageManager")
	@invokeInit()
	public uninstall(
		packageName: string,
		config?: IDictionary<string | boolean>,
		path?: string
	): Promise<string> {
		return this.packageManager.uninstall(packageName, config, path);
	}
	@exported("packageManager")
	@invokeInit()
	public view(packageName: string, config: Object): Promise<any> {
		return this.packageManager.view(packageName, config);
	}
	@exported("packageManager")
	@invokeInit()
	public search(
		filter: string[],
		config: IDictionary<string | boolean>
	): Promise<string> {
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
	public async getPackageFullName(
		packageNameParts: INpmPackageNameParts
	): Promise<string> {
		return this.packageManager.getPackageFullName(packageNameParts);
	}

	@invokeInit()
	public async getPackageNameParts(
		fullPackageName: string
	): Promise<INpmPackageNameParts> {
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

	public async getTagVersion(
		packageName: string,
		tag: string
	): Promise<string> {
		let version: string = null;
		if (!tag) {
			return null;
		}

		try {
			const result = await this.view(packageName, { "dist-tags": true });
			version = result[tag];
		} catch (err) {
			this.$logger.trace(
				`Error while getting tag version from view command: ${err}`
			);
			const registryData = await this.getRegistryPackageData(packageName);
			version = registryData["dist-tags"][tag];
		}

		return version;
	}

	private async _determinePackageManager(): Promise<INodePackageManager> {
		let pm = null;
		try {
			pm = await this.$userSettingsService.getSettingValue("packageManager");
		} catch (err) {
			this.$errors.fail(
				`Unable to read package manager config from user settings ${err}`
			);
		}

		try {
			const configPm =
				this.$projectConfigService.getValue("cli.packageManager");

			if (configPm) {
				this.$logger.trace(
					`Determined packageManager to use from user config is: ${configPm}`
				);
				pm = configPm;
			}
		} catch (err) {
			// ignore error, but log info
			this.$logger.trace(
				"Tried to read cli.packageManager from project config and failed. Error is: ",
				err
			);
		}

		if (pm === PackageManagers.yarn || this.$options.yarn) {
			this._packageManagerName = PackageManagers.yarn;
			return this.$yarn;
		}
		if (pm === PackageManagers.yarn2 || this.$options.yarn2) {
			this._packageManagerName = PackageManagers.yarn2;
			return this.$yarn2;
		} else if (pm === PackageManagers.pnpm || this.$options.pnpm) {
			this._packageManagerName = PackageManagers.pnpm;
			return this.$pnpm;
		} else if (pm === PackageManagers.bun) {
			this._packageManagerName = PackageManagers.bun;
			return this.$bun;
		} else {
			this._packageManagerName = PackageManagers.npm;
			return this.$npm;
		}
	}
}

injector.register("packageManager", PackageManager);
