import * as semver from "semver";
import * as constants from "../constants";
import { UpdateControllerBase } from "./update-controller-base";
import {
	IProjectDataService,
	IProjectData,
	IProjectCleanupService,
	IProjectBackupService,
	IBackup,
} from "../definitions/project";
import { IPlatformsDataService } from "../definitions/platform";
import {
	IPlatformCommandHelper,
	IPackageInstallationManager,
	IPackageManager,
} from "../declarations";
import { IFileSystem, IErrors } from "../common/declarations";
import { injector } from "../common/yok";
import { PackageVersion } from "../constants";
import { IDependency } from "../definitions/migrate";
import { IPluginsService } from "../definitions/plugins";
import { color } from "../color";
import {
	ITerminalSpinner,
	ITerminalSpinnerService,
} from "../definitions/terminal-spinner-service";

export class UpdateController
	extends UpdateControllerBase
	implements IUpdateController {
	static readonly updatableDependencies: IDependency[] = [
		// dependencies
		{
			packageName: "@nativescript/core",
		},

		// devDependencies
		{
			packageName: "@nativescript/webpack",
			isDev: true,
		},
		{
			packageName: "@nativescript/types",
			isDev: true,
		},

		// runtimes
		{
			packageName: "@nativescript/ios",
			isDev: true,
		},
		{
			packageName: "@nativescript/android",
			isDev: true,
		},
	];

	static readonly backupFolderName: string = ".migration_backup";
	static readonly pathsToBackup: string[] = [
		constants.LIB_DIR_NAME,
		constants.HOOKS_DIR_NAME,
		constants.WEBPACK_CONFIG_NAME,
		constants.PACKAGE_JSON_FILE_NAME,
		constants.PACKAGE_LOCK_JSON_FILE_NAME,
		constants.CONFIG_NS_FILE_NAME,
	];

	private spinner: ITerminalSpinner;

	constructor(
		protected $fs: IFileSystem,
		protected $platformsDataService: IPlatformsDataService,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		protected $pluginsService: IPluginsService,
		protected $pacoteService: IPacoteService,
		private $logger: ILogger,
		private $errors: IErrors,
		private $projectDataService: IProjectDataService,
		private $projectBackupService: IProjectBackupService,
		private $projectCleanupService: IProjectCleanupService,
		private $terminalSpinnerService: ITerminalSpinnerService
	) {
		super(
			$fs,
			$platformCommandHelper,
			$platformsDataService,
			$packageInstallationManager,
			$packageManager,
			$pacoteService
		);
	}

	public async update(updateOptions: IUpdateOptions): Promise<void> {
		this.spinner = this.$terminalSpinnerService.createSpinner();
		const projectData = this.$projectDataService.getProjectData(
			updateOptions.projectDir
		);
		updateOptions.version = updateOptions.version || PackageVersion.LATEST;

		// back up project files and folders
		this.spinner.info("Backing up project files before update");

		await this.backupProject();

		this.spinner.succeed("Project files have been backed up");

		// clean up project files
		this.spinner.info("Cleaning up project files before update");

		await this.cleanUpProject();

		this.spinner.succeed("Project files have been cleaned up");

		// update dependencies
		this.spinner.info("Updating project dependencies");

		await this.updateDependencies(projectData, updateOptions.version);

		this.spinner.succeed("Project dependencies have been updated");

		this.spinner.succeed("Update complete.");

		this.$logger.info("");
		this.$logger.printMarkdown(
			"Project has been successfully updated. The next step is to run `ns run <platform>` to ensure everything is working properly." +
				"\n\nPlease note that you may need additional changes to complete the update."
		);
	}

	public async shouldUpdate(updateOptions: IUpdateOptions): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(
			updateOptions.projectDir
		);
		updateOptions.version = updateOptions.version || PackageVersion.LATEST;

		for (const dependency of UpdateController.updatableDependencies) {
			this.$logger.trace(
				`Checking if ${dependency.packageName} needs to be updated...`
			);
			const desiredVersion = await this.getVersionFromTagOrVersion(
				dependency.packageName,
				updateOptions.version
			);

			if (typeof desiredVersion === "boolean") {
				this.$logger.trace(
					`Package ${dependency.packageName} does not have version/tag ${updateOptions.version}. Skipping.`
				);

				continue;
			}

			const shouldUpdate = await this.shouldUpdateDependency(
				projectData,
				dependency,
				desiredVersion
			);

			if (shouldUpdate) {
				this.$logger.trace(
					`shouldUpdate is true because '${dependency.packageName} needs to be updated.'`
				);
				return true;
			}
		}

		return false;
	}

	private async updateDependencies(
		projectData: IProjectData,
		version: string
	): Promise<void> {
		for (const dependency of UpdateController.updatableDependencies) {
			await this.updateDependency(projectData, dependency, version);
		}
	}

	private async updateDependency(
		projectData: IProjectData,
		dependency: IDependency,
		version: string
	): Promise<void> {
		if (!this.hasDependency(dependency, projectData)) {
			return;
		}

		const desiredVersion = await this.getVersionFromTagOrVersion(
			dependency.packageName,
			version
		);

		if (typeof desiredVersion === "boolean") {
			this.$logger.info(
				`  - ${color.yellow(
					dependency.packageName
				)} does not have version/tag ${color.green(version)}. ` +
					color.yellow("Skipping.")
			);

			return;
		}

		const shouldUpdate = await this.shouldUpdateDependency(
			projectData,
			dependency,
			desiredVersion
		);

		if (!shouldUpdate) {
			return;
		}

		// check if the coerced version is the same as desired and prefix it with a ~
		// for example:
		// 8.0.0 -> ~8.0.0
		// 8.0.8-next-XXX -> 8.0.8-next-XXX
		const updatedVersion = (() => {
			if (desiredVersion === version) {
				return desiredVersion;
			}

			if (semver.coerce(desiredVersion).version === desiredVersion) {
				return `~${desiredVersion}`;
			}

			return desiredVersion;
		})();

		this.$pluginsService.addToPackageJson(
			dependency.packageName,
			updatedVersion,
			dependency.isDev,
			projectData.projectDir
		);

		this.$logger.info(
			`  - ${color.yellow(
				dependency.packageName
			)} has been updated to ${color.green(updatedVersion)}`
		);
	}

	private async shouldUpdateDependency(
		projectData: IProjectData,
		dependency: IDependency,
		desiredVersion: string
	): Promise<boolean> {
		const installedVersion = await this.$packageInstallationManager.getInstalledDependencyVersion(
			dependency.packageName,
			projectData.projectDir
		);

		if (!installedVersion) {
			return false;
		}

		return installedVersion != desiredVersion;
	}

	private async getVersionFromTagOrVersion(
		packageName: string,
		versionOrTag: string
	): Promise<string | boolean> {
		if (semver.valid(versionOrTag) || semver.validRange(versionOrTag)) {
			return versionOrTag;
		}

		const version = await this.$packageManager.getTagVersion(
			packageName,
			versionOrTag
		);

		if (!version) {
			return false;
		}

		return version;
	}

	private async backupProject(): Promise<IBackup> {
		const backup = this.$projectBackupService.getBackup("migration");
		backup.addPaths([...UpdateController.pathsToBackup]);

		try {
			return backup.create();
		} catch (error) {
			this.spinner.fail(`Project backup failed.`);
			backup.remove();
			this.$errors.fail(`Project backup failed. Error is: ${error.message}`);
		}
	}

	private async cleanUpProject(): Promise<void> {
		await this.$projectCleanupService.clean([
			constants.HOOKS_DIR_NAME,
			constants.PLATFORMS_DIR_NAME,
			constants.NODE_MODULES_FOLDER_NAME,
			constants.PACKAGE_LOCK_JSON_FILE_NAME,
		]);
	}
}

injector.register("updateController", UpdateController);
