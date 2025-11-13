import {
	IChildProcess,
	IErrors,
	IHostInfo,
	ISpawnResult,
	ISpawnFromEventOptions,
} from "../../common/declarations";
import {
	IGradleCommandService,
	IGradleCommandOptions,
} from "../../definitions/gradle";
import { injector } from "../../common/yok";
import { quoteString } from "../../common/helpers";

export class GradleCommandService implements IGradleCommandService {
	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $logger: ILogger
	) {}

	public async executeCommand(
		gradleArgs: string[],
		options: IGradleCommandOptions
	): Promise<ISpawnResult> {
		const { message, cwd, stdio, spawnOptions } = options;
		this.$logger.info(message);

		const childProcessOptions = {
			cwd,
			stdio: stdio || "inherit",
			shell: this.$hostInfo.isWindows,
		};
		const gradleExecutable =
			options.gradlePath ??
			(this.$hostInfo.isWindows ? "gradlew.bat" : "./gradlew");

		const sanitizedGradleArgs = this.$hostInfo.isWindows
			? gradleArgs.map((arg) => quoteString(arg))
			: gradleArgs;
		const result = await this.executeCommandSafe(
			gradleExecutable,
			sanitizedGradleArgs,
			childProcessOptions,
			spawnOptions
		);

		return result;
	}

	private async executeCommandSafe(
		gradleExecutable: string,
		gradleArgs: string[],
		childProcessOptions: { cwd: string; stdio: string; shell: boolean },
		spawnOptions: ISpawnFromEventOptions
	): Promise<ISpawnResult> {
		try {
			const result = await this.$childProcess.spawnFromEvent(
				gradleExecutable,
				gradleArgs,
				"close",
				childProcessOptions,
				spawnOptions
			);

			return result;
		} catch (err) {
			this.$errors.fail(err.message);
		}
	}
}
injector.register("gradleCommandService", GradleCommandService);
