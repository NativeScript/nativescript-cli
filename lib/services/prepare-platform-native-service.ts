import * as path from "path";
import * as choki from "chokidar";
import * as constants from "../constants";
import { performanceLog } from "../common/decorators";
import { EventEmitter } from "events";

export class PreparePlatformNativeService extends EventEmitter implements IPreparePlatformService {
	private watchersInfo: IDictionary<choki.FSWatcher> = {};

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $nodeModulesBuilder: INodeModulesBuilder,
		private $projectChangesService: IProjectChangesService,
		private $androidResourcesMigrationService: IAndroidResourcesMigrationService) {
			super();
	}

	@performanceLog()
	public async addPlatform(info: IAddPlatformInfo): Promise<void> {
		const { platformData, projectData, frameworkDir, installedVersion, config } = info;

		const platformDir = path.join(projectData.platformsDir, platformData.normalizedPlatformName.toLowerCase());
		this.$fs.deleteDirectory(platformDir);

		await platformData.platformProjectService.createProject(path.resolve(frameworkDir), installedVersion, projectData, config);
		platformData.platformProjectService.ensureConfigurationFileInAppResources(projectData);
		await info.platformData.platformProjectService.interpolateData(projectData, config);
		info.platformData.platformProjectService.afterCreateProject(platformData.projectRoot, projectData);
		this.$projectChangesService.setNativePlatformStatus(platformData.normalizedPlatformName, projectData,
			{ nativePlatformStatus: constants.NativePlatformStatus.requiresPrepare });
	}

	public async startWatcher(platformData: IPlatformData, projectData: IProjectData, config: IPreparePlatformJSInfo): Promise<void> {
		const watcherOptions: choki.WatchOptions = {
			ignoreInitial: true,
			cwd: projectData.projectDir,
			awaitWriteFinish: {
				pollInterval: 100,
				stabilityThreshold: 500
			},
			ignored: ["**/.*", ".*"] // hidden files
		};

		await this.preparePlatform(config);

		// TODO: node_modules/**/platforms -> when no platform is provided,
		//       node_modules/**/platforms/ios -> when iOS platform is provided
		//       node_modules/**/platforms/android -> when Android is provided
		const patterns = [projectData.getAppResourcesRelativeDirectoryPath(), "node_modules/**/platforms/"];

		// TODO: Add stopWatcher function
		const watcher = choki.watch(patterns, watcherOptions)
			.on("all", async (event: string, filePath: string) => {
				filePath = path.join(projectData.projectDir, filePath);
				this.$logger.trace(`Chokidar raised event ${event} for ${filePath}.`);
				await this.preparePlatform(config);
			});

		this.watchersInfo[projectData.projectDir] = watcher;
	}

	public stopWatchers(): void {
		// TODO: stop the watchers here
	}

	@performanceLog()
	public async preparePlatform(config: IPreparePlatformJSInfo): Promise<void> { // TODO: should return 3 states for nativeFilesChanged, hasChanges, noChanges, skipChanges
		const shouldAddNativePlatform = !config.nativePrepare || !config.nativePrepare.skipNativePrepare;
		if (!shouldAddNativePlatform) {
			this.emit("nativeFilesChanged", false);
		}

		const hasModulesChange = !config.changesInfo || config.changesInfo.modulesChanged;
		const hasConfigChange = !config.changesInfo || config.changesInfo.configChanged;
		const hasChangesRequirePrepare = !config.changesInfo || config.changesInfo.changesRequirePrepare;

		const hasChanges = hasModulesChange || hasConfigChange || hasChangesRequirePrepare;

		if (config.changesInfo.hasChanges) {
			await this.cleanProject(config.platform, config.appFilesUpdaterOptions, config.platformData, config.projectData);
		}

		// Move the native application resources from platforms/.../app/App_Resources
		// to the right places in the native project,
		// because webpack copies them on every build (not every change).
		this.prepareAppResources(config.platformData, config.projectData);

		if (hasChangesRequirePrepare) {
			await config.platformData.platformProjectService.prepareProject(config.projectData, config.platformSpecificData);
		}

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

		this.emit("nativeFilesChanged", hasChanges);
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
