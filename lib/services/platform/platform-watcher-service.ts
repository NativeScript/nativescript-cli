import { EventEmitter } from "events";
import * as choki from "chokidar";
import * as path from "path";

interface IPlatformWatcherData {
	nativeWatcher: any;
	webpackCompilerProcess: any;
}

interface IFilesChangeData {
	files: string[];
	hasNativeChange: boolean;
}

export class PlatformWatcherService extends EventEmitter implements IPlatformWatcherService {
	private watchersData: IDictionary<IDictionary<IPlatformWatcherData>> = {};
	private isInitialSyncEventEmitted = false;
	private persistedFilesChangeData: IFilesChangeData[] = [];

	constructor(
		private $logger: ILogger,
		private $platformNativeService: IPreparePlatformService,
		private $webpackCompilerService: IWebpackCompilerService
	) { super(); }

	public async startWatcher(platformData: IPlatformData, projectData: IProjectData, startWatcherData: IStartWatcherData): Promise<void> {
		const { webpackCompilerConfig, preparePlatformData } = startWatcherData;

		this.$logger.out("Starting watchers...");

		if (!this.watchersData[projectData.projectDir]) {
			this.watchersData[projectData.projectDir] = {};
		}

		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase]) {
			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase] = {
				nativeWatcher: null,
				webpackCompilerProcess: null
			};
		}

		await this.startJsWatcher(platformData, projectData, webpackCompilerConfig); // -> start watcher + initial compilation
		await this.startNativeWatcher(platformData, projectData, preparePlatformData); // -> start watcher + initial prepare

		this.emitInitialSyncEvent();
	}

	private async startJsWatcher(platformData: IPlatformData, projectData: IProjectData, config: IWebpackCompilerConfig): Promise<void> {
		if (!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].webpackCompilerProcess) {
			this.$webpackCompilerService.on("webpackEmittedFiles", files => {
				this.emitFilesChangeEvent({ files, hasNativeChange: false });
			});

			const childProcess = await this.$webpackCompilerService.startWatcher(platformData, projectData, config);
			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].webpackCompilerProcess = childProcess;
		}
	}

	private async startNativeWatcher(platformData: IPlatformData, projectData: IProjectData, preparePlatformData: IPreparePlatformData): Promise<void> {
		if ((!preparePlatformData.nativePrepare || !preparePlatformData.nativePrepare.skipNativePrepare) &&
			!this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeWatcher) {
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
					this.emitFilesChangeEvent({ files: [], hasNativeChange: true });
				});

			this.watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeWatcher = watcher;

			await this.$platformNativeService.preparePlatform(platformData, projectData, preparePlatformData);
		}
	}

	private emitFilesChangeEvent(filesChangeData: IFilesChangeData) {
		if (this.isInitialSyncEventEmitted) {
			this.emit("fileChangeData", filesChangeData);
		} else {
			this.persistedFilesChangeData.push(filesChangeData);
		}
	}

	private emitInitialSyncEvent() {
		// TODO: Check the persisted data and add them in emitted event's data
		this.emit("onInitialSync", ({}));
		this.isInitialSyncEventEmitted = true;
	}
}
$injector.register("platformWatcherService", PlatformWatcherService);
