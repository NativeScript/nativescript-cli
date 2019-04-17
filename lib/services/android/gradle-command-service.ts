export class GradleCommandService implements IGradleCommandService {
	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $hostInfo: IHostInfo,
		private $logger: ILogger
	) { }

	public async executeCommand(gradleArgs: string[], options: IGradleCommandOptions): Promise<ISpawnResult> {
		const { message, cwd, stdio = "inherit", spawnOptions } = options;
		this.$logger.info(message);

		const childProcessOptions = { cwd, stdio };
		const gradleExecutable = this.$hostInfo.isWindows ? "gradlew.bat" : "./gradlew";

		const result = await this.executeCommandSafe(gradleExecutable, gradleArgs, childProcessOptions, spawnOptions);

		return result;
	}

	private async executeCommandSafe(gradleExecutable: string, gradleArgs: string[], childProcessOptions: { cwd: string, stdio: string }, spawnOptions: ISpawnFromEventOptions) {
		try {
			const result = await this.$childProcess.spawnFromEvent(gradleExecutable, gradleArgs, "close", childProcessOptions, spawnOptions);

			return result;
		} catch (err) {
			this.$errors.failWithoutHelp(err.message);
		}
	}
}
$injector.register("gradleCommandService", GradleCommandService);
