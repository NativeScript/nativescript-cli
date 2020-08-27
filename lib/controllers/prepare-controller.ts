import * as choki from "chokidar";
import { hook } from "../common/helpers";
import { performanceLog, cache } from "../common/decorators";
import { EventEmitter } from "events";
import * as path from "path";
import { PREPARE_READY_EVENT_NAME, WEBPACK_COMPILATION_COMPLETE, PACKAGE_JSON_FILE_NAME, PLATFORMS_DIR_NAME, TrackActionNames, AnalyticsEventLabelDelimiter, CONFIG_FILE_NAME_JS, CONFIG_FILE_NAME_TS, SCOPED_IOS_RUNTIME_NAME, SCOPED_ANDROID_RUNTIME_NAME, TNS_IOS_RUNTIME_NAME, TNS_ANDROID_RUNTIME_NAME } from "../constants";
import { IProjectDataService, IProjectData, IProjectConfigService } from "../definitions/project";
import { IPlatformController, INodeModulesDependenciesBuilder, IPlatformsDataService, IPlatformData } from "../definitions/platform";
import { IPluginsService } from "../definitions/plugins";
import { IWatchIgnoreListService } from "../declarations";
import { IDictionary, IHooksService, IAnalyticsService, IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";
// import { project } from "nativescript-dev-xcode";
// import { platform } from "os";
interface IPlatformWatcherData {
	hasWebpackCompilerProcess: boolean;
	nativeFilesWatcher: choki.FSWatcher;
}

export class PrepareController extends EventEmitter {
	private watchersData: IDictionary<IDictionary<IPlatformWatcherData>> = {};
	private isInitialPrepareReady = false;
	private persistedData: IFilesChangeEventData[] = [];
	private webpackCompilerHandler: any = null;

	constructor(
		private $platformController: IPlatformController,
		public $hooksService: IHooksService,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		private $platformsDataService: IPlatformsDataService,
		private $pluginsService: IPluginsService,
		private $prepareNativePlatformService: IPrepareNativePlatformService,
		private $projectChangesService: IProjectChangesService,
		private $projectDataService: IProjectDataService,
		private $webpackCompilerService: IWebpackCompilerService,
		private $watchIgnoreListService: IWatchIgnoreListService,
		private $analyticsService: IAnalyticsService,
		private $markingModeService: IMarkingModeService,
		private $projectConfigService: IProjectConfigService
	) { super(); }

	public async prepare(prepareData: IPrepareData): Promise<IPrepareResultData> {
		const projectData = this.$projectDataService.getProjectData(prepareData.projectDir);
		if (this.$mobileHelper.isAndroidPlatform(prepareData.platform)) {
			await this.$markingModeService.handleMarkingModeFullDeprecation({ projectDir: projectData.projectDir });
		}

		await this.trackRuntimeVersion(prepareData.platform, projectData);
		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);

		return this.prepareCore(prepareData, projectData);
	}

	public async stopWatchers(projectDir: string, platform: string): Promise<void> {
		const platformLowerCase = platform.toLowerCase();

		if (this.watchersData && this.watchersData[projectDir] && this.watchersData[projectDir][platformLowerCase] && this.watchersData[projectDir][platformLowerCase].nativeFilesWatcher) {
			await this.watchersData[projectDir][platformLowerCase].nativeFilesWatcher.close();
			this.watchersData[projectDir][platformLowerCase].nativeFilesWatcher = null;
		}

		if (this.watchersData && this.watchersData[projectDir] && this.watchersData[projectDir][platformLowerCase] && this.watchersData[projectDir][platformLowerCase].hasWebpackCompilerProcess) {
			await this.$webpackCompilerService.stopWebpackCompiler(platformLowerCase);
			this.$webpackCompilerService.removeListener(WEBPACK_COMPILATION_COMPLETE, this.webpackCompilerHandler);
			this.watchersData[projectDir][platformLowerCase].hasWebpackCompilerProcess = false;
		}
	}

	@performanceLog()
	@hook("prepare")
	private async prepareCore(prepareData: IPrepareData, projectData: IProjectData): Promise<IPrepareResultData> {
		await this.$platformController.addPlatformIfNeeded(prepareData);

		this.$logger.info("Preparing project...");
		let result = null;

		const platformData = this.$platformsDataService.getPlatformData(prepareData.platform, projectData);

		if (prepareData.watch) {
			result = await this.startWatchersWithPrepare(platformData, projectData, prepareData);
		} else {
			await this.$webpackCompilerService.compileWithoutWatch(platformData, projectData, prepareData);
			const hasNativeChanges = await this.$prepareNativePlatformService.prepareNativePlatform(platformData, projectData, prepareData);
			result = { hasNativeChanges, platform: prepareData.platform.toLowerCase() };
		}

		await this.writeRuntimePackageJson(projectData, platformData);
		await this.$projectChangesService.savePrepareInfo(platformData, projectData, prepareData);

		this.$logger.info(`Project successfully prepared (${prepareData.platform.toLowerCase()})`);

		return result;
	}

	@hook("watch")
	private async startWatchersWithPrepare(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<IPrepareResultData> {
		if (!this.watchersData[projectData.projectDir]) {
			this.watchersData[projectData.projectDir] = {};
		}

		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase]) {
			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase] = {
				nativeFilesWatcher: null,
				hasWebpackCompilerProcess: false
			};
		}

		await this.startJSWatcherWithPrepare(platformData, projectData, prepareData); // -> start watcher + initial compilation
		const hasNativeChanges = await this.startNativeWatcherWithPrepare(platformData, projectData, prepareData); // -> start watcher + initial prepare
		const result = { platform: platformData.platformNameLowerCase, hasNativeChanges };

		const hasPersistedDataWithNativeChanges = this.persistedData.find(data => data.platform === result.platform && data.hasNativeChanges);
		if (hasPersistedDataWithNativeChanges) {
			result.hasNativeChanges = true;
		}

		// TODO: Do not persist this in `this` context. Also it should be per platform.
		this.isInitialPrepareReady = true;

		if (this.persistedData && this.persistedData.length) {
			this.emitPrepareEvent({ files: [], hasOnlyHotUpdateFiles: false, hasNativeChanges: result.hasNativeChanges, hmrData: null, platform: platformData.platformNameLowerCase });
		}

		return result;
	}

	private async startJSWatcherWithPrepare(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<void> {
		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].hasWebpackCompilerProcess) {
			const handler = (data: any) => {
				if (data.platform.toLowerCase() === platformData.platformNameLowerCase) {
					this.emitPrepareEvent({ ...data, hasNativeChanges: false });
				}
			};

			this.webpackCompilerHandler = handler.bind(this);
			this.$webpackCompilerService.on(WEBPACK_COMPILATION_COMPLETE, this.webpackCompilerHandler);

			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].hasWebpackCompilerProcess = true;
			await this.$webpackCompilerService.compileWithWatch(platformData, projectData, prepareData);
		}
	}

	private async startNativeWatcherWithPrepare(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<boolean> {
		let newNativeWatchStarted = false;
		let hasNativeChanges = false;

		if (prepareData.watchNative) {
			newNativeWatchStarted = await this.startNativeWatcher(platformData, projectData);
		}

		if (newNativeWatchStarted) {
			hasNativeChanges = await this.$prepareNativePlatformService.prepareNativePlatform(platformData, projectData, prepareData);
		}

		return hasNativeChanges;
	}

	private async startNativeWatcher(platformData: IPlatformData, projectData: IProjectData): Promise<boolean> {
		if (this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher) {
			return false;
		}

		const patterns = await this.getWatcherPatterns(platformData, projectData);

		const watcherOptions: choki.WatchOptions = {
			ignoreInitial: true,
			cwd: projectData.projectDir,
			awaitWriteFinish: {
				pollInterval: 100,
				stabilityThreshold: 500
			},
			ignored: ["**/.*", ".*"] // hidden files
		};
		const watcher = choki.watch(patterns, watcherOptions)
			.on("all", async (event: string, filePath: string) => {
				filePath = path.join(projectData.projectDir, filePath);
				if (this.$watchIgnoreListService.isFileInIgnoreList(filePath)) {
					this.$watchIgnoreListService.removeFileFromIgnoreList(filePath);
				} else {
					this.$logger.info(`Chokidar raised event ${event} for ${filePath}.`);
					this.emitPrepareEvent({ files: [], hasOnlyHotUpdateFiles: false, hmrData: null, hasNativeChanges: true, platform: platformData.platformNameLowerCase });
				}
			});

		this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher = watcher;

		return true;
	}

	@hook('watchPatterns')
	public async getWatcherPatterns(platformData: IPlatformData, projectData: IProjectData): Promise<string[]> {
		const dependencies = this.$nodeModulesDependenciesBuilder.getProductionDependencies(projectData.projectDir)
			.filter(dep => dep.nativescript);
		const pluginsNativeDirectories = dependencies
			.map(dep => path.join(dep.directory, PLATFORMS_DIR_NAME, platformData.platformNameLowerCase));
		const pluginsPackageJsonFiles = dependencies.map(dep => path.join(dep.directory, PACKAGE_JSON_FILE_NAME));

		const patterns = [
			path.join(projectData.projectDir, PACKAGE_JSON_FILE_NAME),
			path.join(projectData.projectDir, CONFIG_FILE_NAME_JS),
			path.join(projectData.projectDir, CONFIG_FILE_NAME_TS),
			path.join(projectData.getAppDirectoryPath(), PACKAGE_JSON_FILE_NAME),
			path.join(projectData.getAppResourcesRelativeDirectoryPath(), platformData.normalizedPlatformName),
		]
			.concat(pluginsNativeDirectories)
			.concat(pluginsPackageJsonFiles);

		return patterns;
	}

	public async writeRuntimePackageJson(projectData: IProjectData, platformData: IPlatformData) {
		const nsConfig = this.$projectConfigService.readConfig(projectData.projectDir);
		const packageData = {
			...projectData.packageJsonData,
			...nsConfig,
			main: 'bundle'
		};
		delete packageData.dependencies;
		delete packageData.devDependencies;
		if (packageData.ios && packageData.ios.discardUncaughtJsExceptions) {
			packageData.discardUncaughtJsExceptions = packageData.ios.discardUncaughtJsExceptions;
		}
		if (packageData.android && packageData.android.discardUncaughtJsExceptions) {
			packageData.discardUncaughtJsExceptions = packageData.android.discardUncaughtJsExceptions;
		}
		let packagePath: string;
		if (platformData.platformNameLowerCase === 'ios') {
			packagePath = path.join(platformData.projectRoot, projectData.projectName, 'app', 'package.json');
		} else {
			packagePath = path.join(platformData.projectRoot, 'app', 'src', 'main', 'assets', 'app', 'package.json');
		}
		this.$logger.info('packagePath:', packagePath);
		this.$fs.writeJson(packagePath, packageData);
	}

	private emitPrepareEvent(filesChangeEventData: IFilesChangeEventData) {
		if (this.isInitialPrepareReady) {
			this.emit(PREPARE_READY_EVENT_NAME, filesChangeEventData);
		} else {
			this.persistedData.push(filesChangeEventData);
		}
	}

	@cache()
	private async trackRuntimeVersion(platform: string, projectData: IProjectData): Promise<void> {
		let runtimeVersion: string = null;
		try {
			if (projectData.devDependencies) {
				if (platform.toLowerCase() === 'ios') {
					runtimeVersion = projectData.devDependencies[SCOPED_IOS_RUNTIME_NAME] || projectData.devDependencies[TNS_IOS_RUNTIME_NAME];
				} else {
					runtimeVersion = projectData.devDependencies[SCOPED_ANDROID_RUNTIME_NAME] || projectData.devDependencies[TNS_ANDROID_RUNTIME_NAME];
				}
			}
		} catch (err) {
			this.$logger.trace(`Unable to get runtime version for project directory: ${projectData.projectDir} and platform ${platform}. Error is: `, err);
		}

		if (runtimeVersion) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.UsingRuntimeVersion,
				additionalData: `${platform.toLowerCase()}${AnalyticsEventLabelDelimiter}${runtimeVersion}`
			});
		}
	}
}
injector.register("prepareController", PrepareController);
