import { performanceLog } from "../../common/decorators";
import { PreparePlatformData } from "../workflow/workflow-data-service";
import * as path from "path";
import { NativePlatformStatus, APP_FOLDER_NAME, APP_RESOURCES_FOLDER_NAME } from "../../constants";

export class PreparePlatformService {
	constructor(
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $projectChangesService: IProjectChangesService,
		private $webpackCompilerService: IWebpackCompilerService,
	) { }

	@performanceLog()
	public async preparePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<boolean> {
		this.$logger.out("Preparing project...");

		await this.$webpackCompilerService.compileWithoutWatch(platformData, projectData, { watch: false, env: preparePlatformData.env });
		await this.prepareNativePlatform(platformData, projectData, preparePlatformData);

		this.$projectChangesService.savePrepareInfo(platformData);

		this.$logger.out(`Project successfully prepared (${platformData.platformNameLowerCase})`);

		return true;
	}

	@performanceLog()
	public async prepareNativePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<boolean> {
		const { nativePrepare, release } = preparePlatformData;
		if (nativePrepare && nativePrepare.skipNativePrepare) {
			return false;
		}

		const changesInfo = await this.$projectChangesService.checkForChanges(platformData.platformNameLowerCase, projectData, preparePlatformData);

		const hasModulesChange = !changesInfo || changesInfo.modulesChanged;
		const hasConfigChange = !changesInfo || changesInfo.configChanged;
		const hasChangesRequirePrepare = !changesInfo || changesInfo.changesRequirePrepare;

		const hasChanges = hasModulesChange || hasConfigChange || hasChangesRequirePrepare;

		if (changesInfo.hasChanges) {
			await this.cleanProject(platformData, projectData, { release });
		}

		// Move the native application resources from platforms/.../app/App_Resources
		// to the right places in the native project,
		// because webpack copies them on every build (not every change).
		this.prepareAppResources(platformData, projectData);

		if (hasChangesRequirePrepare) {
			await platformData.platformProjectService.prepareProject(projectData, preparePlatformData);
		}

		if (hasModulesChange) {
			await this.$nodeModulesBuilder.prepareNodeModules(platformData, projectData);
		}

		if (hasModulesChange || hasConfigChange) {
			await platformData.platformProjectService.processConfigurationFilesFromAppResources(projectData, { release });
			await platformData.platformProjectService.handleNativeDependenciesChange(projectData, { release });
		}

		platformData.platformProjectService.interpolateConfigurationFile(projectData, preparePlatformData);
		this.$projectChangesService.setNativePlatformStatus(platformData, { nativePlatformStatus: NativePlatformStatus.alreadyPrepared });

		return hasChanges;
	}

	private prepareAppResources(platformData: IPlatformData, projectData: IProjectData): void {
		const appDestinationDirectoryPath = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);
		const appResourcesDestinationDirectoryPath = path.join(appDestinationDirectoryPath, APP_RESOURCES_FOLDER_NAME);

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

	private async cleanProject(platformData: IPlatformData, projectData: IProjectData, options: { release: boolean }): Promise<void> {
		// android build artifacts need to be cleaned up
		// when switching between debug, release and webpack builds
		if (platformData.platformNameLowerCase !== "android") {
			return;
		}

		const previousPrepareInfo = this.$projectChangesService.getPrepareInfo(platformData);
		if (!previousPrepareInfo || previousPrepareInfo.nativePlatformStatus !== NativePlatformStatus.alreadyPrepared) {
			return;
		}

		const { release: previousWasRelease } = previousPrepareInfo;
		const { release: currentIsRelease } = options;
		if (previousWasRelease !== currentIsRelease) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}
	}
}
$injector.register("preparePlatformService", PreparePlatformService);
