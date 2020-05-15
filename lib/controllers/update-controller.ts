import * as path from "path";
import * as semver from "semver";
import * as constants from "../constants";
import { UpdateControllerBase } from "./update-controller-base";
import { getAndroidRuntimePackageName, getIOSRuntimePackageName } from "../common/helpers";

interface IPackage {
	name: string;
	alias?: string;
	isDev?: boolean;
}

export class UpdateController extends UpdateControllerBase implements IUpdateController {
	static readonly updatableDependencies: IPackage[] = [
		{ name: constants.SCOPED_TNS_CORE_MODULES, alias: constants.TNS_CORE_MODULES_NAME },
		{ name: constants.TNS_CORE_MODULES_NAME },
		{ name: constants.TNS_CORE_MODULES_WIDGETS_NAME },
		{ name: constants.WEBPACK_PLUGIN_NAME, isDev: true }];
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
	static readonly failedToGetTemplateManifestMessage = "Failed to get template information for the specified version. Original error: %s";

	constructor(
		protected $fs: IFileSystem,
		protected $platformsDataService: IPlatformsDataService,
		protected $platformCommandHelper: IPlatformCommandHelper,
		protected $packageInstallationManager: IPackageInstallationManager,
		protected $packageManager: IPackageManager,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $addPlatformService: IAddPlatformService,
		private $logger: ILogger,
		private $errors: IErrors,
		private $pluginsService: IPluginsService,
		protected $pacoteService: IPacoteService,
		private $projectDataService: IProjectDataService) {
		super($fs, $platformCommandHelper, $platformsDataService, $packageInstallationManager, $packageManager, $pacoteService);
	}

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
			this.$logger.error(`${UpdateController.updateFailMessage} Reason is: ${error.message}`);
		}
	}

	public async shouldUpdate({ projectDir, version }: { projectDir: string, version?: string }): Promise<boolean> {
		if (version && !semver.valid(version) && !semver.validRange(version)) {
			// probably npm tag here
			return true;
		}

		const projectData = this.$projectDataService.getProjectData(projectDir);
		const templateManifest = await this.getTemplateManifest(projectData, version);
		const dependencies = this.getUpdatableDependencies(templateManifest.dependencies);
		const devDependencies = this.getUpdatableDependencies(templateManifest.devDependencies);

		if (
			await this.hasDependenciesToUpdate({ dependencies, areDev: false, projectData }) ||
			await this.hasDependenciesToUpdate({ dependencies: devDependencies, areDev: true, projectData })
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
		if (projectData.projectType === constants.ProjectTypes.ReactFlavorName || projectData.projectType === constants.ProjectTypes.SvelteFlavorName) {
			this.$logger.warn(`As this project is of type ${projectData.projectType}, CLI will not update its ${constants.WEBPACK_CONFIG_NAME} file. Consider updating it manually.`);
		} else {
			this.$fs.deleteFile(path.join(projectData.projectDir, constants.WEBPACK_CONFIG_NAME));
		}
		this.$fs.deleteFile(path.join(projectData.projectDir, constants.PACKAGE_LOCK_JSON_FILE_NAME));
		this.$logger.info("Clean old project artefacts complete.");
	}

	private async updateProject(projectData: IProjectData, version: string): Promise<void> {
		let templateManifest: any = {};

		if (!version || semver.valid(version) || semver.validRange(version)) {
			templateManifest = await this.getTemplateManifest(projectData, version);
		} else {
			templateManifest = await this.constructTemplateManifestForTag(projectData, version);
		}

		const dependencies = this.getUpdatableDependencies(templateManifest.dependencies);
		const devDependencies = this.getUpdatableDependencies(templateManifest.devDependencies);

		this.$logger.info("Start updating dependencies.");
		await this.updateDependencies({ dependencies, areDev: false, projectData });
		this.$logger.info("Finished updating dependencies.");
		this.$logger.info("Start updating devDependencies.");
		await this.updateDependencies({ dependencies: devDependencies, areDev: true, projectData });
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

	private async constructTemplateManifestForTag(projectData: IProjectData, tag: string): Promise<any> {
		this.$logger.trace(`Will construct manually template manifest for tag ${tag}`);

		const templateManifest: any = {};
		templateManifest.dependencies = {};
		templateManifest.devDependencies = {};
		for (const updatableDependency of UpdateController.updatableDependencies) {
			const version = await this.getVersionFromTag(updatableDependency.name, tag);
			if (!version) {
				this.$errors.fail(`Unable to execute update as package '${updatableDependency.name}' does not have version or tag '${tag}'`);
			}

			const dictionaryToModify = updatableDependency.isDev ? templateManifest.devDependencies : templateManifest.dependencies;
			dictionaryToModify[updatableDependency.name] = version;
			if (updatableDependency.alias) {
				const aliasVersion = await this.getVersionFromTag(updatableDependency.name, tag);
				dictionaryToModify[updatableDependency.alias] = aliasVersion;
			}
    }
    
    const androidRuntime = getAndroidRuntimePackageName(projectData);
    const iosRuntime = getIOSRuntimePackageName(projectData);

    if (projectData.isLegacy) {
      templateManifest.nativescript = {
        [androidRuntime]: {
          version: await this.getVersionFromTag(androidRuntime, tag)
        },
        [iosRuntime]: {
          version: await this.$packageManager.getTagVersion(iosRuntime, tag)
        }
      };
    } else {
      templateManifest.devDependencies[androidRuntime] = await this.getVersionFromTag(androidRuntime, tag);
      templateManifest.devDependencies[iosRuntime] = await this.getVersionFromTag(iosRuntime, tag);
    }

		this.$logger.trace(`Manually constructed template manifest for tag ${tag}. Content is: ${JSON.stringify(templateManifest, null, 2)}`);

		return templateManifest;
	}

	private async getVersionFromTag(packageName: string, tag: string): Promise<string> {
		const version = await this.$packageManager.getTagVersion(packageName, tag);
		if (!version) {
			this.$errors.fail(`Unable to execute update as package ${packageName} does not have version/tag ${tag}. Please enter valid version or npm tag.`);
		}

		return version;
	}

	private async updateDependencies({ dependencies, areDev, projectData }: { dependencies: IDictionary<string>, areDev: boolean, projectData: IProjectData }) {
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
		const maxSatisfyingTargetVersion = await this.$packageInstallationManager.getMaxSatisfyingVersionSafe(dependency, targetVersion);
		const maxSatisfyingProjectVersion = await this.$packageInstallationManager.getMaxSatisfyingVersionSafe(dependency, projectVersion);
		return maxSatisfyingProjectVersion && maxSatisfyingTargetVersion && semver.gt(maxSatisfyingTargetVersion, maxSatisfyingProjectVersion);
	}

	private async hasDependenciesToUpdate({ dependencies, areDev, projectData }: { dependencies: IDictionary<string>, areDev: boolean, projectData: IProjectData }) {
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
		const hasRuntimeDependency = this.hasRuntimeDependency({ platform, projectData });

		if (!hasRuntimeDependency) {
			return false;
		}

		const maxTemplateRuntimeVersion = await this.$packageInstallationManager.getMaxSatisfyingVersionSafe(frameworkPackageName, templateRuntimeVersion);
		const maxRuntimeVersion = await this.getMaxRuntimeVersion({ platform, projectData });

		return maxTemplateRuntimeVersion && maxRuntimeVersion && semver.gt(maxTemplateRuntimeVersion, maxRuntimeVersion);
	}

	private getUpdatableDependencies(dependencies: IDictionary<string>): IDictionary<string> {
		const updatableDependencies: IDictionary<string> = {};

		UpdateController.updatableDependencies.forEach(updatableDependency => {
			if (dependencies[updatableDependency.name]) {
				updatableDependencies[updatableDependency.name] = dependencies[updatableDependency.name];
			} else if (updatableDependency.alias && dependencies[updatableDependency.alias]) {
				updatableDependencies[updatableDependency.name] = dependencies[updatableDependency.alias];
			}
		});

		return updatableDependencies;
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
			default: {
				template = constants.RESERVED_TEMPLATE_NAMES.javascript;
				break;
			}
		}

		return template;
	}

	private async getTemplateManifest(projectData: IProjectData, version: string): Promise<any> {
		let templateManifest;
		const templateName = this.getTemplateName(projectData);
		version = version || await this.$packageInstallationManager.getLatestCompatibleVersionSafe(templateName);
		try {
			templateManifest = await this.getPackageManifest(templateName, version);
		} catch (err) {
			this.$errors.fail(UpdateController.failedToGetTemplateManifestMessage, err.message);
		}

		return templateManifest;
	}
}

$injector.register("updateController", UpdateController);
