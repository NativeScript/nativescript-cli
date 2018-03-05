import * as constants from "../constants";
import * as path from "path";
import * as shell from "shelljs";
import { PreparePlatformService } from "./prepare-platform-service";

export class PreparePlatformNativeService extends PreparePlatformService implements IPreparePlatformService {

	constructor($fs: IFileSystem,
		$xmlValidator: IXmlValidator,
		$hooksService: IHooksService,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $pluginsService: IPluginsService,
		private $projectChangesService: IProjectChangesService) {
		super($fs, $hooksService, $xmlValidator);
	}

	public async addPlatform(info: IAddPlatformInfo): Promise<void> {
		await info.platformData.platformProjectService.createProject(path.resolve(info.frameworkDir), info.installedVersion, info.projectData, info.config);
		info.platformData.platformProjectService.ensureConfigurationFileInAppResources(info.projectData);
		await info.platformData.platformProjectService.interpolateData(info.projectData, info.config);
		info.platformData.platformProjectService.afterCreateProject(info.platformData.projectRoot, info.projectData);
	}

	public async preparePlatform(config: IPreparePlatformJSInfo): Promise<void> {
		if (config.changesInfo.hasChanges) {
			await this.cleanProject(config.platform, config.appFilesUpdaterOptions, config.platformData, config.projectData);
		}

		if (!config.changesInfo || config.changesInfo.changesRequirePrepare || config.appFilesUpdaterOptions.bundle) {
			this.copyAppResources(config.platformData, config.projectData);
			await config.platformData.platformProjectService.prepareProject(config.projectData, config.platformSpecificData);
		}

		if (!config.changesInfo || config.changesInfo.modulesChanged || config.appFilesUpdaterOptions.bundle) {
			await this.$pluginsService.validate(config.platformData, config.projectData);

			const appDestinationDirectoryPath = path.join(config.platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

			const tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			const nodeModulesData: INodeModulesData = {
				absoluteOutputPath: tnsModulesDestinationPath,
				appFilesUpdaterOptions: config.appFilesUpdaterOptions,
				lastModifiedTime,
				platform: config.platform,
				projectData: config.projectData,
				projectFilesConfig: config.projectFilesConfig
			};

			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareNodeModules(nodeModulesData);
		}

		if (!config.changesInfo || config.changesInfo.configChanged || config.changesInfo.modulesChanged) {
			await config.platformData.platformProjectService.processConfigurationFilesFromAppResources(config.appFilesUpdaterOptions.release, config.projectData);
		}

		config.platformData.platformProjectService.interpolateConfigurationFile(config.projectData, config.platformSpecificData);
		this.$projectChangesService.setNativePlatformStatus(config.platform, config.projectData,
			{ nativePlatformStatus: constants.NativePlatformStatus.alreadyPrepared });
	}

	private copyAppResources(platformData: IPlatformData, projectData: IProjectData): void {
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appResourcesDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);

		if (this.$fs.exists(appResourcesDirectoryPath)) {
			platformData.platformProjectService.prepareAppResources(appResourcesDirectoryPath, projectData);
			const appResourcesDestination = platformData.platformProjectService.getAppResourcesDestinationDirectoryPath(projectData);
			this.$fs.ensureDirectoryExists(appResourcesDestination);
			shell.cp("-Rf", path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);
			this.$fs.deleteDirectory(appResourcesDirectoryPath);
		}
	}

	private async cleanProject(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformData: IPlatformData, projectData: IProjectData): Promise<void> {
		// android build artifacts need to be cleaned up
		// when switching between debug, release and webpack builds
		if (platform.toLowerCase() !== "android") {
			return;
		}

		const previousPrepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		if (!previousPrepareInfo) {
			return;
		}

		const { release: previousWasRelease, bundle: previousWasBundle } = previousPrepareInfo;
		const { release: currentIsRelease, bundle: currentIsBundle } = appFilesUpdaterOptions;
		if ((previousWasRelease !== currentIsRelease) || (previousWasBundle !== currentIsBundle)) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}
	}
}

$injector.register("preparePlatformNativeService", PreparePlatformNativeService);
