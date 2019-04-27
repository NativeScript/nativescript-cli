import * as path from "path";
import * as constants from "../constants";
import { performanceLog } from "../common/decorators";

export class PlatformNativeService implements IPreparePlatformService {
	constructor(
		private $fs: IFileSystem,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $projectChangesService: IProjectChangesService,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService
	) { }

	@performanceLog()
	public async addPlatform(platformData: IPlatformData, projectData: IProjectData, frameworkDirPath: string, frameworkVersion: string): Promise<void> {
		const config = <any>{};

		const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
		this.$fs.deleteDirectory(platformDir);

		await platformData.platformProjectService.createProject(path.resolve(frameworkDirPath), frameworkVersion, projectData, config);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await platformData.platformProjectService.interpolateData(projectData, config);
		platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);
		this.$projectChangesService.setNativePlatformStatus(platformData.normalizedPlatformName, projectData,
			{ nativePlatformStatus: constants.NativePlatformStatus.requiresPrepare });
	}

	@performanceLog()
	public async preparePlatform(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: IPreparePlatformData): Promise<boolean> {
		const { nativePrepare, release, useHotModuleReload, signingOptions } = preparePlatformData;
		if (nativePrepare && nativePrepare.skipNativePrepare) {
			return false;
		}

		const nativePlatformStatus = (nativePrepare && nativePrepare.skipNativePrepare) ? constants.NativePlatformStatus.requiresPlatformAdd : constants.NativePlatformStatus.requiresPrepare;
		const changesInfo = await this.$projectChangesService.checkForChanges({
			platform: platformData.platformNameLowerCase,
			projectData,
			projectChangesOptions: {
				signingOptions,
				release,
				nativePlatformStatus,
				useHotModuleReload
			}
		});

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
			await platformData.platformProjectService.prepareProject(projectData, signingOptions);
		}

		if (hasModulesChange) {
			await this.$nodeModulesBuilder.prepareNodeModules(platformData, projectData);
		}

		if (hasModulesChange || hasConfigChange) {
			await platformData.platformProjectService.processConfigurationFilesFromAppResources(projectData, { release });
			await platformData.platformProjectService.handleNativeDependenciesChange(projectData, { release });
		}

		platformData.platformProjectService.interpolateConfigurationFile(projectData, signingOptions);
		this.$projectChangesService.setNativePlatformStatus(platformData.platformNameLowerCase, projectData,
			{ nativePlatformStatus: constants.NativePlatformStatus.alreadyPrepared });

		return hasChanges;
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

	private async cleanProject(platformData: IPlatformData, projectData: IProjectData, options: { release: boolean }): Promise<void> {
		// android build artifacts need to be cleaned up
		// when switching between debug, release and webpack builds
		if (platformData.platformNameLowerCase !== "android") {
			return;
		}

		const previousPrepareInfo = this.$projectChangesService.getPrepareInfo(platformData.platformNameLowerCase, projectData);
		if (!previousPrepareInfo || previousPrepareInfo.nativePlatformStatus !== constants.NativePlatformStatus.alreadyPrepared) {
			return;
		}

		const { release: previousWasRelease } = previousPrepareInfo;
		const { release: currentIsRelease } = options;
		if (previousWasRelease !== currentIsRelease) {
			await platformData.platformProjectService.cleanProject(platformData.projectRoot, projectData);
		}
	}
}

$injector.register("platformNativeService", PlatformNativeService);
