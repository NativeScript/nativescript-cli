import * as child_process from "child_process";
import * as choki from "chokidar";
import { hook } from "../common/helpers";
import { performanceLog } from "../common/decorators";
import { EventEmitter } from "events";
import * as path from "path";
import { PREPARE_READY_EVENT_NAME, WEBPACK_COMPILATION_COMPLETE } from "../constants";

interface IPlatformWatcherData {
	webpackCompilerProcess: child_process.ChildProcess;
	nativeFilesWatcher: choki.FSWatcher;
}

export class PrepareController extends EventEmitter {
	private watchersData: IDictionary<IDictionary<IPlatformWatcherData>> = {};
	private isInitialPrepareReady = false;
	private persistedData: IFilesChangeEventData[] = [];

	constructor(
		private $platformController: IPlatformController,
		public $hooksService: IHooksService,
		private $logger: ILogger,
		private $platformsDataService: IPlatformsDataService,
		private $prepareNativePlatformService: IPrepareNativePlatformService,
		private $projectChangesService: IProjectChangesService,
		private $projectDataService: IProjectDataService,
		private $webpackCompilerService: IWebpackCompilerService
	) { super(); }

	@performanceLog()
	@hook("prepare")
	public async prepare(prepareData: IPrepareData): Promise<IPrepareResultData> {
		await this.$platformController.addPlatformIfNeeded(prepareData);

		this.$logger.out("Preparing project...");
		let result = null;

		const projectData = this.$projectDataService.getProjectData(prepareData.projectDir);
		const platformData = this.$platformsDataService.getPlatformData(prepareData.platform, projectData);

		if (prepareData.watch) {
			result = await this.startWatchersWithPrepare(platformData, projectData, prepareData);
		} else {
			await this.$webpackCompilerService.compileWithoutWatch(platformData, projectData, { watch: false, env: prepareData.env });
			await this.$prepareNativePlatformService.prepareNativePlatform(platformData, projectData, prepareData);
		}

		this.$projectChangesService.savePrepareInfo(platformData);

		this.$logger.out(`Project successfully prepared (${prepareData.platform.toLowerCase()})`);

		return result;
	}

	public stopWatchers(projectDir: string, platform: string): void {
		const platformLowerCase = platform.toLowerCase();

		if (this.watchersData && this.watchersData[projectDir] && this.watchersData[projectDir][platformLowerCase] && this.watchersData[projectDir][platformLowerCase].nativeFilesWatcher) {
			this.watchersData[projectDir][platformLowerCase].nativeFilesWatcher.close();
			this.watchersData[projectDir][platformLowerCase].nativeFilesWatcher = null;
		}

		if (this.watchersData && this.watchersData[projectDir] && this.watchersData[projectDir][platformLowerCase] && this.watchersData[projectDir][platformLowerCase].webpackCompilerProcess) {
			this.$webpackCompilerService.stopWebpackCompiler(platform);
			this.watchersData[projectDir][platformLowerCase].webpackCompilerProcess = null;
		}
	}

	@hook("watch")
	private async startWatchersWithPrepare(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<IPrepareResultData> {
		if (!this.watchersData[projectData.projectDir]) {
			this.watchersData[projectData.projectDir] = {};
		}

		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase]) {
			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase] = {
				nativeFilesWatcher: null,
				webpackCompilerProcess: null
			};
		}

		await this.startJSWatcherWithPrepare(platformData, projectData, { env: prepareData.env }); // -> start watcher + initial compilation
		const hasNativeChanges = await this.startNativeWatcherWithPrepare(platformData, projectData, prepareData); // -> start watcher + initial prepare

		const result = { platform: platformData.platformNameLowerCase, hasNativeChanges };
		const hasPersistedDataWithNativeChanges = this.persistedData.find(data => data.platform === result.platform && data.hasNativeChanges);
		if (hasPersistedDataWithNativeChanges) {
			result.hasNativeChanges = true;
		}

		this.isInitialPrepareReady = true;

		if (this.persistedData && this.persistedData.length) {
			this.emitPrepareEvent({ files: [], hasNativeChanges: result.hasNativeChanges, hmrData: null, platform: platformData.platformNameLowerCase });
		}

		return result;
	}

	private async startJSWatcherWithPrepare(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void> {
		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].webpackCompilerProcess) {
			this.$webpackCompilerService.on(WEBPACK_COMPILATION_COMPLETE, data => {
				this.emitPrepareEvent({ ...data, hasNativeChanges: false, platform: platformData.platformNameLowerCase });
			});

			const childProcess = await this.$webpackCompilerService.compileWithWatch(platformData, projectData, config);
			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].webpackCompilerProcess = childProcess;
		}
	}

	private async startNativeWatcherWithPrepare(platformData: IPlatformData, projectData: IProjectData, prepareData: IPrepareData): Promise<boolean> {
		if ((prepareData.nativePrepare && prepareData.nativePrepare.skipNativePrepare) || this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher) {
			return false;
		}

		const patterns = [
			path.join(projectData.getAppResourcesRelativeDirectoryPath(), platformData.normalizedPlatformName),
			`node_modules/**/platforms/${platformData.platformNameLowerCase}/`
		];
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
				this.$logger.info(`Chokidar raised event ${event} for ${filePath}.`);
				this.emitPrepareEvent({ files: [], hmrData: null, hasNativeChanges: true, platform: platformData.platformNameLowerCase });
			});

		this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher = watcher;

		const hasNativeChanges = await this.$prepareNativePlatformService.prepareNativePlatform(platformData, projectData, prepareData);

		return hasNativeChanges;
	}

	private emitPrepareEvent(filesChangeEventData: IFilesChangeEventData) {
		if (this.isInitialPrepareReady) {
			this.emit(PREPARE_READY_EVENT_NAME, filesChangeEventData);
		} else {
			this.persistedData.push(filesChangeEventData);
		}
	}
}
$injector.register("prepareController", PrepareController);
