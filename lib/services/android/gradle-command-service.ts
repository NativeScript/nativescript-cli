import { IChildProcess, IErrors, IHostInfo, ISpawnResult, ISpawnFromEventOptions } from "../../common/declarations";
import { IGradleCommandService, IGradleCommandOptions } from "../../definitions/gradle";
import { injector } from "../../common/yok";

export class GradleCommandService implements IGradleCommandService {
	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $logger: ILogger
	) { }

	public async executeCommand(gradleArgs: string[], options: IGradleCommandOptions): Promise<ISpawnResult> {
		const { message, cwd, stdio, spawnOptions } = options;
		this.$logger.info(message);

		const childProcessOptions = { cwd, stdio: stdio || "inherit" };
		const gradleExecutable = this.$hostInfo.isWindows ? "gradlew.bat" : "./gradlew";

		const result = await this.executeCommandSafe(gradleExecutable, gradleArgs, childProcessOptions, spawnOptions);

		return result;
	}

	private async executeCommandSafe(gradleExecutable: string, gradleArgs: string[], childProcessOptions: { cwd: string, stdio: string }, spawnOptions: ISpawnFromEventOptions): Promise<ISpawnResult> {
		try {
			const result = await this.$childProcess.spawnFromEvent(gradleExecutable, gradleArgs, "close", childProcessOptions, spawnOptions);

			return result;
		} catch (err) {
			this.$errors.fail(err.message);
		}
	}
}
injector.register("gradleCommandService", GradleCommandService);
