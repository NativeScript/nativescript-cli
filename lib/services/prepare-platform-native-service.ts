import * as constants from "../constants";
import * as path from "path";
import * as shell from "shelljs";
import { PreparePlatformService } from "./prepare-platform-service";

export class PreparePlatformNativeService extends PreparePlatformService implements IPreparePlatformNativeService {

	constructor($fs: IFileSystem,
		$xmlValidator: IXmlValidator,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $pluginsService: IPluginsService,
		private $projectChangesService: IProjectChangesService) {
		super($fs, $xmlValidator);
	}

	public async addPlatform(platformData: IPlatformData, frameworkDir: string, installedVersion: string, projectData: IProjectData, config: IPlatformOptions): Promise<void> {
		await platformData.platformProjectService.createProject(path.resolve(frameworkDir), installedVersion, projectData, config);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await platformData.platformProjectService.interpolateData(projectData, config);
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);
	}

	public async preparePlatform(platform: string, platformData: IPlatformData, appFilesUpdaterOptions: IAppFilesUpdaterOptions, projectData: IProjectData, platformSpecificData: IPlatformSpecificData, changesInfo?: IProjectChangesInfo, filesToSync?: Array<String>, projectFilesConfig?: IProjectFilesConfig): Promise<void> {
		if (changesInfo.hasChanges) {
			await this.cleanProject(platform, appFilesUpdaterOptions, platformData, projectData);
		}

		if (!changesInfo || changesInfo.changesRequirePrepare) {
			await this.copyAppFiles(platformData, appFilesUpdaterOptions, projectData);
			this.copyAppResources(platformData, projectData);
			await platformData.platformProjectService.prepareProject(projectData, platformSpecificData);
		}

		if (!changesInfo || changesInfo.modulesChanged || appFilesUpdaterOptions.bundle) {
			await this.$pluginsService.validate(platformData, projectData);

			const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
			const lastModifiedTime = this.$fs.exists(appDestinationDirectoryPath) ? this.$fs.getFsStats(appDestinationDirectoryPath).mtime : null;

			const tnsModulesDestinationPath = path.join(appDestinationDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);
			// Process node_modules folder
			await this.$nodeModulesBuilder.prepareNodeModules(tnsModulesDestinationPath, platform, lastModifiedTime, projectData, projectFilesConfig);
		}

		if (!changesInfo || changesInfo.configChanged || changesInfo.modulesChanged) {
			await platformData.platformProjectService.processConfigurationFilesFromAppResources(appFilesUpdaterOptions.release, projectData);
		}

		platformData.platformProjectService.interpolateConfigurationFile(projectData, platformSpecificData);
		this.$projectChangesService.setNativePlatformStatus(platform, projectData,
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
