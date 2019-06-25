import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import { UpdateControllerBase } from "./update-controller-base";

export class UpdateController extends UpdateControllerBase implements IUpdateController {
	constructor(
		protected $fs: IFileSystem,
		protected $platformsDataService: IPlatformsDataService,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $addPlatformService: IAddPlatformService,
		private $logger: ILogger,
		private $pluginsService: IPluginsService,
		private $pacoteService: IPacoteService,
		private $projectDataService: IProjectDataService) {
			super($fs, $platformCommandHelper, $platformsDataService, $packageInstallationManager, $packageManager);
			this.getTemplateManifest = _.memoize(this._getTemplateManifest, (...args) => {
				return args.join("@");
			});
	}
	private getTemplateManifest: Function;
	static readonly folders: string[] = [
		constants.LIB_DIR_NAME,
		constants.HOOKS_DIR_NAME,
		constants.WEBPACK_CONFIG_NAME,
		constants.PACKAGE_JSON_FILE_NAME,
		constants.PACKAGE_LOCK_JSON_FILE_NAME
	];

	static readonly backupFolder: string = ".update_backup";
	static readonly updateFailMessage: string = "Could not update the project!";
	static readonly backupFailMessage: string = "Could not backup project folders!";

	public async update(updateOptions: IUpdateOptions): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(updateOptions.projectDir);
		const backupDir = path.join(updateOptions.projectDir, UpdateController.backupFolder);

		try {
			this.backup(UpdateController.folders, backupDir, projectData.projectDir);
		} catch (error) {
			this.$logger.error(UpdateController.backupFailMessage);
			this.$fs.deleteDirectory(backupDir);
			return;
		}

		try {
			await this.cleanUpProject(projectData);
			await this.updateProject(projectData, updateOptions.version);
		} catch (error) {
			this.restoreBackup(UpdateController.folders, backupDir, projectData.projectDir);
			this.$logger.error(UpdateController.updateFailMessage);
		}
	}

	public async shouldUpdate({projectDir, version}: {projectDir: string, version?: string}): Promise<boolean> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const templateName = this.getTemplateName(projectData);
		const templateManifest = await this.getTemplateManifest(templateName, version);
		const dependencies = templateManifest.dependencies;
		const devDependencies = templateManifest.devDependencies;

		if (
			await this.hasDependenciesToUpdate({dependencies, areDev: false, projectData}) ||
			await this.hasDependenciesToUpdate({dependencies: devDependencies, areDev: true, projectData})
		) {
			return true;
		}

		for (const platform in this.$devicePlatformsConstants) {
			const lowercasePlatform = platform.toLowerCase();
			const platformData = this.$platformsDataService.getPlatformData(lowercasePlatform, projectData);
			const templatePlatformData = this.$projectDataService.getNSValueFromContent(templateManifest, platformData.frameworkPackageName);
			const templateRuntimeVersion = templatePlatformData && templatePlatformData.version;
			if (templateRuntimeVersion && await this.shouldUpdateRuntimeVersion(templateRuntimeVersion, platformData.frameworkPackageName, platform, projectData)) {
				return true;
			}
		}
	}

	private async cleanUpProject(projectData: IProjectData) {
		this.$logger.info("Clean old project artefacts.");
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.HOOKS_DIR_NAME));
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.PLATFORMS_DIR_NAME));
		this.$fs.deleteDirectory(path.join(projectData.projectDir, constants.NODE_MODULES_FOLDER_NAME));
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.WEBPACK_CONFIG_NAME));
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.PACKAGE_LOCK_JSON_FILE_NAME));
		this.$logger.info("Clean old project artefacts complete.");
	}

	private async updateProject(projectData: IProjectData, version: string): Promise<void> {
		const templateName = this.getTemplateName(projectData);
		const templateManifest = await this.getTemplateManifest(templateName, version);

		this.$logger.info("Start updating dependencies.");
		await this.updateDependencies({ dependencies: templateManifest.dependencies, areDev: false, projectData});
		this.$logger.info("Finished updating dependencies.");
		this.$logger.info("Start updating devDependencies.");
		await this.updateDependencies({ dependencies: templateManifest.devDependencies, areDev: true, projectData});
		this.$logger.info("Finished updating devDependencies.");

		this.$logger.info("Start updating runtimes.");
		await this.updateRuntimes(templateManifest, projectData);
		this.$logger.info("Finished updating runtimes.");

		this.$logger.info("Install packages.");
		await this.$packageManager.install(projectData.projectDir, projectData.projectDir, {
			disableNpmInstall: false,
			frameworkPath: null,
			ignoreScripts: false,
			path: projectData.projectDir
		});
	}

	private async updateDependencies( {dependencies, areDev, projectData} : {dependencies: IDictionary<string>, areDev: boolean, projectData: IProjectData}) {
		for (const dependency in dependencies) {
			const templateVersion = dependencies[dependency];
			if (!this.hasDependency({ packageName: dependency, isDev: areDev }, projectData)) {
				continue;
			}

			if (await this.shouldUpdateDependency(dependency, templateVersion, projectData)) {
				this.$logger.info(`Updating '${dependency}' to version '${templateVersion}'.`);
				this.$pluginsService.addToPackageJson(dependency, templateVersion, areDev, projectData.projectDir);
			}
		}
	}

	private async shouldUpdateDependency(dependency: string, targetVersion: string, projectData: IProjectData) {
		const devDependencies = projectData.devDependencies || {};
		const dependencies = projectData.dependencies || {};
		const projectVersion = dependencies[dependency] || devDependencies[dependency];
		const maxSatisfyingTargetVersion = await this.getMaxDependencyVersion(dependency, targetVersion);
		const maxSatisfyingProjectVersion = await this.getMaxDependencyVersion(dependency, projectVersion);

		return maxSatisfyingProjectVersion && maxSatisfyingTargetVersion && semver.gt(maxSatisfyingTargetVersion, maxSatisfyingProjectVersion);
	}

	private async hasDependenciesToUpdate({dependencies, areDev, projectData}: {dependencies: IDictionary<string>, areDev: boolean, projectData:IProjectData}) {
		for (const dependency in dependencies) {
			const templateVersion = dependencies[dependency];
			if (!this.hasDependency({ packageName: dependency, isDev: areDev }, projectData)) {
				continue;
			}

			if (await this.shouldUpdateDependency(dependency, templateVersion, projectData)) {
				return true;
			}
		}
	}

	private async updateRuntimes(templateManifest: Object, projectData: IProjectData) {
		for (const platform in this.$devicePlatformsConstants) {
			const lowercasePlatform = platform.toLowerCase();
			const platformData = this.$platformsDataService.getPlatformData(lowercasePlatform, projectData);
			const templatePlatformData = this.$projectDataService.getNSValueFromContent(templateManifest, platformData.frameworkPackageName);
			const templateRuntimeVersion = templatePlatformData && templatePlatformData.version;
			if (templateRuntimeVersion && await this.shouldUpdateRuntimeVersion(templateRuntimeVersion, platformData.frameworkPackageName, platform, projectData)) {
				this.$logger.info(`Updating ${platform} platform to version '${templateRuntimeVersion}'.`);
				await this.$addPlatformService.setPlatformVersion(platformData, projectData, templateRuntimeVersion);
			}
		}
	}

	private async shouldUpdateRuntimeVersion(templateRuntimeVersion: string, frameworkPackageName: string, platform: string, projectData: IProjectData): Promise<boolean> {
		const hasRuntimeDependency = this.hasRuntimeDependency({platform, projectData});

		if (!hasRuntimeDependency) {
			return false;
		}

		const maxTemplateRuntimeVersion = await this.getMaxDependencyVersion(frameworkPackageName, templateRuntimeVersion);
		const maxRuntimeVersion = await this.getMaxRuntimeVersion({platform, projectData});

		return maxTemplateRuntimeVersion && maxRuntimeVersion && semver.gt(maxTemplateRuntimeVersion, maxRuntimeVersion);
	}

	private async _getTemplateManifest(templateName: string, version: string) {
		let packageVersion = version ? version : await this.$packageInstallationManager.getLatestCompatibleVersionSafe(templateName);
		packageVersion = semver.valid(version) ? version : await this.$packageManager.getTagVersion(templateName, packageVersion);
		packageVersion = packageVersion ? packageVersion : await this.$packageInstallationManager.getLatestCompatibleVersionSafe(templateName);

		return await this.$pacoteService.manifest(`${templateName}@${packageVersion}`, { fullMetadata: true });
	}

	private getTemplateName(projectData: IProjectData) {
		let template;
		switch (projectData.projectType) {
			case constants.ProjectTypes.NgFlavorName: {
				template = constants.RESERVED_TEMPLATE_NAMES.angular;
				break;
			}
			case constants.ProjectTypes.VueFlavorName: {
				template = constants.RESERVED_TEMPLATE_NAMES.vue;
				break;
			}
			case constants.ProjectTypes.TsFlavorName: {
				template = constants.RESERVED_TEMPLATE_NAMES.typescript;
				break;
			}
			case constants.ProjectTypes.JsFlavorName: {
				template = constants.RESERVED_TEMPLATE_NAMES.javascript;
				break;
			}
		}

		return template;
	}
}

$injector.register("updateController", UpdateController);
