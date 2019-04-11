import { ChildProcess } from "child_process";
import * as path from "path";
import { cache, exported } from "../common/decorators";

export class CleanupService implements ICleanupService {
	private static CLEANUP_PROCESS_START_TIMEOUT = 10 * 1000;
	private pathToCleanupLogFile: string;
	private cleanupProcess: ChildProcess;

	constructor($options: IOptions,
		private $staticConfig: Config.IStaticConfig,
		private $childProcess: IChildProcess) {
		this.pathToCleanupLogFile = $options.cleanupLogFile;
	}

	public shouldDispose = false;

	public async addCleanupAction(action: ICleanupAction): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<ICleanupProcessMessage>{ actionType: CleanupProcessMessageType.AddCleanAction, action });
	}

	public async removeCleanupAction(action: ICleanupAction): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<ICleanupProcessMessage>{ actionType: CleanupProcessMessageType.RemoveCleanAction, action });
	}

	public async addCleanupDeleteAction(filePath: string): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<ICleanupDeleteActionMessage>{ actionType: CleanupProcessMessageType.AddDeleteAction, filePath });
	}

	public async removeCleanupDeleteAction(filePath: string): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<ICleanupDeleteActionMessage>{ actionType: CleanupProcessMessageType.RemoveDeleteAction, filePath });
	}

	@exported("cleanupService")
	public setCleanupLogFile(filePath: string): void {
		this.pathToCleanupLogFile = filePath;
	}

	public dispose(): void {
		if (this.cleanupProcess && this.shouldDispose) {
			this.cleanupProcess.disconnect();
		}
	}

	public setShouldDispose(shouldDispose: boolean): void {
		this.shouldDispose = shouldDispose;
	}

	// TODO: Consider extracting this method to a separate service
	// as it has the same logic as the one used in analytics-service
	@cache()
	private getCleanupProcess(): Promise<ChildProcess> {
		return new Promise<ChildProcess>((resolve, reject) => {
			const cleanupProcessArgs = this.getCleanupProcessArgs();

			const cleanupProcess = this.$childProcess.spawn(process.execPath,
				cleanupProcessArgs,
				{
					stdio: ["ignore", "ignore", "ignore", "ipc"],
					detached: true
				}
			);

			cleanupProcess.unref();

			let isSettled = false;

			const timeoutId = setTimeout(() => {
				if (!isSettled) {
					reject(new Error("Unable to start Cleanup process."));
				}
			}, CleanupService.CLEANUP_PROCESS_START_TIMEOUT);

			cleanupProcess.on("error", (err: Error) => {
				clearTimeout(timeoutId);

				if (!isSettled) {
					isSettled = true;
					// In case we throw error here, CLI will break its execution.
					reject(err);
				}
			});

			cleanupProcess.on("message", (data: any) => {
				if (data === DetachedProcessMessages.ProcessReadyToReceive) {
					clearTimeout(timeoutId);

					if (!isSettled) {
						isSettled = true;
						this.cleanupProcess = cleanupProcess;
						resolve(cleanupProcess);
					}
				}
			});
		});
	}

	private getCleanupProcessArgs(): string[] {
		const cleanupProcessArgs = [
			path.join(__dirname, "..", "detached-processes", "cleanup-process.js"),
			this.$staticConfig.PATH_TO_BOOTSTRAP,
		];

		if (this.pathToCleanupLogFile) {
			cleanupProcessArgs.push(path.resolve(this.pathToCleanupLogFile));
		}

		return cleanupProcessArgs;
	}
}

$injector.register("cleanupService", CleanupService);
