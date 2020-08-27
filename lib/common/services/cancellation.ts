import * as choki from "chokidar";
import * as path from "path";
import * as os from "os";
import * as _ from 'lodash';
import { IHostInfo, IFileSystem, IDictionary, ICancellationService, ErrorCodes } from "../declarations";
import { injector } from "../yok";

class CancellationService implements ICancellationService {
	private watches: IDictionary<choki.FSWatcher> = {};

	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $hostInfo: IHostInfo) {

		if (this.$hostInfo.isWindows) {
			this.$fs.createDirectory(CancellationService.killSwitchDir);
		}

	}

	public async begin(name: string): Promise<void> {
		if (!this.$hostInfo.isWindows) {
			return;
		}

		const triggerFile = CancellationService.makeKillSwitchFileName(name);

		if (!this.$fs.exists(triggerFile)) {
			this.$fs.writeFile(triggerFile, "");
		}

		this.$logger.trace("Starting watch on killswitch %s", triggerFile);

		const watcher = choki.watch(triggerFile, { ignoreInitial: true })
			.on("unlink", (filePath: string) => {
				this.$logger.info(`Exiting process as the file ${filePath} has been deleted. Probably reinstalling CLI while there's a working instance.`);
				process.exit(ErrorCodes.DELETED_KILL_FILE);
			});

		if (watcher) {
			this.watches[name] = watcher;
		}
	}

	public end(name: string): void {
		const watcher = this.watches[name];
		if (watcher) {
			delete this.watches[name];
			watcher.close().then().catch();
		}
	}

	public dispose(): void {
		_(this.watches).keys().each(name => this.end(name));
	}

	private static get killSwitchDir(): string {
		return path.join(os.tmpdir(), process.env.SUDO_USER || process.env.USER || process.env.USERNAME || '', "KillSwitches");
	}

	private static makeKillSwitchFileName(name: string): string {
		return path.join(CancellationService.killSwitchDir, name);
	}
}

injector.register("cancellation", CancellationService);
