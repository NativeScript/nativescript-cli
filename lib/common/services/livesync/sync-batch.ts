// https://github.com/Microsoft/TypeScript/blob/master/src/compiler/tsc.ts#L487-L489
export const SYNC_WAIT_THRESHOLD = 250; //milliseconds

export class SyncBatch {
	private timer: NodeJS.Timer = null;
	private syncQueue: string[] = [];
	private syncInProgress: boolean = false;

	constructor(private $logger: ILogger,
		private $projectFilesManager: IProjectFilesManager,
		private done: () => Promise<void>) { }

	private get filesToSync(): string[] {
		const filteredFiles = _.remove(this.syncQueue, syncFile => this.$projectFilesManager.isFileExcluded(syncFile));
		this.$logger.trace("Removed files from syncQueue: ", filteredFiles);
		return this.syncQueue;
	}

	public get syncPending(): boolean {
		return this.syncQueue.length > 0;
	}

	public async syncFiles(syncAction: (filesToSync: string[]) => Promise<void>): Promise<void> {
		if (this.filesToSync.length > 0) {
			await syncAction(this.filesToSync);
			this.reset();
		}
	}

	public async addFile(file: string): Promise<void> {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		this.syncQueue.push(file);

		if (!this.syncInProgress) {
			this.timer = setTimeout(async () => {
				if (this.syncQueue.length > 0) {
					this.$logger.trace("Syncing %s", this.syncQueue.join(", "));
					try {
						this.syncInProgress = true;
						await this.done();
					} finally {
						this.syncInProgress = false;
					}
				}
				this.timer = null;
			}, SYNC_WAIT_THRESHOLD);
		}
	}

	private reset(): void {
		this.syncQueue = [];
	}
}
