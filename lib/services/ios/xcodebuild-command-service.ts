import * as constants from "../../constants";

export class XcodebuildCommandService implements IXcodebuildCommandService {
	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger
	) { }

	public async executeCommand(args: string[], options: { cwd: string, stdio: string, message?: string, spawnOptions?: any }): Promise<ISpawnResult> {
		const { message, cwd, stdio, spawnOptions } = options;
		this.$logger.info(message || "Xcode build...");

		const childProcessOptions = { cwd, stdio: stdio || "inherit" };

		try {
			const commandResult = await this.$childProcess.spawnFromEvent("xcodebuild",
				args,
				"exit",
				childProcessOptions,
				spawnOptions || { emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME }, throwError: true });

			return commandResult;
		} catch (err) {
			this.$errors.fail(err.message);
		}
	}
}
$injector.register("xcodebuildCommandService", XcodebuildCommandService);
