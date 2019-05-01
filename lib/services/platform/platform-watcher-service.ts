import * as child_process from "child_process";
import * as choki from "chokidar";
import { EventEmitter } from "events";
import * as path from "path";
import { INITIAL_SYNC_EVENT_NAME, FILES_CHANGE_EVENT_NAME } from "../../constants";
import { PreparePlatformData } from "../workflow/workflow-data-service";

interface IPlatformWatcherData {
	webpackCompilerProcess: child_process.ChildProcess;
	nativeFilesWatcher: choki.FSWatcher;
}

export class PlatformWatcherService extends EventEmitter implements IPlatformWatcherService {
	private watchersData: IDictionary<IDictionary<IPlatformWatcherData>> = {};
	private isInitialSyncEventEmitted = false;
	private persistedFilesChangeEventData: IFilesChangeEventData[] = [];

	constructor(
		private $logger: ILogger,
		private $platformNativeService: IPreparePlatformService,
		private $webpackCompilerService: IWebpackCompilerService
	) { super(); }

	public async startWatcher(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<void> {
		this.$logger.out("Starting watchers...");

		if (!this.watchersData[projectData.projectDir]) {
			this.watchersData[projectData.projectDir] = {};
		}

		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase]) {
			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase] = {
				nativeFilesWatcher: null,
				webpackCompilerProcess: null
			};
		}

		await this.prepareJSCodeWithWatch(platformData, projectData, { env: preparePlatformData.env }); // -> start watcher + initial compilation
		const hasNativeChanges = await this.prepareNativeCodeWithWatch(platformData, projectData, preparePlatformData); // -> start watcher + initial prepare

		this.emitInitialSyncEvent({ platform: platformData.platformNameLowerCase, hasNativeChanges });
	}

	private async prepareJSCodeWithWatch(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void> {
		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].webpackCompilerProcess) {
			this.$webpackCompilerService.on("webpackEmittedFiles", files => {
				this.emitFilesChangeEvent({ files, hasNativeChanges: false, platform: platformData.platformNameLowerCase });
			});

			const childProcess = await this.$webpackCompilerService.compileWithWatch(platformData, projectData, config);
			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].webpackCompilerProcess = childProcess;
		}
	}

	private async prepareNativeCodeWithWatch(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: PreparePlatformData): Promise<boolean> {
		if ((preparePlatformData.nativePrepare && preparePlatformData.nativePrepare.skipNativePrepare) || this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher) {
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
				this.$logger.trace(`Chokidar raised event ${event} for ${filePath}.`);
				this.emitFilesChangeEvent({ files: [], hasNativeChanges: true, platform: platformData.platformNameLowerCase });
			});

		this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher = watcher;

		const hasNativeChanges = await this.$platformNativeService.preparePlatform(platformData, projectData, preparePlatformData);

		return hasNativeChanges;
	}

	private emitFilesChangeEvent(filesChangeEventData: IFilesChangeEventData) {
		if (this.isInitialSyncEventEmitted) {
			this.emit(FILES_CHANGE_EVENT_NAME, filesChangeEventData);
		} else {
			this.persistedFilesChangeEventData.push(filesChangeEventData);
		}
	}

	private emitInitialSyncEvent(initialSyncEventData: IInitialSyncEventData) {
		const hasPersistedDataWithNativeChanges = this.persistedFilesChangeEventData.find(data => data.platform === initialSyncEventData.platform && data.hasNativeChanges);
		if (hasPersistedDataWithNativeChanges) {
			initialSyncEventData.hasNativeChanges = true;
		}

		// TODO: Consider how to handle changed js files between initialSyncEvent and initial preperation of the project

		this.emit(INITIAL_SYNC_EVENT_NAME, initialSyncEventData);
		this.isInitialSyncEventEmitted = true;
	}
}
$injector.register("platformWatcherService", PlatformWatcherService);
