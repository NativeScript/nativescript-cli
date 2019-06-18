import * as path from "path";
import * as semver from "semver";

export class BaseUpdateController {
	constructor(protected $fs: IFileSystem,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $platformsDataService: IPlatformsDataService,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager) {
	}

	protected restoreBackup(folders: string[], tmpDir: string, projectData: IProjectData): void {
		for (const folder of folders) {
			this.$fs.deleteDirectory(path.join(projectData.projectDir, folder));

			const folderToCopy = path.join(tmpDir, folder);

			if (this.$fs.exists(folderToCopy)) {
				this.$fs.copyFile(folderToCopy, projectData.projectDir);
			}
		}
	}

	protected backup(folders: string[], tmpDir: string, projectData: IProjectData): void {
		this.$fs.deleteDirectory(tmpDir);
		this.$fs.createDirectory(tmpDir);
		for (const folder of folders) {
			const folderToCopy = path.join(projectData.projectDir, folder);
			if (this.$fs.exists(folderToCopy)) {
				this.$fs.copyFile(folderToCopy, tmpDir);
			}
		}
	}

	protected shouldSkipDependency(dependency: IDependency, projectData: IProjectData): boolean {
		const collection = dependency.isDev ? projectData.devDependencies : projectData.dependencies;
		if (!collection[dependency.packageName]) {
			return true;
		}
	}

	protected async shouldUpdateRuntimeVersion({targetVersion, platform, projectData, shouldAdd}: {targetVersion: string, platform: string, projectData: IProjectData, shouldAdd: boolean}) {
		const lowercasePlatform = platform.toLowerCase();
		const currentPlatformVersion = this.$platformCommandHelper.getCurrentPlatformVersion(lowercasePlatform, projectData);
		const platformData = this.$platformsDataService.getPlatformData(lowercasePlatform, projectData);
		if (currentPlatformVersion) {
			const maxPlatformSatisfyingVersion = await this.getMaxDependencyVersion(platformData.frameworkPackageName, currentPlatformVersion) || currentPlatformVersion;
			if (semver.gte(maxPlatformSatisfyingVersion, targetVersion)) {
				return false;
			}
		} else if (!shouldAdd) {
			return false;
		}

		return true;
	}

	protected async getMaxDependencyVersion(dependency: string, version: string) {
		let maxDependencyVersion;
		if (semver.valid(version)) {
			maxDependencyVersion = version;
		} else if (semver.validRange(version)) {
			maxDependencyVersion = await this.$packageInstallationManager.maxSatisfyingVersion(dependency, version);
		} else {
			maxDependencyVersion = await this.$packageManager.getTagVersion(dependency, version);
		}

		return maxDependencyVersion;
	}
}
