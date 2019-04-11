import * as constants from "../constants";
import * as path from "path";
import { PreparePlatformService } from "./prepare-platform-service";
import { performanceLog } from "../common/decorators";

export class PreparePlatformNativeService extends PreparePlatformService implements IPreparePlatformService {

	constructor($fs: IFileSystem,
		$xmlValidator: IXmlValidator,
		$hooksService: IHooksService,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $projectChangesService: IProjectChangesService,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService) {
		super($fs, $hooksService, $xmlValidator);
	}

	@performanceLog()
	public async addPlatform(info: IAddPlatformInfo): Promise<void> {
		await info.platformData.platformProjectService.createProject(path.resolve(info.frameworkDir), info.installedVersion, info.projectData, info.config);
		info.platformData.platformProjectService.ensureConfigurationFileInAppResources(info.projectData);
		await info.platformData.platformProjectService.interpolateData(info.projectData, info.config);
		info.platformData.platformProjectService.afterCreateProject(info.platformData.projectRoot, info.projectData);
		this.$projectChangesService.setNativePlatformStatus(info.platformData.normalizedPlatformName, info.projectData,
			{ nativePlatformStatus: constants.NativePlatformStatus.requiresPrepare });
	}

	@performanceLog()
	public async preparePlatform(config: IPreparePlatformJSInfo): Promise<void> {
		if (config.changesInfo.hasChanges) {
			await this.cleanProject(config.platform, config.appFilesUpdaterOptions, config.platformData, config.projectData);
		}

		// Move the native application resources from platforms/.../app/App_Resources
		// to the right places in the native project,
		// because webpack copies them on every build (not every change).
		if (!config.changesInfo || config.changesInfo.changesRequirePrepare || config.appFilesUpdaterOptions.bundle) {
			this.prepareAppResources(config.platformData, config.projectData);
		}

		if (!config.changesInfo || config.changesInfo.changesRequirePrepare) {
			await config.platformData.platformProjectService.prepareProject(config.projectData, config.platformSpecificData);
		}

		const hasModulesChange = !config.changesInfo || config.changesInfo.modulesChanged;
		const hasConfigChange = !config.changesInfo || config.changesInfo.configChanged;

		if (hasModulesChange) {
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
			await this.$nodeModulesBuilder.prepareNodeModules({ nodeModulesData, release: config.appFilesUpdaterOptions.release });
		}

		if (hasModulesChange || hasConfigChange) {
			await config.platformData.platformProjectService.processConfigurationFilesFromAppResources(config.projectData, { release: config.appFilesUpdaterOptions.release });
			await config.platformData.platformProjectService.handleNativeDependenciesChange(config.projectData, { release: config.appFilesUpdaterOptions.release });
		}

		config.platformData.platformProjectService.interpolateConfigurationFile(config.projectData, config.platformSpecificData);
		this.$projectChangesService.setNativePlatformStatus(config.platform, config.projectData,
			{ nativePlatformStatus: constants.NativePlatformStatus.alreadyPrepared });
	}

	private prepareAppResources(platformData: IPlatformData, projectData: IProjectData): void {
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);
		const appResourcesDestinationDirectoryPath = path.join(appDestinationDirectoryPath, constants.APP_RESOURCES_FOLDER_NAME);

		if (this.$fs.exists(appResourcesDestinationDirectoryPath)) {
			platformData.platformProjectService.prepareAppResources(appResourcesDestinationDirectoryPath, projectData);
			const appResourcesDestination = platformData.platformProjectService.getAppResourcesDestinationDirectoryPath(projectData);
			this.$fs.ensureDirectoryExists(appResourcesDestination);

			if (platformData.normalizedPlatformName.toLowerCase() === "android") {
				const appResourcesDirectoryPath = projectData.getAppResourcesDirectoryPath();
				const appResourcesDirStructureHasMigrated = this.$androidResourcesMigrationService.hasMigrated(appResourcesDirectoryPath);
				const appResourcesAndroid = path.join(appResourcesDirectoryPath, platformData.normalizedPlatformName);

				if (appResourcesDirStructureHasMigrated) {
					this.$fs.copyFile(path.join(appResourcesAndroid, "src", "*"), appResourcesDestination);

					this.$fs.deleteDirectory(appResourcesDestinationDirectoryPath);
					return;
				}

				// https://github.com/NativeScript/android-runtime/issues/899
				// App_Resources/Android/libs is reserved to user's aars and jars, but they should not be copied as resources
				this.$fs.copyFile(path.join(appResourcesDestinationDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);
				this.$fs.deleteDirectory(path.join(appResourcesDestination, "libs"));

				this.$fs.deleteDirectory(appResourcesDestinationDirectoryPath);

				return;
			}

			this.$fs.copyFile(path.join(appResourcesDestinationDirectoryPath, platformData.normalizedPlatformName, "*"), appResourcesDestination);

			this.$fs.deleteDirectory(appResourcesDestinationDirectoryPath);
		}
	}

	private async cleanProject(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformData: IPlatformData, projectData: IProjectData): Promise<void> {
		// android build artifacts need to be cleaned up
		// when switching between debug, release and webpack builds
		if (platform.toLowerCase() !== "android") {
			return;
		}

		const previousPrepareInfo = this.$projectChangesService.getPrepareInfo(platform, projectData);
		if (!previousPrepareInfo || previousPrepareInfo.nativePlatformStatus !== constants.NativePlatformStatus.alreadyPrepared) {
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
