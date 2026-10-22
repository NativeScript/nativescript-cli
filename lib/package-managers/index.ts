import { exported } from "../common/decorators";
import { performanceLog } from "../common/decorators";
import { PackageManagers } from "../constants";
import {
	IPackageManager,
	INodePackageManager,
	IOptions,
	IPackageInstallOptions,
	IPackageUninstallOptions,
	INpmInstallResultInfo,
	INpmsResult,
	INpmPackageNameParts,
} from "../declarations";
import { IErrors, IUserSettingsService } from "../common/declarations";
import { injector } from "../common/yok";
import { IProjectConfigService } from "../definitions/project";

export class PackageManager implements IPackageManager {
	private selected: INodePackageManager;
	private selectedName: string;

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
		private $projectConfigService: IProjectConfigService,
	) {}

	public async getPackageManagerName(): Promise<string> {
		this.packageManager;
		return this.selectedName;
	}

	@exported("packageManager")
	@performanceLog()
	public install(
		packageName: string,
		pathToSave: string,
		options: IPackageInstallOptions,
	): Promise<INpmInstallResultInfo> {
		return this.packageManager.install(packageName, pathToSave, options);
	}

	@exported("packageManager")
	public uninstall(
		packageName: string,
		options?: IPackageUninstallOptions,
		path?: string,
	): Promise<string> {
		return this.packageManager.uninstall(packageName, options, path);
	}

	@exported("packageManager")
	public view(packageName: string, field?: string): Promise<any> {
		return this.packageManager.view(packageName, field);
	}

	@exported("packageManager")
	public search(filter: string[]): Promise<string> {
		return this.packageManager.search(filter);
	}

	public searchNpms(keyword: string): Promise<INpmsResult> {
		return this.packageManager.searchNpms(keyword);
	}

	public isRegistered(packageName: string): Promise<boolean> {
		return this.packageManager.isRegistered(packageName);
	}

	public getPackageFullName(
		packageNameParts: INpmPackageNameParts,
	): Promise<string> {
		return this.packageManager.getPackageFullName(packageNameParts);
	}

	public getPackageNameParts(
		fullPackageName: string,
	): Promise<INpmPackageNameParts> {
		return this.packageManager.getPackageNameParts(fullPackageName);
	}

	public getRegistryPackageData(packageName: string): Promise<any> {
		return this.packageManager.getRegistryPackageData(packageName);
	}

	public getCachePath(): Promise<string> {
		return this.packageManager.getCachePath();
	}

	@exported("packageManager")
	public getInstalledPackagePath(packageName: string, fromDir: string): string {
		return this.packageManager.getInstalledPackagePath(packageName, fromDir);
	}

	public async getTagVersion(
		packageName: string,
		tag: string,
	): Promise<string> {
		let version: string = null;
		if (!tag) {
			return null;
		}

		try {
			const result = await this.view(packageName, "dist-tags");
			version = result[tag];
		} catch (err) {
			this.$logger.trace(
				`Error while getting tag version from view command: ${err}`,
			);
			const registryData = await this.getRegistryPackageData(packageName);
			version = registryData["dist-tags"][tag];
		}

		return version;
	}

	private get packageManager(): INodePackageManager {
		if (!this.selected) {
			this.selected = this.determinePackageManager();
		}

		return this.selected;
	}

	private determinePackageManager(): INodePackageManager {
		let pm: string = null;
		try {
			pm = this.$userSettingsService.getSettingValueSync("packageManager");
		} catch (err) {
			this.$errors.fail(
				`Unable to read package manager config from user settings ${err}`,
			);
		}

		try {
			const configPm =
				this.$projectConfigService.getValue("cli.packageManager");

			if (configPm) {
				this.$logger.trace(
					`Determined packageManager to use from user config is: ${configPm}`,
				);
				pm = configPm;
			}
		} catch (err) {
			// ignore error, but log info
			this.$logger.trace(
				"Tried to read cli.packageManager from project config and failed. Error is: ",
				err,
			);
		}

		if (pm === PackageManagers.yarn || this.$options.yarn) {
			this.selectedName = PackageManagers.yarn;
			return this.$yarn;
		}
		if (pm === PackageManagers.yarn2 || this.$options.yarn2) {
			this.selectedName = PackageManagers.yarn2;
			return this.$yarn2;
		} else if (pm === PackageManagers.pnpm || this.$options.pnpm) {
			this.selectedName = PackageManagers.pnpm;
			return this.$pnpm;
		} else if (pm === PackageManagers.bun) {
			this.selectedName = PackageManagers.bun;
			return this.$bun;
		} else {
			this.selectedName = PackageManagers.npm;
			return this.$npm;
		}
	}
}

injector.register("packageManager", PackageManager);
