import { ChildProcess } from "child_process";
import * as path from "path";
import { cache, exported } from "../common/decorators";
import { IOptions } from "../declarations";
import { IChildProcess } from "../common/declarations";
import { ICleanupService } from "../definitions/cleanup-service";
import {
	IFileCleanupMessage, IJSCleanupMessage, IJSCommand,
	IRequestCleanupMessage,
	IRequestInfo,
	ISpawnCommandCleanupMessage,
	ISpawnCommandInfo
} from "../detached-processes/cleanup-process-definitions";

export class CleanupService implements ICleanupService {
	private static CLEANUP_PROCESS_START_TIMEOUT = 10 * 1000;
	private pathToCleanupLogFile: string;
	private cleanupProcess: ChildProcess;

	constructor($options: IOptions,
		private $staticConfig: Config.IStaticConfig,
		private $childProcess: IChildProcess) {
		this.pathToCleanupLogFile = $options.cleanupLogFile;
	}

	public shouldDispose = true;

	public async addCleanupCommand(commandInfo: ISpawnCommandInfo): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<ISpawnCommandCleanupMessage>{ messageType: CleanupProcessMessage.AddCleanCommand, commandInfo });
	}

	public async removeCleanupCommand(commandInfo: ISpawnCommandInfo): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<ISpawnCommandCleanupMessage>{ messageType: CleanupProcessMessage.RemoveCleanCommand, commandInfo });
	}

	public async addRequest(requestInfo: IRequestInfo): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<IRequestCleanupMessage>{ messageType: CleanupProcessMessage.AddRequest, requestInfo });
	}

	public async removeRequest(requestInfo: IRequestInfo): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<IRequestCleanupMessage>{ messageType: CleanupProcessMessage.RemoveRequest, requestInfo });
	}

	public async addCleanupDeleteAction(filePath: string): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<IFileCleanupMessage>{ messageType: CleanupProcessMessage.AddDeleteFileAction, filePath });
	}

	public async removeCleanupDeleteAction(filePath: string): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<IFileCleanupMessage>{ messageType: CleanupProcessMessage.RemoveDeleteFileAction, filePath });
	}

	public async addCleanupJS(jsCommand: IJSCommand): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<IJSCleanupMessage>{ messageType: CleanupProcessMessage.AddJSFileToRequire, jsCommand });
	}

	public async removeCleanupJS(jsCommand: IJSCommand): Promise<void> {
		const cleanupProcess = await this.getCleanupProcess();
		cleanupProcess.send(<IJSCleanupMessage>{ messageType: CleanupProcessMessage.RemoveJSFileToRequire, jsCommand });
	}

	public async addKillProcess(pid: string): Promise<void> {
		const killSpawnCommandInfo = this.getKillProcesSpawnInfo(pid);
		await this.addCleanupCommand(killSpawnCommandInfo);
	}

	public async removeKillProcess(pid: string): Promise<void> {
		const killSpawnCommandInfo = this.getKillProcesSpawnInfo(pid);
		await this.removeCleanupCommand(killSpawnCommandInfo);
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

	private getKillProcesSpawnInfo(pid: string): ISpawnCommandInfo {
		let command;
		let args;
		switch (process.platform) {
			case 'win32':
				command = "taskkill";
				args = ["/pid", pid, "/T", "/F"];
				break;

			default:
				command = path.join(__dirname, '../bash-scripts/terminateProcess.sh');
				args = [pid];
				break;
		}

		return {
			command,
			args
		};
	}
}

$injector.register("cleanupService", CleanupService);
